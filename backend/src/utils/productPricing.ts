import { env } from '../config/env';

export const MANUAL_PRODUCT_PREFIX = 'MANUAL-';
export const CJ_PRODUCT_MARKUP_PERCENT = 35;
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

export function getCjUsdToNgnRate() {
  const rate = Number(env.cj.usdToNgnRate ?? DEFAULT_CJ_USD_TO_NGN_RATE);
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_CJ_USD_TO_NGN_RATE;
}

export function convertCjUsdToNgn(value: unknown) {
  return roundCurrency(toNumber(value) * getCjUsdToNgnRate());
}

export function getDisplayedCjPrice(basePrice: unknown, aliexpressId?: string | null, sellingPrice?: unknown) {
  if (isManualProductId(aliexpressId)) {
    return roundCurrency(toNumber(sellingPrice ?? basePrice));
  }

  return applyCjMarkup(basePrice);
}

export function applyCjMarkup(basePrice: unknown) {
  return roundCurrency(toNumber(basePrice) * (1 + CJ_PRODUCT_MARKUP_PERCENT / 100));
}

export function normalizeVisibleCjProduct(product: any) {
  if (!product) {
    return product;
  }

  if (isManualProductId(product.aliexpressId)) {
    return {
      ...product,
      basePrice: toNumber(product.basePrice),
      sellingPrice: roundCurrency(toNumber(product.sellingPrice ?? product.basePrice)),
      currency: 'NGN',
    };
  }

  const sourcePrice = product.sourceBasePrice ?? product.basePrice;
  const basePrice = roundCurrency(toNumber(sourcePrice));

  return {
    ...product,
    basePrice,
    markupPercent: CJ_PRODUCT_MARKUP_PERCENT,
    sellingPrice: applyCjMarkup(basePrice),
    currency: 'NGN',
  };
}
