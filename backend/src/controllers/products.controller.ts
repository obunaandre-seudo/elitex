import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { searchProducts, getProductDetail, applyMarkup } from '../utils/cjdropshipping';
import { CJ_PRODUCT_MARKUP_PERCENT, normalizeVisibleCjProduct } from '../utils/productPricing';
import slugify from '../utils/slugify';
import { isDatabaseUnavailable } from '../utils/dbFallback';
import { AuthedRequest } from '../middleware/auth';
import { deleteCloudinaryImages, uploadProductImages, UploadedCloudinaryImage } from '../services/cloudinary.service';
import {
  buildExternalProductImages,
  GIFT_IDEAS_CATEGORY_SLUG,
  getAdminProductCategoryName,
  getImageStoragePolicy,
  normalizeExternalImageUrls,
  resolveAdminProductCategorySlug,
  SEXUAL_WELLNESS_CATEGORY_SLUG,
} from '../services/imageStoragePolicy.service';
import { ADMIN_PRODUCT_PREFIX, isAdminCreatedProductId } from '../utils/productPricing';

function isAdminCreatedProduct(product: { aliexpressId: string | null }) {
  return isAdminCreatedProductId(product.aliexpressId);
}

function isAdminCreatedSexualWellnessProduct(product: { aliexpressId: string | null; category?: { slug?: string | null } | null }) {
  return isAdminCreatedProduct(product) && product.category?.slug === SEXUAL_WELLNESS_CATEGORY_SLUG;
}

function mergeCatalog(products: Array<any>) {
  const adminCreated: any[] = [];
  const regular: any[] = [];

  for (const product of products) {
    if (isAdminCreatedProduct(product)) adminCreated.push(product);
    else regular.push(product);
  }

  return [...adminCreated, ...regular];
}

function toNumber(value: unknown, fallback = 0) {
  const n = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildAdminProductId() {
  return `${ADMIN_PRODUCT_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}
function isNonEmptyString(value: string | null | undefined): value is string {
  return Boolean(value);
}
function applyVisiblePricing(product: any) {
  return normalizeVisibleCjProduct(product);
}

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, search, sort, page = '1', pageSize = '12' } = req.query as Record<string, string>;
    const take = Math.min(parseInt(pageSize, 10) || 12, 1000);
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (currentPage - 1) * take;

    const where: any = { isActive: true };
    if (category) where.category = { slug: category };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy =
      sort === 'price_asc' ? { sellingPrice: 'asc' as const } :
      sort === 'price_desc' ? { sellingPrice: 'desc' as const } :
      sort === 'rating' ? { ratingAverage: 'desc' as const } :
      { createdAt: 'desc' as const };

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: { images: true, category: true },
    });

    const merged = mergeCatalog(products).map(applyVisiblePricing);
    const paged = merged.slice(skip, skip + take);

    res.json({ products: paged, total: merged.length, page: currentPage, pageSize: take });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }

    return res.status(503).json({ error: 'Catalog database temporarily unavailable.' });
  }
}

export async function getProductBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, isActive: true },
      include: { images: true, variants: true, category: true, reviews: { include: { user: true } } },
    });
    if (!product) throw new AppError('Product not found.', 404);

    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId ?? undefined,
        id: { not: product.id },
        isActive: true,
      },
      take: 4,
      include: { images: true },
    });

    res.json({ product: applyVisiblePricing(product), related: related.map(applyVisiblePricing) });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }

    return res.status(503).json({ error: 'Catalog temporarily unavailable.' });
  }
}

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        products: {
          some: {
            isActive: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ categories });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }
    return res.status(503).json({ error: 'Catalog database temporarily unavailable.' });
  }
}

export async function syncFromCjDropshipping(req: Request, res: Response, next: NextFunction) {
  const { keyword = '' } = req.body as { keyword?: string };
  const remoteProducts = await searchProducts(keyword);

  try {
    const log = await prisma.aliExpressSyncLog.create({ data: { status: 'PARTIAL', itemsSynced: 0 } });
    const markupPercent = CJ_PRODUCT_MARKUP_PERCENT;

    let synced = 0;
    for (const rp of remoteProducts) {
      const sourceBasePrice = roundCurrency(rp.basePrice);
      const basePrice = sourceBasePrice;
      const sellingPrice = applyMarkup(basePrice, markupPercent);

      let category = await prisma.category.findUnique({ where: { name: rp.category } });
      if (!category) {
        category = await prisma.category.create({
          data: { name: rp.category, slug: slugify(rp.category) },
        });
      }

      const cjProductId = rp.cjProductId;
      const slug = slugify(rp.title) + '-' + cjProductId.slice(-4);

      await prisma.product.upsert({
        where: { aliexpressId: cjProductId },
        update: {
          title: rp.title,
          description: rp.description,
          sourceBasePrice,
          basePrice,
          markupPercent,
          sellingPrice,
          currency: 'NGN',
          stock: rp.stock,
          ratingAverage: rp.ratingAverage,
          ratingCount: rp.ratingCount,
          categoryId: category.id,
          images: {
            deleteMany: {},
            create: rp.images.map((url: string, i: number) => ({ url, position: i })),
          },
          variants: {
            deleteMany: {},
            create: rp.variants.map((v: any) => ({
              sku: v.sku,
              name: v.name,
              priceDelta: roundCurrency(Number(v.priceDelta ?? 0)),
              stock: v.stock,
              attributes: v.attributes,
            })),
          },
        },
        create: {
          aliexpressId: cjProductId,
          title: rp.title,
          slug,
          description: rp.description,
          sourceBasePrice,
          basePrice,
          markupPercent,
          sellingPrice,
          currency: 'NGN',
          stock: rp.stock,
          ratingAverage: rp.ratingAverage,
          ratingCount: rp.ratingCount,
          categoryId: category.id,
          images: { create: rp.images.map((url: string, i: number) => ({ url, position: i })) },
          variants: {
            create: rp.variants.map((v: any) => ({
              sku: v.sku,
              name: v.name,
              priceDelta: roundCurrency(Number(v.priceDelta ?? 0)),
              stock: v.stock,
              attributes: v.attributes,
            })),
          },
        },
      });

      synced += 1;
    }

    await prisma.aliExpressSyncLog.update({
      where: { id: log.id },
      data: { itemsSynced: synced, finishedAt: new Date(), status: 'SUCCESS' },
    });

    res.json({ message: `Synced ${synced} product(s) into Premium Collection.`, synced });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }

    return res.status(503).json({
      error: 'Database unavailable. Premium Collection products were not stored.',
      synced: 0,
    });
  }
}

export async function createAdminProduct(req: AuthedRequest, res: Response, next: NextFunction) {
  const { name, price, stock, description, discountPercent, categorySlug: requestedCategorySlug, imageUrls } = req.body as {
    name?: string;
    price?: string | number;
    stock?: string | number;
    description?: string;
    discountPercent?: string | number;
    categorySlug?: string;
    imageUrls?: string | string[];
  };
  let uploadedImages: UploadedCloudinaryImage[] = [];

  try {
    const title = String(name ?? '').trim();
    const writeUp = String(description ?? '').trim();
    const numericPrice = toNumber(price, NaN);
    const numericStock = Math.max(0, Math.floor(toNumber(stock, 0)));
    const numericDiscount = Math.min(100, Math.max(0, toNumber(discountPercent, 0)));
    const categorySlug = resolveAdminProductCategorySlug(requestedCategorySlug);
    if (categorySlug !== GIFT_IDEAS_CATEGORY_SLUG) {
      throw new AppError('Use the dedicated Sexual Wellness product endpoint for Sexual Wellness products.');
    }
    const imagePolicy = getImageStoragePolicy(categorySlug);
    const imageFiles = Array.isArray(req.files) ? req.files : [];
    const externalImageUrls = normalizeExternalImageUrls(imageUrls);

    if (!title) throw new AppError('Product name is required.');
    if (!writeUp) throw new AppError('Product description is required.');
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) throw new AppError('Product price must be greater than zero.');

    if (!imagePolicy.allowCloudinaryUpload && imageFiles.length) {
      throw new AppError('Sexual Wellness products require external HTTPS image URLs. File uploads to Cloudinary are not allowed.');
    }

    const externalImages = buildExternalProductImages(externalImageUrls, imagePolicy);

    if (imagePolicy.allowCloudinaryUpload && !imageFiles.length) {
      throw new AppError('At least one product image is required.');
    }

    const basePrice = Math.round(numericPrice * 100) / 100;
    const sellingPrice = Math.max(0, Math.round(basePrice * (1 - numericDiscount / 100) * 100) / 100);
    const aliexpressId = buildAdminProductId();
    const slug = slugify(title) + '-' + aliexpressId.slice(-6);
    uploadedImages = imagePolicy.allowCloudinaryUpload ? await uploadProductImages(imageFiles, slug, imagePolicy) : [];
    const imageCreateData = imagePolicy.allowCloudinaryUpload
      ? uploadedImages.map((image, index) => ({ url: image.secureUrl, publicId: image.publicId, position: index }))
      : externalImages;

    const product = await prisma.$transaction(async (tx) => {
      const category = await tx.category.upsert({
        where: { slug: categorySlug },
        update: {},
        create: { name: getAdminProductCategoryName(categorySlug), slug: categorySlug },
      });

      const createdProduct = await tx.product.create({
        data: {
          aliexpressId,
          title,
          slug,
          description: writeUp,
          basePrice,
          markupPercent: 0,
          sellingPrice,
          currency: 'NGN',
          stock: numericStock,
          ratingAverage: 0,
          ratingCount: 0,
          categoryId: category.id,
          images: {
            create: imageCreateData,
          },
        },
        include: { images: true, category: true },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user?.sub,
          action: 'CREATE_GIFT_IDEAS_PRODUCT',
          entity: 'Product',
          entityId: createdProduct.id,
          metadata: {
            title,
            price: basePrice,
            sellingPrice,
            stock: numericStock,
            discountPercent: numericDiscount,
            categorySlug,
          },
        },
      });

      return createdProduct;
    });

    res.status(201).json({ product, message: 'Product created successfully.' });
  } catch (err) {
    await deleteCloudinaryImages(uploadedImages.map((image) => image.publicId));

    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }
    return res.status(503).json({ error: 'Database unavailable. Product images were not stored.' });
  }
}

export async function createSexualWellnessProduct(req: AuthedRequest, res: Response, next: NextFunction) {
  const { name, price, stock, description, discountPercent, categorySlug: requestedCategorySlug, imageUrls } = req.body as {
    name?: string;
    price?: string | number;
    stock?: string | number;
    description?: string;
    discountPercent?: string | number;
    categorySlug?: string;
    imageUrls?: string | string[];
  };

  try {
    const title = String(name ?? '').trim();
    const writeUp = String(description ?? '').trim();
    const numericPrice = toNumber(price, NaN);
    const numericStock = Math.max(0, Math.floor(toNumber(stock, 0)));
    const numericDiscount = Math.min(100, Math.max(0, toNumber(discountPercent, 0)));
    const categorySlug = resolveAdminProductCategorySlug(requestedCategorySlug);

    if (categorySlug !== SEXUAL_WELLNESS_CATEGORY_SLUG) {
      throw new AppError('Sexual Wellness products must use the sexual-wellness category.');
    }

    const imagePolicy = getImageStoragePolicy(categorySlug);
    const imageFiles = Array.isArray(req.files) ? req.files : [];

    if (!title) throw new AppError('Product name is required.');
    if (!writeUp) throw new AppError('Product description is required.');
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) throw new AppError('Product price must be greater than zero.');

    const externalImages = buildExternalProductImages(normalizeExternalImageUrls(imageUrls), imagePolicy);
    const fileImages = imageFiles.map((file: any, position) => ({ url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`, publicId: null, position }));
    const imageRows = fileImages.length ? fileImages : externalImages;
    if (!imageRows.length) throw new AppError('Choose at least one image file.');
    const basePrice = Math.round(numericPrice * 100) / 100;
    const sellingPrice = Math.max(0, Math.round(basePrice * (1 - numericDiscount / 100) * 100) / 100);
    const aliexpressId = buildAdminProductId();
    const slug = slugify(title) + '-' + aliexpressId.slice(-6);

    const product = await prisma.$transaction(async (tx) => {
      const category = await tx.category.upsert({
        where: { slug: categorySlug },
        update: {},
        create: { name: getAdminProductCategoryName(categorySlug), slug: categorySlug },
      });

      const createdProduct = await tx.product.create({
        data: {
          aliexpressId,
          title,
          slug,
          description: writeUp,
          basePrice,
          markupPercent: 0,
          sellingPrice,
          currency: 'NGN',
          stock: numericStock,
          ratingAverage: 0,
          ratingCount: 0,
          categoryId: category.id,
          images: { create: imageRows },
        },
        include: { images: true, category: true, variants: true },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user?.sub,
          action: 'CREATE_SEXUAL_WELLNESS_PRODUCT',
          entity: 'Product',
          entityId: createdProduct.id,
          metadata: { title, price: basePrice, sellingPrice, stock: numericStock, discountPercent: numericDiscount, categorySlug },
        },
      });

      return createdProduct;
    }, { maxWait: 10000, timeout: 20000 });

    res.status(201).json({ product, message: 'Sexual Wellness product created successfully.' });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }
    return res.status(503).json({ error: 'Database unavailable. Product images were not stored.' });
  }
}

export async function updateAdminProduct(req: AuthedRequest, res: Response, next: NextFunction) {
  const { name, price, stock, description, discountPercent, categorySlug: requestedCategorySlug, imageUrls } = req.body as {
    name?: string;
    price?: string | number;
    stock?: string | number;
    description?: string;
    discountPercent?: string | number;
    categorySlug?: string;
    imageUrls?: string | string[];
  };
  let uploadedImages: UploadedCloudinaryImage[] = [];

  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id }, include: { images: true, category: true } });
    if (!existing) throw new AppError('Product not found.', 404);
    if (!isAdminCreatedProduct(existing)) throw new AppError('Only admin-created products can be edited here.', 400);

    const title = String(name ?? existing.title).trim();
    const writeUp = String(description ?? existing.description).trim();
    const numericPrice = toNumber(price, Number(existing.basePrice));
    const numericStock = Math.max(0, Math.floor(toNumber(stock, existing.stock)));
    const numericDiscount = Math.min(100, Math.max(0, toNumber(discountPercent, 0)));
    const categorySlug = resolveAdminProductCategorySlug(requestedCategorySlug ?? existing.category?.slug);
    const imagePolicy = getImageStoragePolicy(categorySlug);
    const imageFiles = Array.isArray(req.files) ? req.files : [];
    const externalImageUrls = normalizeExternalImageUrls(imageUrls);

    if (!title) throw new AppError('Product name is required.');
    if (!writeUp) throw new AppError('Product description is required.');
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) throw new AppError('Product price must be greater than zero.');

    if (!imagePolicy.allowCloudinaryUpload && imageFiles.length) {
      throw new AppError('Sexual Wellness products require external HTTPS image URLs. File uploads to Cloudinary are not allowed.');
    }

    const basePrice = Math.round(numericPrice * 100) / 100;
    const sellingPrice = Math.max(0, Math.round(basePrice * (1 - numericDiscount / 100) * 100) / 100);
    const slug = isAdminCreatedProduct(existing) ? slugify(title) + '-' + (existing.aliexpressId?.slice(-6) ?? existing.id.slice(0, 6)) : existing.slug;
    const existingExternalImages = existing.images
      .filter((image) => !image.publicId)
      .map((image, position) => ({ url: image.url, publicId: null, position }));
    const externalImages = externalImageUrls.length
      ? buildExternalProductImages(externalImageUrls, imagePolicy)
      : imagePolicy.requireExternalHttpsUrl
        ? buildExternalProductImages(existingExternalImages.map((image) => image.url), imagePolicy)
        : [];
    uploadedImages = imagePolicy.allowCloudinaryUpload && imageFiles.length ? await uploadProductImages(imageFiles, slug, imagePolicy) : [];
    const shouldReplaceImages = uploadedImages.length > 0 || externalImages.length > 0;
    const replacedImagePublicIds = shouldReplaceImages ? existing.images.map((image) => image.publicId).filter(isNonEmptyString) : [];
    const imageCreateData = imagePolicy.allowCloudinaryUpload
      ? uploadedImages.map((image, index) => ({ url: image.secureUrl, publicId: image.publicId, position: index }))
      : externalImages;

    const product = await prisma.$transaction(async (tx) => {
      const category = await tx.category.upsert({
        where: { slug: categorySlug },
        update: {},
        create: { name: getAdminProductCategoryName(categorySlug), slug: categorySlug },
      });

      const updatedProduct = await tx.product.update({
        where: { id: existing.id },
        data: {
          title,
          slug,
          description: writeUp,
          basePrice,
          sellingPrice,
          stock: numericStock,
          sourceBasePrice: null,
          categoryId: category.id,
          images: shouldReplaceImages
            ? {
                deleteMany: {},
                create: imageCreateData,
              }
            : undefined,
        },
        include: { images: true, category: true },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user?.sub,
          action: categorySlug === 'sexual-wellness' ? 'UPDATE_SEXUAL_WELLNESS_PRODUCT' : 'UPDATE_ADMIN_PRODUCT',
          entity: 'Product',
          entityId: updatedProduct.id,
          metadata: { title, price: basePrice, sellingPrice, stock: numericStock, discountPercent: numericDiscount, categorySlug },
        },
      });

      return updatedProduct;
    });

    await deleteCloudinaryImages(replacedImagePublicIds);
    res.json({ product, message: 'Product updated successfully.' });
  } catch (err) {
    await deleteCloudinaryImages(uploadedImages.map((image) => image.publicId));

    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }
    return res.status(503).json({ error: 'Database unavailable. Product images were not stored.' });
  }
}

export async function getProductDetailPreview(req: Request, res: Response, next: NextFunction) {
  try {
    const detail = await getProductDetail(req.params.cjProductId);
    if (!detail) throw new AppError('Product not found in Premium Collection.', 404);
    res.json({ product: normalizeVisibleCjProduct(detail) });
  } catch (err) {
    next(err);
  }
}











