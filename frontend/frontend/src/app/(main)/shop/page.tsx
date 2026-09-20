'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { useMinimumLoadingState } from '@/lib/useMinimumLoadingState';
import ProductCard, { ProductCardData } from '@/components/ProductCard';

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

function ShopInner() {
  const params = useSearchParams();
  const router = useRouter();
  const category = params.get('category') || 'sexual-wellness';
  const sort = params.get('sort') || 'newest';
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['shop-products', category, sort, search],
    queryFn: async () => {
      const { data } = await api.get('/products', {
        params: {
          category: category === 'all' ? undefined : category,
          sort,
          search: search || undefined,
          pageSize: '1000',
        },
      });
      return data.products as ProductCardData[];
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/products/categories')).data.categories as { name: string; slug: string }[],
  });

  const categories = [
    ...(categoriesData?.filter((c) => c.slug === 'sexual-wellness') ?? []),
    ...(categoriesData?.filter((c) => c.slug !== 'sexual-wellness') ?? []),
  ];
  const showLoading = useMinimumLoadingState(isLoading);

  function updateSort(value: string) {
    const next = new URLSearchParams(params.toString());
    next.set('sort', value);
    router.push('/shop?' + next.toString());
  }

  function updateCategory(slug: string) {
    const next = new URLSearchParams(params.toString());
    if (slug === 'all') next.set('category', 'all');
    else next.set('category', slug);
    router.push('/shop?' + next.toString());
  }

  return (
    <main className='mx-auto max-w-7xl px-6 py-16'>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className='section-label mb-3'>The Full Collection</p>
        <h1 className='font-display text-4xl font-semibold text-ivory'>Shop All Products</h1>
        <p className='mt-3 max-w-2xl text-sm text-slate-light'>Sexual wellness comes first here. The default view opens on that collection, with all other categories one click away.</p>
      </motion.div>

      <div className='mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search products...'
          className='input-elite sm:max-w-xs'
        />
        <div className='flex items-center gap-3'>
          <SlidersHorizontal size={16} className='text-slate' />
          <select
            value={sort}
            onChange={(e) => updateSort(e.target.value)}
            className='rounded-lg border border-white/10 bg-charcoal px-3 py-2 text-sm text-ivory'
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className='mt-6 flex flex-wrap gap-2'>
        <button
          onClick={() => updateCategory('all')}
          className={category === 'all' ? 'rounded-full border border-gold bg-gold/10 px-4 py-1.5 text-xs text-gold transition-colors' : 'rounded-full border border-white/10 px-4 py-1.5 text-xs text-slate transition-colors hover:border-gold/40'}
        >
          All Products
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => updateCategory(c.slug)}
            className={category === c.slug ? 'rounded-full border border-gold bg-gold/10 px-4 py-1.5 text-xs text-gold transition-colors' : 'rounded-full border border-white/10 px-4 py-1.5 text-xs text-slate transition-colors hover:border-gold/40'}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className='mt-10'>
        {showLoading ? (
          <div className='grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4'>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className='skeleton aspect-square rounded-2xl' />)}
          </div>
        ) : !data || data.length === 0 ? (
          <div className='rounded-2xl border border-dashed border-white/10 py-20 text-center'>
            <p className='text-slate'>No products match your filters yet.</p>
            <p className='mt-2 text-sm text-slate/70'>Try the sexual wellness category first or search for toy-oriented products.</p>
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4'>
            {data.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopInner />
    </Suspense>
  );
}
