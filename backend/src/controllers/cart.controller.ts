
import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { isManualProductId, normalizeVisibleCjProduct, normalizeVisibleCjVariant } from '../utils/productPricing';
import { AuthedRequest } from '../middleware/auth';

function applyVisiblePricing(item: any) {
  const isManual = isManualProductId(item.product?.aliexpressId);
  return {
    ...item,
    product: normalizeVisibleCjProduct(item.product),
    variant: isManual ? item.variant : normalizeVisibleCjVariant(item.variant),
  };
}

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });
  return cart;
}

export async function getCart(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const cart = await getOrCreateCart(req.user!.sub);
    const items = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: { include: { images: true } }, variant: true },
    });
    res.json({ items: items.map(applyVisiblePricing) });
  } catch (err) {
    next(err);
  }
}

export async function addToCart(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    const cart = await getOrCreateCart(req.user!.sub);

    if (!productId || typeof productId !== 'string') {
      throw new AppError('Product is required.', 400);
    }

    const normalizedQuantity = Number(quantity);
    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
      throw new AppError('Quantity must be at least 1.', 400);
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Product not found.', 404);

    let resolvedVariantId: string | null = null;
    if (variantId) {
      if (typeof variantId !== 'string') {
        throw new AppError('Invalid variant selected.', 400);
      }

      const variant = await prisma.productVariant.findFirst({
        where: { id: variantId, productId },
      });
      if (!variant) {
        throw new AppError('Selected variant does not match this product.', 400);
      }

      resolvedVariantId = variant.id;
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: resolvedVariantId,
      },
    });

    const item = existingItem
      ? await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: { increment: normalizedQuantity } },
        })
      : await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            variantId: resolvedVariantId,
            quantity: normalizedQuantity,
          },
        });

    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function updateCartItem(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { quantity } = req.body;
    if (quantity < 1) throw new AppError('Quantity must be at least 1.', 400);

    const item = await prisma.cartItem.update({
      where: { id: req.params.itemId },
      data: { quantity },
    });
    res.json({ item });
  } catch (err) {
    next(err);
  }
}

export async function removeCartItem(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.itemId } });
    res.json({ message: 'Item removed from cart.' });
  } catch (err) {
    next(err);
  }
}

