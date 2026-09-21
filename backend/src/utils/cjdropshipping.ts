import { prisma } from "../config/prisma";
import axios from 'axios';
import { env } from '../config/env';
import { logger } from './logger';

export interface RemoteProduct {
  cjProductId: string;
  title: string;
  description: string;
  images: string[];
  basePrice: number;
  currency: string;
  stock: number;
  category: string;
  ratingAverage: number;
  ratingCount: number;
  variants: any[];
}

const PAGE_SIZE = 100;
const TOKEN_SAFETY_WINDOW_MS = 300000;
const ADULT_CATALOG_TERMS = [
  'sex toy',
  'sex toys',
  'sexual wellness',
  'adult toy',
  'adult toys',
  'vibrator',
  'dildo',
  'pocket toy',
  'wand massager',
  'couples toy',
  'bullet toy',
  'stroker',
  'massage wand',
  'cleaning kit',
  'storage case',
  'lubricant set',
  'silicone sleeve',
];

let cachedAccessToken = env.cj.accessToken || null;
let cachedRefreshToken = env.cj.refreshToken || null;
let cachedAccessTokenExpiresAt = 0;
let lastTokenFetchAt = 0;

function configured() {
  return Boolean(env.cj.apiKey || cachedAccessToken);
}

function cjBaseUrl(path: string) {
  const base = env.cj.baseUrl.endsWith('/') ? env.cj.baseUrl.slice(0, -1) : env.cj.baseUrl;
  return base + path;
}

function isCachedTokenValid() {
  return Boolean(cachedAccessToken && cachedAccessTokenExpiresAt && Date.now() + TOKEN_SAFETY_WINDOW_MS < cachedAccessTokenExpiresAt);
}

async function fetchAccessToken() {
  if (isCachedTokenValid()) return cachedAccessToken as string;
  if (cachedAccessToken && !env.cj.apiKey) return cachedAccessToken;
  if (!env.cj.apiKey) throw new Error('CJ_NOT_CONFIGURED');

  if (Date.now() - lastTokenFetchAt < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - (Date.now() - lastTokenFetchAt)));
  }

  const body: any = { apiKey: env.cj.apiKey };
  if (cachedRefreshToken) body.refreshToken = cachedRefreshToken;

  const { data } = await axios.post(cjBaseUrl('/authentication/getAccessToken'), body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 20000,
  });

  lastTokenFetchAt = Date.now();
  if (!data?.result || !data?.data?.accessToken) throw new Error(data?.message || 'CJ authentication failed');

  cachedAccessToken = String(data.data.accessToken);
  cachedRefreshToken = data.data.refreshToken ? String(data.data.refreshToken) : cachedRefreshToken;
  cachedAccessTokenExpiresAt = Date.parse(data.data.accessTokenExpiryDate || '');
  return cachedAccessToken;
}

async function cjRequest(path: string, params: any = {}) {
  const accessToken = await fetchAccessToken();
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.append(key, String(value));
  }

  const url = query.toString() ? cjBaseUrl(path) + '?' + query.toString() : cjBaseUrl(path);
  const { data } = await axios.get(url, { headers: { 'CJ-Access-Token': accessToken }, timeout: 20000 });
  if (data && typeof data === 'object' && data.result === false) throw new Error(data.message || 'CJ API request failed');
  return data;
}

function arrayFrom(...sources: any[]) {
  for (const source of sources) {
    if (!source) continue;
    if (Array.isArray(source)) return source;
    if (Array.isArray(source.items)) return source.items;
    if (Array.isArray(source.item)) return source.item;
    if (Array.isArray(source.list)) return source.list;
    if (Array.isArray(source.content)) return source.content;
    if (Array.isArray(source.productList)) return source.productList;
    if (Array.isArray(source.product)) return source.product;
    if (typeof source === 'object') {
      const nested = Object.values(source).find((value) => Array.isArray(value));
      if (Array.isArray(nested)) return nested;
    }
  }

  return [];
}

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isAdultCatalogQuery(keyword: string) {
  const needle = normalizeKeyword(keyword);
  if (!needle) return false;
  return ['sex', 'sexual', 'adult', 'wellness', 'toy', 'vibe', 'vibrator', 'dildo', 'stroker'].some((term) => needle.includes(term));
}

function searchTermsForKeyword(keyword: string) {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return [];

  const terms = new Set<string>([normalized]);
  for (const part of normalized.split(/[\s,/]+/)) {
    if (part.length > 2) terms.add(part);
  }

  if (isAdultCatalogQuery(normalized)) {
    for (const term of ADULT_CATALOG_TERMS) terms.add(term);
  }

  return [...terms].filter(Boolean);
}

function productMatchesTerms(product: RemoteProduct, terms: string[]) {
  if (!terms.length) return true;
  const haystack = [product.title, product.description, product.category].join(' ').toLowerCase();
  return terms.some((term) => haystack.includes(term.toLowerCase()));
}

function imagesFrom(item: any): string[] {
  return [item.productImageSet, item.productImage, item.bigImage, item.image, item.images, item.productImages, item.image_urls]
    .flatMap((source) => {
      if (!source) return [];
      if (Array.isArray(source)) return source;
      if (typeof source === 'string') return source.split(',').map((url) => url.trim());
      return [];
    })
    .map((entry: any) => (typeof entry === 'string' ? entry : entry?.url ?? entry?.imageUrl ?? entry?.src))
    .filter(Boolean);
}

function parsePrice(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
    const n = Number.parseFloat((trimmed.startsWith('[') ? trimmed : trimmed.split('-')[0] || trimmed).replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function variantAttrs(name: string) {
  return name.split('/').map((part) => part.trim()).filter(Boolean).reduce<any>((attrs, part, index) => {
    const pair = part.includes(':') ? part.split(':') : ['option' + (index + 1), part];
    attrs[pair[0].trim().toLowerCase()] = pair[1].trim();
    return attrs;
  }, {});
}

function mapVariants(item: any, productId: string, fallback: any) {
  const variants = arrayFrom(item.variants, item.variantList, item.skuList);
  if (!variants.length) return [fallback];

  return variants.map((variant: any, index: number) => {
    const rawSku = String(variant.variantSku ?? variant.sku ?? variant.vid ?? variant.id ?? productId + '-variant-' + index);
    const sku = rawSku.indexOf(productId) === 0 ? rawSku : productId + '-' + rawSku;
    const name = String(variant.variantNameEn ?? variant.variantName ?? variant.variantKey ?? variant.name ?? rawSku);

    return {
      sku,
      name,
      priceDelta: parsePrice(variant.priceDelta ?? variant.price ?? variant.totalPrice ?? 0),
      stock: Number(variant.inventoryNum ?? variant.totalInventoryNum ?? variant.stock ?? item.inventoryNum ?? item.totalInventoryNum ?? item.stock ?? 0) || 0,
      attributes: variantAttrs(name),
    };
  });
}

function mapProduct(item: any, variantSource?: any): RemoteProduct | null {
  if (!item) return null;

  const id = String(item.pid ?? item.productId ?? item.product_id ?? item.id ?? item.productSku ?? item.product_code ?? '');
  if (!id) return null;

  const title = String(item.productNameEn ?? item.nameEn ?? item.english_subject ?? item.subject ?? item.productName ?? item.product_name ?? item.title ?? 'Premium Collection Product');
  const stock = Number(item.quantity ?? item.inventoryNum ?? item.totalInventoryNum ?? item.stock ?? 0) || 0;
  const images = imagesFrom(item);
  const defaultVariant = { sku: id + '-default', name: 'Default', priceDelta: 0, stock, attributes: {} };

  return {
    cjProductId: id,
    title,
    description: String(item.productDescription ?? item.description ?? item.description_url ?? item.productDesc ?? title),
    images: images.length ? images : ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'],
    basePrice: parsePrice(item.totalPrice ?? item.productSellPrice ?? item.sellPrice ?? item.salePrice ?? item.product_min_price ?? item.product_price ?? item.item_offer_site_sale_price ?? item.original_price_cents ?? item.discount_price_cents),
    currency: String(item.currencyCode ?? item.currency_code ?? item.base_currency_code ?? item.currency ?? 'NGN'),
    stock,
    category: String(item.categoryName ?? item.category_name ?? item.category ?? item.categoryFirstName ?? 'Premium Collection'),
    ratingAverage: Number(item.avg_evaluation_rating ?? item.average_star ?? item.ratingAverage ?? item.star ?? 0) || 0,
    ratingCount: Number(item.evaluation_count ?? item.ratingCount ?? item.order_count ?? item.reviewCount ?? 0) || 0,
    variants: mapVariants(item, id, variantSource ?? defaultVariant),
  };
}

function unwrapListResponse(raw: any) {
  const data = raw?.data ?? raw;

  if (Array.isArray(data?.content)) {
    return data.content.flatMap((group: any) => group.productList ?? []);
  }

  if (Array.isArray(data?.list)) {
    return data.list;
  }

  if (Array.isArray(data?.productList)) {
    return data.productList;
  }

  return [];
}

function unwrapDetailResponse(raw: any) {
  const data = raw?.data ?? raw?.result ?? raw;
  return data?.content ?? data?.product ?? data;
}

function unwrapVariantResponse(raw: any) {
  const data = raw?.data ?? raw?.result ?? raw;
  return arrayFrom(data?.list, data?.variants, data?.content, data);
}

export async function searchProducts(keyword = '', page = 1): Promise<any> {
  if (!configured()) {
    logger.warn('[cj] credentials not set - returning no products');
    return [];
  }

  try {
    const products: any[] = [];
    const seen = new Set<string>();
    const terms = searchTermsForKeyword(keyword);
    const remoteKeyword = isAdultCatalogQuery(keyword) ? undefined : keyword || undefined;

    for (let currentPage = Math.max(page, 1); ; currentPage += 1) {
      const data = await cjRequest('/product/listV2', { page: currentPage, size: PAGE_SIZE, keyWord: remoteKeyword });
      const rawProducts = unwrapListResponse(data);
      const pageProducts = rawProducts.map((item: any) => mapProduct(item)).filter(Boolean) as RemoteProduct[];
      const filteredPageProducts = terms.length ? pageProducts.filter((product) => productMatchesTerms(product, terms)) : pageProducts;

      for (const product of filteredPageProducts) {
        if (!seen.has(product.cjProductId)) {
          seen.add(product.cjProductId);
          products.push(product);
        }
      }

      if (!pageProducts.length) break;
      if (pageProducts.length < PAGE_SIZE) break;
      if (currentPage - page + 1 > 20) break;
    }

    return products;
  } catch (err: any) {
    console.error('=========== CJ API ERROR ===========');
    console.error(err?.response?.data || err);
    console.error('====================================');
    throw err;
  }
}

export async function getProductDetail(productId: string): Promise<any> {
  if (!configured()) return null;

  try {
    const detailResponse = await cjRequest('/product/query', { pid: productId, countryCode: env.cj.country });
    const detail = unwrapDetailResponse(detailResponse);
    const variantsResponse = await cjRequest('/product/variant/query', { pid: productId, countryCode: env.cj.country });
    const variants = unwrapVariantResponse(variantsResponse);
    return mapProduct({ ...detail, variants }, variants);
  } catch (err) {
    logger.error('[cj] getProductDetail(' + productId + ' ) failed', err);
    return null;
  }
}

export function applyMarkup(basePrice: number, markupPercent: number): number {
  return Math.round(basePrice * (1 + markupPercent / 100) * 100) / 100;
}

export function isCJConfigured() {
  return configured();
}
