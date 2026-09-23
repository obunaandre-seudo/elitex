import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.findUnique({
    where: { slug: 'sexual-wellness' },
    select: { id: true, slug: true, name: true },
  });

  if (!category) {
    throw new Error('Category sexual-wellness was not found.');
  }

  const [productCount, emptyImageRows, externalImageRows] = await Promise.all([
    prisma.product.count({ where: { categoryId: category.id } }),
    prisma.productImage.count({
      where: {
        url: '',
        publicId: null,
        product: { categoryId: category.id },
      },
    }),
    prisma.productImage.count({
      where: {
        url: { startsWith: 'https://' },
        publicId: null,
        product: { categoryId: category.id },
      },
    }),
  ]);

  const sampleProducts = await prisma.product.findMany({
    where: { categoryId: category.id },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      images: {
        select: { url: true, publicId: true, position: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  console.log(JSON.stringify({ category, productCount, emptyImageRows, externalImageRows, sampleProducts }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
