'use client';

import Link from 'next/link';
import Image, { type StaticImageData } from 'next/image';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck, Truck, RefreshCcw, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useMinimumLoadingState } from '@/lib/useMinimumLoadingState';
import AmbientBackground from '@/components/AmbientBackground';
import ProductCard, { ProductCardData } from '@/components/ProductCard';
import tenImage from '../../../ten.png';
import accessoriesImage from '../../../accessories.jpg';
import downloadImage from '../../../download.webp';
import viberatorImage from '../../../viberator.jpg';

const showcaseImages: StaticImageData[] = [tenImage, viberatorImage, accessoriesImage, downloadImage];
const categoryShowcase = [
  { name: 'Sexual Wellness', slug: 'sexual-wellness', image: viberatorImage },
  { name: 'Gift Ideas', slug: 'gift-ideas', image: accessoriesImage },
  { name: 'Premium Collection', slug: 'premium-collection', image: downloadImage },
];
const trustBadges = [
  { icon: ShieldCheck, label: 'Verified Listings', detail: 'Every item is reviewed before it goes live' },
  { icon: Truck, label: 'Discreet Shipping', detail: 'Tracked delivery with plain packaging' },
  { icon: RefreshCcw, label: 'Easy Returns', detail: 'Simple return flow on eligible items' },
  { icon: Sparkles, label: 'Transparent Pricing', detail: 'Prices are shown in naira' },
];

function useProducts(params: Record<string, string> = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await api.get('/products', { params });
      return data.products as ProductCardData[];
    },
  });
}

function CategoryCard({ category, index }: { category: (typeof categoryShowcase)[number]; index: number }) {
  const query = useProducts({ category: category.slug, sort: 'newest', pageSize: '1' });
  const image = query.data?.[0]?.images?.[0]?.url || category.image.src;
  const title = query.data?.[0]?.title ? category.name + ' - ' + query.data[0].title : category.name;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08 }}>
      <Link href={'/shop?category=' + category.slug} className='group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-white/5'>
        <img src={image} alt={title} className='h-full w-full object-cover transition-transform duration-700 group-hover:scale-110' />
        <div className='absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent' />
        <span className='absolute bottom-4 left-4 font-display text-lg font-semibold text-ivory'>{category.name}</span>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  const trendingToys = useProducts({ category: 'sexual-wellness', sort: 'newest', pageSize: '8' });
  const featuredWellness = useProducts({ category: 'sexual-wellness', sort: 'rating', pageSize: '4' });

  return (
    <main>
      <section className='relative overflow-hidden px-6 pb-24 pt-20 sm:min-h-[88vh] sm:pt-28'>
        <div className='absolute inset-0'>
          <Image src={tenImage} alt='' fill priority sizes='100vw' className='object-cover object-center object-[center_28%]' />
        </div>
        <div className='absolute inset-0 bg-gradient-to-b from-obsidian/10 via-obsidian/28 to-obsidian/75 dark:from-obsidian/12 dark:via-obsidian/30 dark:to-obsidian/82' />
        <AmbientBackground density={22} />
        <div className='relative z-10 mx-auto flex max-w-5xl flex-col items-center  sm:px-10 sm:py-14'>
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className='section-label mb-6'>
            <span>Shop With Class - Verified - Delivered</span>
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className='font-display text-5xl font-bold leading-[1.05] text-ivory drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl'>Shop with class<br />for <span className='text-shimmer'>premium essentials</span></motion.h1>
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }} className='mx-auto mt-6 max-w-2xl text-base text-ivory/85 drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)] sm:text-lg dark:text-slate-light'>Explore a refined collection of premium sex toys, clothing, shoes, accessories, and intimate essentials, all with discreet delivery and affordable prices.</motion.p>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className='mt-10 flex flex-col justify-center gap-4 sm:flex-row'>
            <Link href='/shop' className='btn-gold'>Start Shopping <ArrowRight size={16} /></Link>
            <Link href='/adult-wellness' className='btn-ghost'>View Catalog Guide</Link>
          </motion.div>
        </div>
      </section>

      <section className='border-y border-white/5 bg-charcoal/30 px-6 py-10'>
        <div className='mx-auto grid max-w-6xl grid-cols-2 gap-8 sm:grid-cols-4'>
          {trustBadges.map((b, i) => (
            <motion.div key={b.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }} className='glass-panel flex flex-col items-center gap-3 rounded-2xl px-4 py-4 text-center sm:flex-row sm:text-left'>
              <b.icon size={22} className='shrink-0 text-gold' />
              <div><p className='text-sm font-semibold text-ivory'>{b.label}</p><p className='text-xs text-slate'>{b.detail}</p></div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className='border-b border-white/5 bg-gradient-to-b from-charcoal/20 to-transparent px-6 py-4'>
        <div className='mx-auto max-w-7xl overflow-hidden rounded-full border border-white/8 bg-white/4 py-3 backdrop-blur-md'>
          <div className='flex w-[200%] items-center gap-8 px-4 text-xs uppercase tracking-[0.35em] text-ivory/75 animate-marquee sm:text-sm'>
            <span>Verified products</span>
            <span>Discreet delivery</span>
            <span>Luxury visuals</span>
            <span>Transparent pricing</span>
            <span>Curated essentials</span>
            <span>Verified products</span>
            <span>Discreet delivery</span>
            <span>Luxury visuals</span>
          </div>
        </div>
      </section>
      <section className='mx-auto max-w-7xl px-6 py-20'>
        <div className='mb-10 flex items-end justify-between'><div><p className='section-label mb-3'>Browse</p><h2 className='font-display text-3xl font-semibold text-ivory sm:text-4xl'>Shop by Category</h2></div></div>
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>{categoryShowcase.map((cat, i) => <CategoryCard key={cat.slug} category={cat} index={i} />)}</div>
      </section>

      <section className='mx-auto max-w-7xl px-6 py-10'>
        <div className='mb-10 flex items-end justify-between'><div><p className='section-label mb-3'>Trending New Arrivals</p><h2 className='font-display text-3xl font-semibold text-ivory sm:text-4xl'>Elite picks worth discovering</h2></div><Link href='/adult-wellness' className='hidden items-center gap-1 text-sm text-gold hover:text-gold-light sm:flex'>Open guide <ArrowRight size={14} /></Link></div>
        <ProductGrid query={trendingToys} emptyHint='Create a manual elite product in the admin dashboard to surface it first.' />
      </section>

      <section className='mx-auto max-w-7xl px-6 py-10 pb-24'>
        <div className='mb-10 flex items-end justify-between'><div><p className='section-label mb-3'>Curated Essentials</p><h2 className='font-display text-3xl font-semibold text-ivory sm:text-4xl'>Premium finds for every side of your style</h2></div></div>
        <ProductGrid query={featuredWellness} columns={4} emptyHint='The collection is loaded with curated premium products across toys, fashion, shoes, and more.' />
      </section>
    </main>
  );
}

function ProductGrid({ query, columns = 4, emptyHint }: { query: ReturnType<typeof useProducts>; columns?: number; emptyHint?: string; }) {
  const showLoading = useMinimumLoadingState(query.isLoading);

  if (showLoading) {
    return <div className={columns === 3 ? 'grid grid-cols-2 gap-5 sm:grid-cols-3' : 'grid grid-cols-2 gap-5 sm:grid-cols-4'}>{Array.from({ length: columns }).map((_, i) => <div key={i} className='skeleton aspect-square rounded-2xl' />)}</div>;
  }

  if (!query.data || query.data.length === 0) {
    return <div className='rounded-2xl border border-dashed border-white/10 py-16 text-center'><p className='text-slate'>No products yet.</p>{emptyHint && <p className='mt-2 text-sm text-slate/70'>{emptyHint}</p>}</div>;
  }

  return <div className={columns === 3 ? 'grid grid-cols-2 gap-5 sm:grid-cols-3' : 'grid grid-cols-2 gap-5 sm:grid-cols-4'}>{query.data.map((p, i) => <ProductCard key={p.id} product={p} index={i} fallbackImage={showcaseImages[i % showcaseImages.length]} />)}</div>;
}
