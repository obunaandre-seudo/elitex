import { env } from '../config/env';

export const MANUAL_PRODUCT_PREFIX = 'MANUAL-';
export const ADMIN_PRODUCT_PREFIX = 'ADMIN-';
export const CJ_PRODUCT_MARKUP_PERCENT = 35;
export const CJ_CUSTOMER_PRICE_MULTIPLIER = 2000;
const DEFAULT_CJ_USD_TO_NGN_RATE = 1600;

function toNumber(value: unknown) {
  const n = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function isManualProductId(aliexpressId?: string | null) {
  return Boolean(aliexpressId && aliexpressId.startsWith(MANUAL_PRODUCT_PREFIX));
}

export function isAdminCreatedProductId(aliexpressId?: string | null) {
  return Boolean(aliexpressId && (aliexpressId.startsWith(MANUAL_PRODUCT_PREFIX) || aliexpressId.startsWith(ADMIN_PRODUCT_PREFIX)));
}

export function getCjUsdToNgnRate() {
  const rate = Number(env.cj.usdToNgnRate ?? DEFAULT_CJ_USD_TO_NGN_RATE);
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_CJ_USD_TO_NGN_RATE;
}

export function convertCjUsdToNgn(value: unknown) {
  return roundCurrency(toNumber(value) * getCjUsdToNgnRate());
}

export function getDisplayedCjPrice(basePrice: unknown, aliexpressId?: string | null, sellingPrice?: unknown) {
  if (isAdminCreatedProductId(aliexpressId)) {
    return roundCurrency(toNumber(sellingPrice ?? basePrice));
  }

  return applyCjMarkup(basePrice);
}

export function applyCjMarkup(basePrice: unknown) {
  return roundCurrency(toNumber(basePrice) * (1 + CJ_PRODUCT_MARKUP_PERCENT / 100));
}

export function getCustomerCjPrice(value: unknown) {
  return roundCurrency(toNumber(value) * CJ_CUSTOMER_PRICE_MULTIPLIER);
}

export function normalizeVisibleCjVariant(variant: any) {
  if (!variant) {
    return variant;
  }

  return {
    ...variant,
    priceDelta: getCustomerCjPrice(variant.priceDelta),
  };
}

export function normalizeVisibleCjProduct(product: any) {
  if (!product) {
    return product;
  }

  if (isAdminCreatedProductId(product.aliexpressId)) {
    return {
      ...product,
      basePrice: toNumber(product.basePrice),
      sellingPrice: roundCurrency(toNumber(product.sellingPrice ?? product.basePrice)),
      currency: 'NGN',
    };
  }

  const sourceBasePrice = toNumber(product.sourceBasePrice ?? product.basePrice);
  const rawBasePrice = toNumber(product.basePrice ?? sourceBasePrice);
  const rawSellingPrice = toNumber(product.sellingPrice ?? sourceBasePrice);
  const hasSourceDiscount = rawSellingPrice > 0 && rawSellingPrice < rawBasePrice;
  const sourceSellingPrice = hasSourceDiscount ? rawSellingPrice : sourceBasePrice;

  return {
    ...product,
    basePrice: getCustomerCjPrice(sourceBasePrice),
    markupPercent: 0,
    sellingPrice: getCustomerCjPrice(sourceSellingPrice),
    currency: 'NGN',
    variants: Array.isArray(product.variants) ? product.variants.map(normalizeVisibleCjVariant) : product.variants,
  };
}
