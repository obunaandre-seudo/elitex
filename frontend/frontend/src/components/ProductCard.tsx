'use client';

import Link from 'next/link';
import Image, { type StaticImageData } from 'next/image';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import StarRating from './StarRating';
import { formatNaira } from '@/lib/currency';

export interface ProductCardData {
  id: string;
  slug: string;
  title: string;
  sellingPrice: number | string;
  basePrice?: number | string;
  ratingAverage: number | string;
  ratingCount: number;
  images: { url: string }[];
}

export default function ProductCard({ product, index = 0, fallbackImage = '/product-placeholder.svg' }: { product: ProductCardData; index?: number; fallbackImage?: string | StaticImageData }) {
  let image: string | StaticImageData = fallbackImage;
  if (product.images && product.images[0] && product.images[0].url) {
    image = product.images[0].url;
  }

  const price = Number(product.sellingPrice);
  const basePrice = product.basePrice !== undefined ? Number(product.basePrice) : null;
  const hasDiscount = basePrice !== null && Number.isFinite(basePrice) && basePrice > price;
  const discountPercent = hasDiscount ? Math.round((1 - price / basePrice!) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="thread-card group rounded-2xl border border-white/5 bg-charcoal/60 p-3 transition-all duration-300 hover:-translate-y-1 hover:border-gold/20"
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-graphite">
          <Image
            src={image}
            alt={product.title}
            unoptimized
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          {hasDiscount && (
            <div className="absolute left-3 top-3 rounded-full bg-emerald-400/90 px-2.5 py-1 text-[11px] font-semibold text-obsidian shadow-lg shadow-emerald-500/20">
              -{discountPercent}%
            </div>
          )}
          <button
            aria-label="Add to wishlist"
            onClick={(e) => e.preventDefault()}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-obsidian/60 text-ivory backdrop-blur-md transition-colors hover:text-gold"
          >
            <Heart size={16} />
          </button>
        </div>
        <div className="mt-4 space-y-2 px-1 pb-1">
          <h3 className="line-clamp-2 font-body text-sm font-medium text-ivory">{product.title}</h3>
          <StarRating value={Number(product.ratingAverage)} count={product.ratingCount} />
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-display text-lg font-semibold text-gold">{formatNaira(price)}</span>
            {hasDiscount && <span className="text-xs text-slate line-through">{formatNaira(basePrice!)}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
