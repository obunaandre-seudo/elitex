export function getCustomerCategoryLabel(category?: { name?: string | null; slug?: string | null } | string | null) {
  const name = typeof category === 'string' ? category : category?.name;
  const slug = typeof category === 'string' ? undefined : category?.slug;
  if (slug === 'cj-dropshipping' || name?.toLowerCase() === 'cj dropshipping') {
    return 'Premium Collection';
  }
  return name ?? '';
}
