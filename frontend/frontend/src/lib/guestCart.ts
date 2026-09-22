import { api } from '@/lib/api';
import { useCartStore, type GuestCartItem } from '@/store/cartStore';

function getServerCartCount(items: Array<{ quantity?: number | string }>) {
  return items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
}

export async function mergeGuestCartToAccount(items: GuestCartItem[]) {
  if (!items.length) {
    return;
  }

  for (const item of items) {
    await api.post('/cart/items', {
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    });
  }

  useCartStore.getState().clearGuestCart();

  const cart = await api.get('/cart');
  useCartStore.getState().setItemCount(getServerCartCount(cart.data.items ?? []));
}

export async function refreshAuthenticatedCartCount() {
  const cart = await api.get('/cart');
  useCartStore.getState().setItemCount(getServerCartCount(cart.data.items ?? []));
}
