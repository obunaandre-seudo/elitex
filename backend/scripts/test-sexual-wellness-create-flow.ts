import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import slugify from '../src/utils/slugify';

const prisma = new PrismaClient();
const rollbackMessage = 'ROLLBACK_SEXUAL_WELLNESS_CREATE_TEST';

async function main() {
  const imageUrls = [
    'https://example.com/images/sexual-wellness-test-1.jpg',
    'https://example.com/images/sexual-wellness-test-2.webp',
  ];

  for (const imageUrl of imageUrls) {
    const parsed = new URL(imageUrl);
    if (parsed.protocol !== 'https:') {
      throw new Error(`Invalid test image URL: ${imageUrl}`);
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const category = await tx.category.findUniqueOrThrow({
        where: { slug: 'sexual-wellness' },
      });

      const uniqueSuffix = Date.now().toString(36);
      const product = await tx.product.create({
        data: {
          aliexpressId: `ADMIN-TEST-${uniqueSuffix}`,
          title: `Sexual Wellness Create Flow Test ${uniqueSuffix}`,
          slug: `${slugify('Sexual Wellness Create Flow Test')}-${uniqueSuffix}`,
          description: 'Temporary transaction-only verification product.',
          basePrice: 12345,
          markupPercent: 0,
          sellingPrice: 12345,
          currency: 'NGN',
          stock: 3,
          ratingAverage: 0,
          ratingCount: 0,
          categoryId: category.id,
          images: {
            create: imageUrls.map((url, position) => ({
              url,
              publicId: null,
              position,
            })),
          },
        },
        include: { images: true, category: true },
      });

      const invalidImages = product.images.filter((image) => image.publicId !== null || !image.url.startsWith('https://'));
      if (product.category?.slug !== 'sexual-wellness') {
        throw new Error('Created product did not use sexual-wellness category.');
      }
      if (product.images.length !== imageUrls.length || invalidImages.length > 0) {
        throw new Error('Created images did not preserve HTTPS urls with null publicId.');
      }

      console.log(
        JSON.stringify(
          {
            dryRunCreatedProductId: product.id,
            categorySlug: product.category.slug,
            imageRows: product.images.map((image) => ({
              url: image.url,
              publicId: image.publicId,
              position: image.position,
            })),
            rolledBack: true,
          },
          null,
          2
        )
      );

      throw new Error(rollbackMessage);
    }, { timeout: 20000 });
  } catch (error: any) {
    if (error?.message !== rollbackMessage) {
      throw error;
    }
  }

  const persisted = await prisma.product.findFirst({
    where: { aliexpressId: { startsWith: 'ADMIN-TEST-' } },
  });

  if (persisted) {
    throw new Error(`Dry-run product unexpectedly persisted: ${persisted.id}`);
  }

  console.log('Sexual Wellness create dry-run passed and was rolled back.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
