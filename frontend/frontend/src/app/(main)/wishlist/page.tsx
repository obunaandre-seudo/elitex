'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';
import { formatNaira } from '@/lib/currency';
import StarRating from '@/components/StarRating';

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

export default function WishlistPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await api.get('/wishlist');
      return res.data.items as any[];
    },
  });

  async function remove(productId: string) {
    await api.delete(`/wishlist/${productId}`);
    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
  }

  async function moveToCart(productId: string) {
    await api.post('/cart/items', { productId, quantity: 1 });
    queryClient.invalidateQueries({ queryKey: ['cart'] });
    await remove(productId);
  }

  const items = data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="section-label">Saved for later</div>
      <h1 className="mt-3 font-display text-4xl font-semibold text-ivory">Your Wishlist</h1>

      {isLoading ? (
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center rounded-2xl border border-dashed border-white/10 py-24 text-center">
          <Heart size={40} className="text-gold/60" />
          <p className="mt-4 text-lg text-ivory">Your wishlist is empty</p>
          <p className="mt-1 text-sm text-slate">Tap the heart on any product to save it here.</p>
          <Link href="/shop" className="btn-gold mt-6">Browse the Shop</Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="thread-card group rounded-2xl border border-white/5 bg-charcoal/60 p-3"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-graphite">
                  <img
                    src={resolveProductImage(item.product)}
                    alt={item.product.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <button
                    onClick={() => remove(item.product.id)}
                    aria-label="Remove from wishlist"
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-obsidian/70 text-ivory backdrop-blur-md hover:text-gold"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="mt-3 space-y-1.5 px-1">
                  <Link href={`/product/${item.product.slug}`} className="line-clamp-2 text-sm font-medium text-ivory hover:text-gold">
                    {item.product.title}
                  </Link>
                  <StarRating value={Number(item.product.ratingAverage)} count={item.product.ratingCount} />
                  <p className="font-display text-gold">{formatNaira(Number(item.product.sellingPrice))}</p>
                  <button onClick={() => moveToCart(item.product.id)} className="btn-ghost mt-2 w-full !py-2 text-xs">
                    <ShoppingBag size={14} /> Move to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}






