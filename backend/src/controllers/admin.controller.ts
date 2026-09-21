import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthedRequest } from '../middleware/auth';
import { applyMarkup } from '../utils/cjdropshipping';
import { CJ_PRODUCT_MARKUP_PERCENT } from '../utils/productPricing';
import {
  fallbackCoupons,
  fallbackDashboardStats,
  fallbackMarkupPercent,
  fallbackSettings,
  fallbackUsers,
  isDatabaseUnavailable,
} from '../utils/dbFallback';

const MANUAL_PRODUCT_PREFIX = 'MANUAL-';

export async function getDashboardStats(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const [totalRevenue, totalOrders, totalCustomers, totalProducts, recentOrders] = await Promise.all([
      prisma.order.aggregate({ _sum: { grandTotal: true }, where: { status: { not: 'CANCELLED' } } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count(),
      prisma.order.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { user: true } }),
    ]);

    res.json({
      totalRevenue: totalRevenue._sum.grandTotal ?? 0,
      totalOrders,
      totalCustomers,
      totalProducts,
      recentOrders,
    });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }

    res.json(fallbackDashboardStats(0));
  }
}

export async function getSettings(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.setting.findMany();
    res.json({ settings });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }
    res.json({ settings: fallbackSettings() });
  }
}

export async function updateMarkup(req: AuthedRequest, res: Response, next: NextFunction) {
  const markupPercent = CJ_PRODUCT_MARKUP_PERCENT;
  try {
    const setting = await prisma.setting.upsert({
      where: { key: 'MARKUP_PERCENT_DEFAULT' },
      update: { value: String(markupPercent) },
      create: { key: 'MARKUP_PERCENT_DEFAULT', value: String(markupPercent) },
    });

    // Recompute selling prices for Premium Collection synced products only.
    const products = await prisma.product.findMany();
    for (const p of products) {
      if (p.aliexpressId?.startsWith(MANUAL_PRODUCT_PREFIX)) {
        continue;
      }

      const basePrice = Number(p.sourceBasePrice ?? p.basePrice);
      const sellingPrice = applyMarkup(basePrice, markupPercent);
      await prisma.product.update({ where: { id: p.id }, data: { basePrice, markupPercent, sellingPrice } });
    }

    await prisma.auditLog.create({
      data: { userId: req.user!.sub, action: 'UPDATE_MARKUP', metadata: { markupPercent } },
    });

    res.json({ setting, message: `Premium Collection markup is fixed at ${markupPercent}% and has been applied.` });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }

    const fallbackPercent = markupPercent ?? fallbackMarkupPercent();
    res.json({
      setting: { key: 'MARKUP_PERCENT_DEFAULT', value: String(fallbackPercent) },
      message: `Markup updated to ${fallbackPercent}% in offline mode.`,
    });
  }
}

export async function updateCjUsdToNgnRate(req: AuthedRequest, res: Response, next: NextFunction) {
  const { cjUsdToNgnRate } = req.body;
  try {
    const setting = await prisma.setting.upsert({
      where: { key: 'CJ_USD_TO_NGN_RATE' },
      update: { value: String(cjUsdToNgnRate) },
      create: { key: 'CJ_USD_TO_NGN_RATE', value: String(cjUsdToNgnRate) },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.sub, action: 'UPDATE_CJ_USD_TO_NGN_RATE', metadata: { cjUsdToNgnRate } },
    });

    res.json({ setting, message: `Collection USD to NGN rate updated to ${cjUsdToNgnRate}.` });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }

    res.json({
      setting: { key: 'CJ_USD_TO_NGN_RATE', value: String(cjUsdToNgnRate) },
      message: `Collection USD to NGN rate updated to ${cjUsdToNgnRate} in offline mode.`,
    });
  }
}
export async function listUsers(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isEmailVerified: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }
    res.json({ users: fallbackUsers() });
  }
}

export async function updateUserRole(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
    await prisma.auditLog.create({
      data: { userId: req.user!.sub, action: 'UPDATE_USER_ROLE', entity: 'User', entityId: user.id, metadata: { role } },
    });
    res.json({ user });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }
    res.json({ user: { id: req.params.id, role: req.body.role } });
  }
}

export async function listAuditLogs(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    res.json({ logs });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }
    res.json({ logs: [] });
  }
}

export async function listSessions(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const sessions = await prisma.session.findMany({
      where: { expiresAt: { gt: new Date() } },
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
    })

    res.json({ sessions })
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err)
    }

    res.json({ sessions: [] })
  }
}

export async function createCoupon(req: AuthedRequest, res: Response, next: NextFunction) {
  const { code, description, discountType, discountValue, minSpend, maxUses, expiresAt } = req.body;
  try {
    const coupon = await prisma.coupon.create({
      data: { code, description, discountType, discountValue, minSpend, maxUses, expiresAt },
    });
    res.status(201).json({ coupon });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }
    res.status(201).json({
      coupon: {
        id: `offline-${Date.now()}`,
        code,
        description,
        discountType,
        discountValue,
        minSpend,
        maxUses,
        expiresAt,
      },
    });
  }
}

export async function listCoupons(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ coupons });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }
    res.json({ coupons: fallbackCoupons() });
  }
}

