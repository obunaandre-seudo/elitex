'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, Minus, Plus, ShieldCheck, Truck, ZoomIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatNaira } from '@/lib/currency';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import StarRating from '@/components/StarRating';
import ProductCard, { ProductCardData } from '@/components/ProductCard';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const user = useAuthStore((s) => s.user);
  const setItemCount = useCartStore((s) => s.setItemCount);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => (await api.get(`/products/${slug}`)).data as {
      product: any;
      related: ProductCardData[];
    },
  });

  async function addToCart() {
    if (!user) {
      toast.error('Please sign in to add items to your cart.');
      return;
    }
    try {
      await api.post('/cart/items', { productId: data!.product.id, variantId, quantity });
      const cart = await api.get('/cart');
      setItemCount(cart.data.items.length);
      toast.success('Added to cart.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not add to cart.');
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="skeleton mx-auto aspect-[4/5] w-full max-w-[480px] rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-2/3 rounded-lg" />
            <div className="skeleton h-4 w-1/3 rounded-lg" />
            <div className="skeleton h-24 w-full rounded-lg" />
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;
  const { product, related } = data;
  const images: string[] = [];
  if (product.images) {
    for (let i = 0; i < product.images.length; i += 1) {
      if (product.images[i] && product.images[i].url) {
        images.push(product.images[i].url);
      }
    }
  }
  if (!images.length) {
    images.push('/product-placeholder.svg');
  }

  const basePrice = Number(product.basePrice ?? product.sellingPrice);
  const sellingPrice = Number(product.sellingPrice);
  const hasDiscount = Number.isFinite(basePrice) && basePrice > sellingPrice;
  const discountPercent = hasDiscount ? Math.round((1 - sellingPrice / basePrice) * 100) : 0;

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <div
            className="group relative aspect-[4/5] w-full max-w-[480px] cursor-zoom-in overflow-hidden rounded-2xl border border-white/5 bg-graphite"
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
          >
            <motion.img
              src={images[activeImage]}
              alt={product.title}
              animate={{ scale: zoomed ? 1.5 : 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="h-full w-full object-cover"
            />
            <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-obsidian/60 text-ivory backdrop-blur-md opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn size={16} />
            </div>
            {hasDiscount && (
              <div className="absolute left-4 top-4 rounded-full bg-emerald-400/90 px-3 py-1 text-xs font-semibold text-obsidian shadow-lg shadow-emerald-500/20">
                -{discountPercent}%
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors ${activeImage === i ? 'border-gold' : 'border-white/10'}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {product.category && <p className="section-label mb-3">{product.category.name}</p>}
          <h1 className="font-display text-3xl font-semibold text-ivory sm:text-4xl">{product.title}</h1>
          <div className="mt-3">
            <StarRating value={Number(product.ratingAverage)} count={product.ratingCount} />
          </div>
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <p className="font-display text-4xl font-bold text-gold">{formatNaira(sellingPrice)}</p>
            {hasDiscount && <p className="pb-1 text-sm text-slate line-through">{formatNaira(basePrice)}</p>}
          </div>
          <p className="mt-2 text-sm text-slate">{product.stock > 0 ? `In stock - ${product.stock} available` : 'Out of stock'}</p>

          <p className="mt-6 leading-relaxed text-slate-light">{product.description}</p>

          {product.variants?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate">Options</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    className={`rounded-lg border px-4 py-2 text-sm transition-colors ${variantId === v.id ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-ivory hover:border-gold/40'}`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-white/10">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-3 text-ivory hover:text-gold"><Minus size={14} /></button>
              <span className="w-8 text-center text-sm text-ivory">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="p-3 text-ivory hover:text-gold"><Plus size={14} /></button>
            </div>
            <button onClick={addToCart} className="btn-gold flex-1">Add to Cart</button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-ivory hover:border-gold hover:text-gold" aria-label="Add to wishlist">
              <Heart size={18} />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/5 pt-6 text-xs text-slate">
            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-gold" /> Verified import, quality checked</div>
            <div className="flex items-center gap-2"><Truck size={16} className="text-gold" /> Tracked worldwide shipping</div>
          </div>
        </motion.div>
      </div>

      {product.reviews?.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-2xl font-semibold text-ivory">Customer Reviews</h2>
          <div className="space-y-4">
            {product.reviews.map((r: any) => (
              <div key={r.id} className="rounded-xl border border-white/5 bg-charcoal/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ivory">{r.user?.firstName ?? 'Verified Buyer'}</p>
                  <StarRating value={r.rating} />
                </div>
                {r.title && <p className="mt-2 text-sm font-medium text-ivory">{r.title}</p>}
                {r.body && <p className="mt-1 text-sm text-slate">{r.body}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {related?.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-2xl font-semibold text-ivory">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </main>
  );
}
