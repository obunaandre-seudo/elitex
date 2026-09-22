import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GuestCartProduct {
  id: string;
  slug: string;
  title: string;
  sellingPrice: number | string;
  images?: { url?: string }[];
}

export interface GuestCartVariant {
  id: string;
  name: string;
  priceDelta?: number | string | null;
}

export interface GuestCartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: GuestCartProduct;
  variant?: GuestCartVariant | null;
}

interface CartState {
  itemCount: number;
  guestItems: GuestCartItem[];
  setItemCount: (count: number) => void;
  addGuestItem: (product: GuestCartProduct, variant: GuestCartVariant | null | undefined, quantity: number) => void;
  updateGuestQuantity: (itemId: string, quantity: number) => void;
  removeGuestItem: (itemId: string) => void;
  clearGuestCart: () => void;
}

function getGuestItemId(productId: string, variantId?: string | null) {
  return productId + '::' + (variantId ?? 'default');
}

function getItemCount(items: GuestCartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      itemCount: 0,
      guestItems: [],
      setItemCount: (count) => set({ itemCount: count }),
      addGuestItem: (product, variant, quantity) => set((state) => {
        const normalizedQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
        const variantId = variant?.id ?? null;
        const id = getGuestItemId(product.id, variantId);
        const existing = state.guestItems.find((item) => item.id === id);
        const guestItems = existing
          ? state.guestItems.map((item) => item.id === id ? { ...item, quantity: item.quantity + normalizedQuantity } : item)
          : [...state.guestItems, { id, productId: product.id, variantId, quantity: normalizedQuantity, product, variant: variant ?? null }];

        return { guestItems, itemCount: getItemCount(guestItems) };
      }),
      updateGuestQuantity: (itemId, quantity) => set((state) => {
        const normalizedQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
        const guestItems = state.guestItems.map((item) => item.id === itemId ? { ...item, quantity: normalizedQuantity } : item);
        return { guestItems, itemCount: getItemCount(guestItems) };
      }),
      removeGuestItem: (itemId) => set((state) => {
        const guestItems = state.guestItems.filter((item) => item.id !== itemId);
        return { guestItems, itemCount: getItemCount(guestItems) };
      }),
      clearGuestCart: () => set({ guestItems: [], itemCount: 0 }),
    }),
    {
      name: 'elite-x-guest-cart',
      partialize: (state) => ({ guestItems: state.guestItems }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setItemCount(getItemCount(state.guestItems));
        }
      },
    }
  )
);
