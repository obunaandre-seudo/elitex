import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GuestCartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: any;
  variant?: any | null;
}

interface CartState {
  itemCount: number;
  guestItems: GuestCartItem[];
  setItemCount: (count: number) => void;
  addGuestItem: (item: Omit<GuestCartItem, 'id'>) => void;
  updateGuestQuantity: (itemId: string, quantity: number) => void;
  removeGuestItem: (itemId: string) => void;
  clearGuestCart: () => void;
}

function getGuestItemId(productId: string, variantId?: string | null) {
  return `${productId}:${variantId ?? 'default'}`;
}

function guestCount(items: GuestCartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      itemCount: 0,
      guestItems: [],
      setItemCount: (count) => set({ itemCount: count }),
      addGuestItem: (item) => set((state) => {
        const id = getGuestItemId(item.productId, item.variantId);
        const existing = state.guestItems.find((entry) => entry.id === id);
        const guestItems = existing
          ? state.guestItems.map((entry) => (
              entry.id === id ? { ...entry, quantity: entry.quantity + item.quantity } : entry
            ))
          : [...state.guestItems, { ...item, id }];

        return { guestItems, itemCount: guestCount(guestItems) };
      }),
      updateGuestQuantity: (itemId, quantity) => set((state) => {
        const guestItems = state.guestItems.map((item) => (
          item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
        ));
        return { guestItems, itemCount: guestCount(guestItems) };
      }),
      removeGuestItem: (itemId) => set((state) => {
        const guestItems = state.guestItems.filter((item) => item.id !== itemId);
        return { guestItems, itemCount: guestCount(guestItems) };
      }),
      clearGuestCart: () => set({ guestItems: [], itemCount: 0 }),
    }),
    {
      name: 'elite-x-guest-cart',
      partialize: (state) => ({ guestItems: state.guestItems }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setItemCount(guestCount(state.guestItems));
      },
    }
  )
);
