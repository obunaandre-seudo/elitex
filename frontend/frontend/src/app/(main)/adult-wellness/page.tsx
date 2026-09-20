'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useMinimumLoadingState } from '@/lib/useMinimumLoadingState';
import ProductCard, { ProductCardData } from '@/components/ProductCard';

const categories = [
  { name: 'Sexual Wellness', slug: 'sexual-wellness', image: 'https://images.unsplash.com/photo-1588596692308-1f2b7c4c8d89?w=700' },
  { name: 'Massagers', slug: 'massagers', image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=700' },
  { name: 'Couples', slug: 'couples', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a8f3f8?w=700' },
  { name: 'coming soon', slug: 'lubricants', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=700' },
];

const trust = [
  { icon: ShieldCheck, title: 'Verified listings', text: 'Pulled from the latest collection and shown with real pricing.' },
  { icon: Truck, title: 'Discreet delivery', text: 'Plain packaging and tracked fulfillment.' },
  { icon: Sparkles, title: 'Toy-first curation', text: 'Manual elite listings are surfaced before synced items.' },
];

function useProducts(params: Record<string, string> = {}) {
  return useQuery({
    queryKey: ['adult-wellness-products', params],
    queryFn: async () => (await api.get('/products', { params })).data.products as ProductCardData[],
  });
}

export default function AdultWellnessPage() {
  const trending = useProducts({ category: 'sexual-wellness', sort: 'newest', pageSize: '8' });
  const wellness = useProducts({ category: 'sexual-wellness', sort: 'rating', pageSize: '4' });
  const showTrendingLoading = useMinimumLoadingState(trending.isLoading);
  const showWellnessLoading = useMinimumLoadingState(wellness.isLoading);

  return (
    <main className='mx-auto max-w-7xl px-6 py-16'>
      <section className='grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center'>
        <div>
          <p className='section-label mb-4'>Adult Wellness Collection</p>
          <h1 className='font-display text-5xl font-semibold leading-tight text-ivory sm:text-6xl'>Elite adult wellness first, with discreet shopping built in.</h1>
          <p className='mt-6 max-w-2xl text-base text-slate-light sm:text-lg'>
            Explore a refined selection of vibrators, personal stimulators, couples toys, lubes, and other adult essentials.
            Manual products created in the admin dashboard appear before CJ-synced items in the collection.
          </p>
          <div className='mt-8 flex flex-wrap gap-3'>
            <Link href='/shop?category=sexual-wellness' className='btn-gold'>
              Explore Collection <ArrowRight size={16} />
            </Link>
            <Link href='/shop' className='btn-ghost'>
              Browse All Categories
            </Link>
          </div>
        </div>

        <div className='rounded-3xl border border-white/5 bg-charcoal/60 p-6 shadow-2xl shadow-black/20'>
          <div className='space-y-4'>
            {trust.map((item) => (
              <div key={item.title} className='flex gap-4 rounded-2xl border border-white/5 bg-obsidian/60 p-4'>
                <item.icon size={20} className='mt-1 shrink-0 text-gold' />
                <div>
                  <p className='font-medium text-ivory'>{item.title}</p>
                  <p className='mt-1 text-sm text-slate'>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='mt-20'>
        <div className='mb-8 flex items-end justify-between gap-4'>
          <div>
            <p className='section-label mb-3'>Trending New Arrivals</p>
            <h2 className='font-display text-3xl font-semibold text-ivory sm:text-4xl'>Elite wellness picks from the latest drops</h2>
          </div>
          <Link href='/shop?category=sexual-wellness&sort=newest' className='hidden items-center gap-1 text-sm text-gold hover:text-gold-light sm:flex'>
            Explore collection <ArrowRight size={14} />
          </Link>
        </div>

        {showTrendingLoading ? (
          <div className='grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4'>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className='skeleton aspect-square rounded-2xl' />)}
          </div>
        ) : !trending.data || trending.data.length === 0 ? (
          <div className='rounded-2xl border border-dashed border-white/10 py-16 text-center text-slate'>
            No elite adult wellness products surfaced yet.
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4'>
            {trending.data.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
          </div>
        )}
      </section>

      <section className='mt-20'>
        <div className='mb-8'>
          <p className='section-label mb-3'>Sexual Wellness Essentials</p>
          <h2 className='font-display text-3xl font-semibold text-ivory sm:text-4xl'>Top rated items for the full store experience</h2>
        </div>
        {showWellnessLoading ? (
          <div className='grid grid-cols-2 gap-5 sm:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className='skeleton aspect-square rounded-2xl' />)}
          </div>
        ) : wellness.data?.length ? (
          <div className='grid grid-cols-2 gap-5 sm:grid-cols-4'>
            {wellness.data.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
          </div>
        ) : (
          <div className='rounded-2xl border border-dashed border-white/10 py-16 text-center text-slate'>
            No elite wellness products surfaced yet.
          </div>
        )}
      </section>

      <section className='mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {categories.map((category) => (
          <Link key={category.slug} href={'/shop?category=' + category.slug} className='group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/5'>
            <img src={category.image} alt={category.name} className='h-full w-full object-cover transition-transform duration-700 group-hover:scale-110' />
            <div className='absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/30 to-transparent' />
            <span className='absolute bottom-4 left-4 font-display text-lg font-semibold text-ivory'>{category.name}</span>
          </Link>
        ))}
      </section>

      <section className='mt-20 rounded-3xl border border-white/5 bg-charcoal/40 p-8'>
        <h2 className='font-display text-3xl font-semibold text-ivory'>A note on the collection</h2>
        <p className='mt-4 max-w-3xl text-slate-light'>
          Manual elite items created in the admin panel appear first in the collection, followed by CJ-synced products.
        </p>
      </section>
    </main>
  );
}
