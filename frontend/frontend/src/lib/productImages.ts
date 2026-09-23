export const PRODUCT_IMAGE_PLACEHOLDER = '/product-placeholder.svg';

export function isValidProductImageUrl(value: string | null | undefined) {
  if (!value) return false;

  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function getProductImageUrl(product: { images?: { url?: string | null }[] | null }) {
  const image = product.images?.find((entry) => {
    return isValidProductImageUrl(entry?.url);
  });

  return image?.url?.trim() || PRODUCT_IMAGE_PLACEHOLDER;
}
