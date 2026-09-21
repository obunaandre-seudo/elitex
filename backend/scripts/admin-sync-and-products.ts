import { prisma } from '../src/config/prisma';
import { env } from '../src/config/env';
import { searchProducts, applyMarkup, RemoteProduct } from '../src/utils/cjdropshipping';
import slugify from '../src/utils/slugify';

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

async function syncFromCj(keyword = '') {
  let remoteProducts: RemoteProduct[] = [];

  try {
    remoteProducts = await searchProducts(keyword);
  } catch (err: any) {
    console.warn(`CJ sync skipped: ${err?.message ?? err}`);
    return 0;
  }

  const log = await prisma.aliExpressSyncLog.create({ data: { status: 'PARTIAL', itemsSynced: 0 } });
  const rateSetting = await prisma.setting.findUnique({ where: { key: 'CJ_USD_TO_NGN_RATE' } });
  const cjUsdToNgnRate = rateSetting ? parseFloat(rateSetting.value) : env.cj.usdToNgnRate;
  const markupPercent = 100;
  let synced = 0;

  for (const rp of remoteProducts) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(rp.category) },
      update: { name: rp.category },
      create: { name: rp.category, slug: slugify(rp.category) },
    });
    const sourceBasePrice = roundCurrency(rp.basePrice);
    const basePrice = roundCurrency(sourceBasePrice * cjUsdToNgnRate);
    const sellingPrice = applyMarkup(basePrice, markupPercent);
    const slug = `${slugify(rp.title)}-${rp.cjProductId.slice(-4)}`;

    await prisma.product.upsert({
      where: { aliexpressId: rp.cjProductId },
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
          create: rp.images.map((url, position) => ({ url, position })),
        },
        variants: {
          deleteMany: {},
          create: rp.variants.map((variant: any) => ({
            sku: variant.sku,
            name: variant.name,
            priceDelta: roundCurrency(Number(variant.priceDelta ?? 0) * cjUsdToNgnRate),
            stock: variant.stock,
            attributes: variant.attributes,
          })),
        },
      },
      create: {
        aliexpressId: rp.cjProductId,
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
        images: { create: rp.images.map((url, position) => ({ url, position })) },
        variants: {
          create: rp.variants.map((variant: any) => ({
            sku: variant.sku,
            name: variant.name,
            priceDelta: roundCurrency(Number(variant.priceDelta ?? 0) * cjUsdToNgnRate),
            stock: variant.stock,
            attributes: variant.attributes,
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

  return synced;
}

const manualProducts = [
  {
    title: 'Velvet Gift Discovery Box',
    slug: 'velvet-gift-discovery-box',
    categoryName: 'Gift Ideas',
    categorySlug: 'gift-ideas',
    description: 'A ready-to-wrap self-care gift set with a satin sleep mask, massage oil, bath soak, and keepsake pouch.',
    price: 48500,
    stock: 24,
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=1200',
  },
  {
    title: 'After Dark Travel Case',
    slug: 'after-dark-travel-case',
    categoryName: 'Sexual Wellness',
    categorySlug: 'sexual-wellness',
    description: 'Discreet zip case with washable lining, cable pocket, and structured protection for personal wellness items.',
    price: 22500,
    stock: 40,
    image: 'https://images.unsplash.com/photo-1520637836862-4d197d17c38a?w=1200',
  },
  {
    title: 'Silk Touch Massage Oil Trio',
    slug: 'silk-touch-massage-oil-trio',
    categoryName: 'Sexual Wellness',
    categorySlug: 'sexual-wellness',
    description: 'Three lightweight aromatic massage oils designed for slow evenings, gifting, and elevated self-care rituals.',
    price: 31500,
    stock: 36,
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1200',
  },
  {
    title: 'Golden Hour Intimacy Kit',
    slug: 'golden-hour-intimacy-kit',
    categoryName: 'Gift Ideas',
    categorySlug: 'gift-ideas',
    description: 'Premium occasion kit with scented candle, soft blindfold, care cards, and a reusable magnetic gift box.',
    price: 64000,
    stock: 18,
    image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=1200',
  },
];

async function upsertManualProducts() {
  let createdOrUpdated = 0;

  for (const item of manualProducts) {
    const category = await prisma.category.upsert({
      where: { slug: item.categorySlug },
      update: { name: item.categoryName },
      create: { name: item.categoryName, slug: item.categorySlug },
    });

    await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        basePrice: item.price,
        markupPercent: 0,
        sellingPrice: item.price,
        currency: 'NGN',
        stock: item.stock,
        isActive: true,
        categoryId: category.id,
        images: {
          deleteMany: {},
          create: [{ url: item.image, position: 0, altText: item.title }],
        },
      },
      create: {
        aliexpressId: `manual-${item.slug}`,
        title: item.title,
        slug: item.slug,
        description: item.description,
        basePrice: item.price,
        markupPercent: 0,
        sellingPrice: item.price,
        currency: 'NGN',
        stock: item.stock,
        ratingAverage: 0,
        ratingCount: 0,
        isActive: true,
        categoryId: category.id,
        images: { create: [{ url: item.image, position: 0, altText: item.title }] },
      },
    });

    createdOrUpdated += 1;
  }

  return createdOrUpdated;
}

async function main() {
  const keyword = process.argv.slice(2).join(' ');
  const synced = await syncFromCj(keyword);
  const manual = await upsertManualProducts();
  const productCount = await prisma.product.count();

  console.log(JSON.stringify({ synced, manualProducts: manual, productCount }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
