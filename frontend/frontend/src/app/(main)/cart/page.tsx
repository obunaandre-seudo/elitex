'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';
import { formatNaira } from '@/lib/currency';
import { useCartStore } from '@/store/cartStore';

function resolveProductImage(product: { images?: { url?: string }[] }) {
  let image = '/product-placeholder.svg';
  if (product.images) {
    if (product.images[0]) {
      if (product.images[0].url) {
        image = product.images[0].url;
      }
    }
  }
  return image;
}

export default function CartPage() {
  const queryClient = useQueryClient();
  const setItemCount = useCartStore((s) => s.setItemCount);

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await api.get('/cart');
      setItemCount(res.data.items.length);
      return res.data.items as any[];
    },
  });

  async function updateQty(itemId: string, quantity: number) {
    if (quantity < 1) return;
    await api.patch(`/cart/items/${itemId}`, { quantity });
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  }

  async function removeItem(itemId: string) {
    await api.delete(`/cart/items/${itemId}`);
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  }

  const items = data ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.product.sellingPrice) + Number(item.variant?.priceDelta ?? 0)) * item.quantity,
    0
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-ivory">Your Cart</h1>

      {isLoading ? (
        <div className="mt-10 space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center rounded-2xl border border-dashed border-white/10 py-24 text-center">
          <ShoppingBag size={40} className="text-gold/60" />
          <p className="mt-4 text-lg text-ivory">Your cart is empty</p>
          <p className="mt-1 text-sm text-slate">Explore the shop to find something you'll love.</p>
          <Link href="/shop" className="btn-gold mt-6">Start Shopping</Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-4 rounded-2xl border border-white/5 bg-charcoal/50 p-4"
                >
                  <img
                    src={resolveProductImage(item.product)}
                    alt={item.product.title}
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <Link href={`/product/${item.product.slug}`} className="text-sm font-medium text-ivory hover:text-gold">
                      {item.product.title}
                    </Link>
                    {item.variant && <p className="mt-0.5 text-xs text-slate">{item.variant.name}</p>}
                    <p className="mt-1 font-display text-gold">{formatNaira(Number(item.product.sellingPrice) + Number(item.variant?.priceDelta ?? 0))}</p>
                  </div>
                  <div className="flex items-center rounded-full border border-white/10">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="p-2 text-ivory hover:text-gold"><Minus size={14} /></button>
                    <span className="w-6 text-center text-sm text-ivory">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-2 text-ivory hover:text-gold"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-slate hover:text-red-400" aria-label="Remove item">
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="h-fit rounded-2xl border border-gold/15 bg-charcoal/60 p-6">
            <h2 className="font-display text-lg font-semibold text-ivory">Order Summary</h2>
            <div className="mt-4 flex justify-between text-sm text-slate">
              <span>Subtotal</span>
              <span className="text-ivory">{formatNaira(subtotal)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-slate">
              <span>Shipping</span>
              <span className="text-ivory">{subtotal > 50000 ? 'Free' : formatNaira(2000)}</span>
            </div>
            <div className="mt-4 flex justify-between border-t border-white/10 pt-4 font-display text-lg text-ivory">
              <span>Total</span>
              <span className="text-gold">{formatNaira(subtotal + (subtotal > 50000 ? 0 : 2000))}</span>
            </div>
            <Link href="/checkout" className="btn-gold mt-6 w-full">
              Checkout <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}


