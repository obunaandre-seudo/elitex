const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const mode = process.argv[2] === 'direct' ? 'direct' : 'pooler';

if (mode === 'pooler' && process.env.DATABASE_URL_POOLER) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_POOLER;
} else if (mode === 'direct' && process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const prisma = new PrismaClient();

function sanitize(message) {
  return String(message).replace(/postgresql:\/\/[^@\s]+@/g, 'postgresql://***@');
}

(async () => {
  const probe = await prisma.$queryRawUnsafe('SELECT 1::int AS ok');
  const productCount = await prisma.product.count();

  console.log(JSON.stringify({
    mode,
    probe: probe?.[0]?.ok === 1,
    productCount,
  }));
})()
  .catch((err) => {
    console.error(`${err.name}: ${sanitize(err.message)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
