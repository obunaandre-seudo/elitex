import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.setting.upsert({
    where: { key: 'MARKUP_PERCENT_DEFAULT' },
    update: {},
    create: { key: 'MARKUP_PERCENT_DEFAULT', value: '35' },
  });

  const adminPassword = await bcrypt.hash('AdminPass123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@elitexshop.com' },
    update: {
      firstName: 'Elite',
      lastName: 'Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isEmailVerified: true,
    },
    create: {
      firstName: 'Elite',
      lastName: 'Admin',
      email: 'admin@elitexshop.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });
  await prisma.cart.upsert({ where: { userId: admin.id }, update: {}, create: { userId: admin.id } });

  console.log('Seed complete.');
  console.log('  Admin login: admin@elitexshop.com / AdminPass123');
  console.log('  Run `npm run dev` on the backend, then POST /api/products/admin/sync (as admin)');
  console.log('  to populate the Premium Collection catalog.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
