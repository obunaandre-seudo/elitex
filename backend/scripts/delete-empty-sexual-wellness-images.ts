import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.findUnique({
    where: { slug: 'sexual-wellness' },
    select: { id: true, name: true, slug: true },
  });

  if (!category) {
    throw new Error('Category sexual-wellness was not found.');
  }

  const rows = await prisma.productImage.findMany({
    where: {
      url: '',
      publicId: null,
      product: {
        categoryId: category.id,
      },
    },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          categoryId: true,
        },
      },
    },
    orderBy: { position: 'asc' },
  });

  const sexualWellnessProductCountBefore = await prisma.product.count({
    where: { categoryId: category.id },
  });

  const backupDir = path.join(process.cwd(), 'backups');
  await mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `deleted-empty-sexual-wellness-product-images-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);

  await writeFile(
    backupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        category,
        criteria: {
          categorySlug: 'sexual-wellness',
          productImageUrl: '',
          productImagePublicId: null,
        },
        sexualWellnessProductCountBefore,
        rows,
      },
      null,
      2
    )
  );

  const deleteResult = await prisma.productImage.deleteMany({
    where: {
      id: { in: rows.map((row) => row.id) },
    },
  });

  const sexualWellnessProductCountAfter = await prisma.product.count({
    where: { categoryId: category.id },
  });

  const remainingBrokenImageRows = await prisma.productImage.count({
    where: {
      url: '',
      publicId: null,
      product: {
        categoryId: category.id,
      },
    },
  });

  console.log(
    JSON.stringify(
      {
        backupPath,
        matchedRowsBackedUp: rows.length,
        deletedRows: deleteResult.count,
        sexualWellnessProductCountBefore,
        sexualWellnessProductCountAfter,
        remainingBrokenImageRows,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
