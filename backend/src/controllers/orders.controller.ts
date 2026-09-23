import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';
import { sendOrderConfirmationEmail, sendShippingUpdateEmail } from '../utils/mailer';
import { createPaymentIntent } from '../utils/payments';
import { isAdminCreatedProductId, normalizeVisibleCjProduct, normalizeVisibleCjVariant } from '../utils/productPricing';
import { isCJLinkedProduct } from '../utils/cjOrders';

function applyVisiblePricing(item: any) {
  const isAdminCreated = isAdminCreatedProductId(item.product?.aliexpressId);
  return {
    ...item,
    product: normalizeVisibleCjProduct(item.product),
    variant: isAdminCreated ? item.variant : normalizeVisibleCjVariant(item.variant),
  };
}

export async function createOrder(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { addressId, couponCode } = req.body;
    const paymentProvider = 'PAYSTACK';
    const userId = req.user!.sub;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!cart || cart.items.length === 0) throw new AppError('Your cart is empty.', 400);

    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new AppError('Shipping address not found.', 404);

    const visibleItems = cart.items.map(applyVisiblePricing);

    let subtotal = 0;
    for (const item of visibleItems) {
      const unit = Number(item.product.sellingPrice) + Number(item.variant?.priceDelta ?? 0);
      subtotal += unit * item.quantity;
    }

    let discountTotal = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        discountTotal = coupon.discountType === 'PERCENT'
          ? subtotal * (Number(coupon.discountValue) / 100)
          : Number(coupon.discountValue);
      }
    }

    const shippingTotal = 2000;
    const grandTotal = Math.max(subtotal - discountTotal + shippingTotal, 0);
    const orderNumber = 'EXS-' + Date.now().toString(36).toUpperCase();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found.', 404);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        addressId,
        subtotal,
        discountTotal,
        shippingTotal,
        grandTotal,
        couponId: coupon?.id,
        items: {
          create: visibleItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId ?? undefined,
            titleSnapshot: item.product.title,
            unitPrice: Number(item.product.sellingPrice) + Number(item.variant?.priceDelta ?? 0),
            quantity: item.quantity,
            fulfillmentStatus: isCJLinkedProduct(item.product) ? 'PENDING' : 'NOT_REQUIRED',
          })),
        },
      },
      include: { items: true },
    });

    const paymentSession = await createPaymentIntent(paymentProvider, grandTotal, order.orderNumber, {
      customerEmail: user.email,
      metadata: { orderId: order.id },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: paymentProvider,
        amount: grandTotal,
        currency: 'NGN',
        providerRef: paymentSession.reference,
      },
    });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await sendOrderConfirmationEmail(user.email, user.firstName, order.orderNumber, 'NGN ' + grandTotal.toFixed(2));
    res.status(201).json({ order, payment, paymentSession });
  } catch (err) {
    next(err);
  }
}

export async function listMyOrders(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const orders = await prisma.order.findMany({ where: { userId: req.user!.sub }, orderBy: { createdAt: 'desc' }, include: { items: true, payments: true } });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function getOrderById(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: req.user!.sub }, include: { items: true, payments: true, address: true } });
    if (!order) throw new AppError('Order not found.', 404);
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { status, trackingNumber, trackingCarrier } = req.body;
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status, trackingNumber, trackingCarrier }, include: { user: true } });
    await sendShippingUpdateEmail(order.user.email, order.user.firstName, order.orderNumber, status, trackingNumber);
    res.json({ order });
  } catch (err) {
    next(err);
  }
}
