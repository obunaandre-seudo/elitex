import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { searchProducts, getProductDetail, applyMarkup } from '../utils/cjdropshipping';
import { convertCjUsdToNgn, normalizeVisibleCjProduct } from '../utils/productPricing';
import { env } from '../config/env';
import slugify from '../utils/slugify';
import { isDatabaseUnavailable } from '../utils/dbFallback';
import { AuthedRequest } from '../middleware/auth';

const MANUAL_PRODUCT_PREFIX = 'MANUAL-';
const SEXUAL_WELLNESS_SLUG = 'sexual-wellness';
const GIFT_IDEAS_SLUG = 'gift-ideas';
const MANUAL_CATEGORY_META = {
  [SEXUAL_WELLNESS_SLUG]: { name: 'Sexual Wellness', slug: SEXUAL_WELLNESS_SLUG },
  [GIFT_IDEAS_SLUG]: { name: 'Gift Ideas', slug: GIFT_IDEAS_SLUG },
} as const;

type ManualCategorySlug = keyof typeof MANUAL_CATEGORY_META;

function normalizeManualCategorySlug(value?: string): ManualCategorySlug {
  return value === GIFT_IDEAS_SLUG ? GIFT_IDEAS_SLUG : SEXUAL_WELLNESS_SLUG;
}

function getManualCategoryName(slug: ManualCategorySlug) {
  return MANUAL_CATEGORY_META[slug].name;
}

function isManualProduct(product: { aliexpressId: string | null }) {
  return Boolean(product.aliexpressId && product.aliexpressId.startsWith(MANUAL_PRODUCT_PREFIX));
}

function mergeCatalog(products: Array<any>) {
  const manual: any[] = [];
  const regular: any[] = [];

  for (const product of products) {
    if (isManualProduct(product)) manual.push(product);
    else regular.push(product);
  }

  return [...manual, ...regular];
}

function toNumber(value: unknown, fallback = 0) {
  const n = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildImageUrl(imageDataUrl?: string, imageUrl?: string) {
  if (imageDataUrl?.trim()) return imageDataUrl.trim();
  if (imageUrl?.trim()) return imageUrl.trim();
  return '';
}

function buildManualProductId() {
  return `${MANUAL_PRODUCT_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
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
    const markupSetting = await prisma.setting.findUnique({ where: { key: 'MARKUP_PERCENT_DEFAULT' } });
    const rateSetting = await prisma.setting.findUnique({ where: { key: 'CJ_USD_TO_NGN_RATE' } });
    const markupPercent = 100;
    const cjUsdToNgnRate = rateSetting ? parseFloat(rateSetting.value) : env.cj.usdToNgnRate;

    let synced = 0;
    for (const rp of remoteProducts) {
      console.log("CJ PRODUCT:", {
  title: rp.title,
  basePrice: rp.basePrice,
  currency: rp.currency,
});
      const sourceBasePrice = roundCurrency(rp.basePrice);
      const basePrice = roundCurrency(sourceBasePrice * cjUsdToNgnRate);
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
              priceDelta: roundCurrency(Number(v.priceDelta ?? 0) * cjUsdToNgnRate),
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
          stock: rp.stock,
          ratingAverage: rp.ratingAverage,
          ratingCount: rp.ratingCount,
          categoryId: category.id,
          images: { create: rp.images.map((url: string, i: number) => ({ url, position: i })) },
          variants: {
            create: rp.variants.map((v: any) => ({
              sku: v.sku,
              name: v.name,
              priceDelta: roundCurrency(Number(v.priceDelta ?? 0) * cjUsdToNgnRate),
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

    res.json({ message: `Synced ${synced} product(s) from CJ Dropshipping.`, synced });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }

    return res.status(503).json({
      error: 'Database unavailable. CJ products were not stored.',
      synced: 0,
    });
  }
}

export async function createManualProduct(req: AuthedRequest, res: Response, next: NextFunction) {
  const { name, price, stock, description, discountPercent, imageDataUrl, imageUrl, categorySlug: requestedCategorySlug } = req.body as {
    name?: string;
    price?: string | number;
    stock?: string | number;
    description?: string;
    discountPercent?: string | number;
    imageDataUrl?: string;
    imageUrl?: string;
    categorySlug?: string;
  };

  try {
    const title = String(name ?? '').trim();
    const writeUp = String(description ?? '').trim();
    const numericPrice = toNumber(price, NaN);
    const numericStock = Math.max(0, Math.floor(toNumber(stock, 0)));
    const numericDiscount = Math.min(100, Math.max(0, toNumber(discountPercent, 0)));
    const resolvedImage = buildImageUrl(imageDataUrl, imageUrl);
    const categorySlug = normalizeManualCategorySlug(requestedCategorySlug);

    if (!title) throw new AppError('Product name is required.');
    if (!writeUp) throw new AppError('Product description is required.');
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) throw new AppError('Product price must be greater than zero.');
    if (!resolvedImage) throw new AppError('Product image is required.');

    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: {},
      create: { name: getManualCategoryName(categorySlug), slug: categorySlug },
    });

    const basePrice = Math.round(numericPrice * 100) / 100;
    const sellingPrice = Math.max(0, Math.round(basePrice * (1 - numericDiscount / 100) * 100) / 100);
    const aliexpressId = buildManualProductId();
    const slug = slugify(title) + '-' + aliexpressId.slice(-6);

    const product = await prisma.product.create({
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
          create: [{ url: resolvedImage, position: 0 }],
        },
      },
      include: { images: true, category: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.sub,
        action: 'CREATE_MANUAL_PRODUCT',
        entity: 'Product',
        entityId: product.id,
        metadata: {
          title,
          price: basePrice,
          sellingPrice,
          stock: numericStock,
          discountPercent: numericDiscount,
        },
      },
    });

    res.status(201).json({ product, message: 'Manual product created successfully.' });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }

    const offlineCategorySlug = normalizeManualCategorySlug(requestedCategorySlug);
    return res.status(201).json({
      product: {
        id: 'offline-' + Date.now(),
        aliexpressId: buildManualProductId(),
        title: name,
        slug: slugify(String(name ?? 'product')),
        description,
        sourceBasePrice: null,
        basePrice: toNumber(price, 0),
        markupPercent: 0,
        sellingPrice: Math.max(0, Math.round(toNumber(price, 0) * (1 - toNumber(discountPercent, 0) / 100) * 100) / 100),
        currency: 'NGN',
        stock: Math.max(0, Math.floor(toNumber(stock, 0))),
        ratingAverage: 0,
        ratingCount: 0,
        categoryId: null,
        category: { id: 'offline-' + offlineCategorySlug, name: getManualCategoryName(offlineCategorySlug), slug: offlineCategorySlug },
        images: [{ id: 'offline-' + Date.now() + '-image', productId: 'offline-' + Date.now(), url: imageDataUrl || imageUrl || '', altText: null, position: 0 }],
      },
      message: 'Manual product created in offline mode.',
    });
  }
}

export async function updateManualProduct(req: AuthedRequest, res: Response, next: NextFunction) {
  const { name, price, stock, description, discountPercent, imageDataUrl, imageUrl, categorySlug: requestedCategorySlug } = req.body as {
    name?: string;
    price?: string | number;
    stock?: string | number;
    description?: string;
    discountPercent?: string | number;
    imageDataUrl?: string;
    imageUrl?: string;
    categorySlug?: string;
  };

  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id }, include: { images: true, category: true } });
    if (!existing) throw new AppError('Product not found.', 404);
    if (!isManualProduct(existing)) throw new AppError('Only manually created products can be edited here.', 400);

    const title = String(name ?? existing.title).trim();
    const writeUp = String(description ?? existing.description).trim();
    const numericPrice = toNumber(price, Number(existing.basePrice));
    const numericStock = Math.max(0, Math.floor(toNumber(stock, existing.stock)));
    const numericDiscount = Math.min(100, Math.max(0, toNumber(discountPercent, 0)));
    const resolvedImage = buildImageUrl(imageDataUrl, imageUrl);
    const categorySlug = normalizeManualCategorySlug(requestedCategorySlug ?? existing.category?.slug);

    if (!title) throw new AppError('Product name is required.');
    if (!writeUp) throw new AppError('Product description is required.');
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) throw new AppError('Product price must be greater than zero.');

    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: {},
      create: { name: getManualCategoryName(categorySlug), slug: categorySlug },
    });

    const basePrice = Math.round(numericPrice * 100) / 100;
    const sellingPrice = Math.max(0, Math.round(basePrice * (1 - numericDiscount / 100) * 100) / 100);
    const slug = existing.slug.startsWith('manual-') ? slugify(title) + '-' + (existing.aliexpressId?.slice(-6) ?? existing.id.slice(0, 6)) : existing.slug;

    const product = await prisma.product.update({
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
        images: resolvedImage
          ? {
              deleteMany: {},
              create: [{ url: resolvedImage, position: 0 }],
            }
          : undefined,
      },
      include: { images: true, category: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.sub,
        action: 'UPDATE_MANUAL_PRODUCT',
        entity: 'Product',
        entityId: product.id,
        metadata: { title, price: basePrice, sellingPrice, stock: numericStock, discountPercent: numericDiscount },
      },
    });

    res.json({ product, message: 'Manual product updated successfully.' });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }

    const offlineCategorySlug = normalizeManualCategorySlug(requestedCategorySlug);
    return res.json({
      product: {
        id: req.params.id,
        aliexpressId: 'MANUAL-offline',
        title: name,
        slug: slugify(String(name ?? 'product')),
        description,
        sourceBasePrice: null,
        basePrice: toNumber(price, 0),
        markupPercent: 0,
        sellingPrice: Math.max(0, Math.round(toNumber(price, 0) * (1 - toNumber(discountPercent, 0) / 100) * 100) / 100),
        currency: 'NGN',
        stock: Math.max(0, Math.floor(toNumber(stock, 0))),
        ratingAverage: 0,
        ratingCount: 0,
        categoryId: null,
        category: { id: 'offline-' + offlineCategorySlug, name: getManualCategoryName(offlineCategorySlug), slug: offlineCategorySlug },
        images: [{ id: 'offline-' + Date.now() + '-image', productId: req.params.id, url: imageDataUrl || imageUrl || '', altText: null, position: 0 }],
      },
      message: 'Manual product updated in offline mode.',
    });
  }
}

export async function getProductDetailPreview(req: Request, res: Response, next: NextFunction) {
  try {
    const detail = await getProductDetail(req.params.cjProductId);
    if (!detail) throw new AppError('Product not found on CJ Dropshipping.', 404);
    res.json({ product: normalizeVisibleCjProduct(detail) });
  } catch (err) {
    next(err);
  }
}











