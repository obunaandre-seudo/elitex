export function formatNaira(value: number | string) {
  const amount = typeof value === 'string' ? Number(value) : value;
  const normalized = Number.isFinite(amount) ? amount : 0;

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(normalized);
}
