import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { generalLimiter } from './middleware/rateLimiter';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { isDatabaseUnavailable } from './utils/dbFallback';
import { handlePaystackWebhook } from './controllers/payments.controller';
import authRoutes from './routes/auth.routes';
import productsRoutes from './routes/products.routes';
import cartRoutes from './routes/cart.routes';
import ordersRoutes from './routes/orders.routes';
import paymentsRoutes from './routes/payments.routes';
import adminRoutes from './routes/admin.routes';
import addressesRoutes from './routes/addresses.routes';
import wishlistRoutes from './routes/wishlist.routes';
import notificationsRoutes from './routes/notifications.routes';
const app = express();
app.set('trust proxy', 1);
const corsOptions: CorsOptions = { origin: (origin, callback) => { if (!origin || env.clientUrls.includes(origin)) return callback(null, true); callback(null, false); }, credentials: true };
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.post('/api/payments/paystack/webhook', express.raw({ type: 'application/json' }), handlePaystackWebhook);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(generalLimiter);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'elite-x-shop-api' }));
app.get('/api/health/db', async (req, res) => {
  if (env.nodeEnv === 'production') {
    const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
    const diagnosticToken = String(req.headers['x-diagnostic-token'] ?? bearer);

    if (!env.dbDiagnosticToken || diagnosticToken !== env.dbDiagnosticToken) {
      return res.status(404).json({ error: 'Route not found: GET /api/health/db' });
    }
  }

  try {
    const [totalProducts, activeProducts, inactiveProducts, categoryCount] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: false } }),
      prisma.category.count(),
    ]);

    res.json({
      status: 'ok',
      database: 'reachable',
      totalProducts,
      activeProducts,
      inactiveProducts,
      categoryCount,
    });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return res.status(503).json({
        status: 'error',
        database: 'unreachable',
      });
    }

    res.status(503).json({
      status: 'error',
      database: 'unreachable',
    });
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
