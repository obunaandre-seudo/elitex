import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Runtime app traffic should use Neon's pooled endpoint when it is configured.
// Prisma CLI commands can still use DIRECT_URL from schema.prisma for direct access.
const databaseUrl = env.databaseUrlPooler || env.databaseUrl;
if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
}
if (env.directUrl) {
  process.env.DIRECT_URL = env.directUrl;
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prevents exhausting DB connections from hot-reloads in development.
export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
