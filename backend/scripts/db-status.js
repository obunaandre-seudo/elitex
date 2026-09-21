const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

function sanitize(message) {
  return String(message).replace(/postgresql:\/\/[^@\s]+@/g, 'postgresql://***@');
}

(async () => {
  const tables = await prisma.$queryRawUnsafe(
    "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name"
  );
  const productImageColumns = await prisma.$queryRawUnsafe(
    "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'ProductImage' order by ordinal_position"
  );
  const [productCount, categoryCount, userCount] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.user.count(),
  ]);

  console.log(JSON.stringify({
    tableCount: tables.length,
    tables: tables.map((table) => table.table_name),
    productImageColumns: productImageColumns.map((column) => column.column_name),
    productCount,
    categoryCount,
    userCount,
  }));
})()
  .catch((err) => {
    console.error(`${err.name}: ${sanitize(err.message)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
