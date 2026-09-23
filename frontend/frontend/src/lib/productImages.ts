export const PRODUCT_IMAGE_PLACEHOLDER = '/product-placeholder.svg';

export function isValidProductImageUrl(value: string | null | undefined) {
  if (!value) return false;

  const trimmed = value.trim();
  if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,[a-z0-9+/]+=*$/i.test(trimmed)) {
    return true;
  }

  try {
    const url = new URL(trimmed);
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
