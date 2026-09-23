'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, Package, ShoppingCart, Users, Settings as SettingsIcon,
  RefreshCw, DollarSign, TrendingUp, Percent, ScrollText, CheckCircle2, PlusCircle,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatNaira } from '@/lib/currency';
import { getProductImageUrl } from '@/lib/productImages';
import Logo from '@/components/Logo';

type Tab = 'overview' | 'sync' | 'orders' | 'customers' | 'sessions' | 'settings';

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'sync', label: 'Product Sync', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'sessions', label: 'Sessions', icon: ScrollText },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="flex min-h-screen bg-obsidian">
      <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-charcoal/40 lg:block">
        <div className="border-b border-white/5 p-6">
          <Logo size={32} />
          <p className="mt-1 text-xs uppercase tracking-widest text-gold/70">Admin Console</p>
        </div>
        <nav className="space-y-1 p-4">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                tab === id ? 'bg-gold/10 text-gold' : 'text-ivory/70 hover:bg-white/5 hover:text-ivory'
              }`}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 px-6 py-8 sm:px-10">
        <div className="mb-6 flex gap-2 overflow-x-auto lg:hidden">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs ${
                tab === id ? 'border-gold text-gold' : 'border-white/10 text-slate'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {tab === 'overview' && <Overview />}
            {tab === 'sync' && <ProductSync />}
            {tab === 'orders' && <OrdersPanel />}
            {tab === 'customers' && <CustomersPanel />}
            {tab === 'sessions' && <SessionsPanel />}
            {tab === 'settings' && <SettingsPanel />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-charcoal/50 p-6">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ? 'bg-gold/10 text-gold' : 'bg-white/5 text-ivory'}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-2xl font-semibold text-ivory">{value}</p>
      <p className="text-xs text-slate">{label}</p>
    </div>
  );
}

function Overview() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get('/admin/dashboard')).data,
  });

  const chartData = (data?.recentOrders ?? [])
    .slice()
    .reverse()
    .map((o: any) => ({ name: `#${o.orderNumber.slice(-4)}`, total: Number(o.grandTotal) }));

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ivory">Dashboard Overview</h1>
      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={DollarSign} label="Total Revenue" value={formatNaira(Number(data?.totalRevenue ?? 0))} accent />
            <StatCard icon={ShoppingCart} label="Total Orders" value={String(data?.totalOrders ?? 0)} />
            <StatCard icon={Users} label="Customers" value={String(data?.totalCustomers ?? 0)} />
            <StatCard icon={Package} label="Products" value={String(data?.totalProducts ?? 0)} />
          </div>

          <div className="mt-8 rounded-2xl border border-white/5 bg-charcoal/50 p-6">
            <h2 className="font-display text-lg text-ivory">Recent Order Value</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4af37" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" stroke="#8b8a92" fontSize={12} />
                  <YAxis stroke="#8b8a92" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#151417', border: '1px solid #d4af3733', borderRadius: 12 }} />
                  <Area type="monotone" dataKey="total" stroke="#d4af37" fill="url(#gold)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/5 bg-charcoal/50 p-6">
            <h2 className="font-display text-lg text-ivory">Recent Orders</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate">
                    <th className="pb-3">Order</th><th className="pb-3">Customer</th><th className="pb-3">Status</th><th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentOrders ?? []).map((o: any) => (
                    <tr key={o.id} className="border-t border-white/5">
                      <td className="py-3 text-ivory">#{o.orderNumber}</td>
                      <td className="py-3 text-slate">{o.user.firstName} {o.user.lastName}</td>
                      <td className="py-3 text-gold">{o.status}</td>
                      <td className="py-3 text-right text-ivory">{formatNaira(Number(o.grandTotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProductSync() {
  const [keyword, setKeyword] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [lastSyncCount, setLastSyncCount] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [description, setDescription] = useState('');
  const [productCategorySlug, setProductCategorySlug] = useState('sexual-wellness');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [externalImageUrls, setExternalImageUrls] = useState('');
  const [editingProductId, setEditingProductId] = useState('');
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('1');
  const [editDiscountPercent, setEditDiscountPercent] = useState('0');
  const [editDescription, setEditDescription] = useState('');
  const [editCategorySlug, setEditCategorySlug] = useState('sexual-wellness');
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editExternalImageUrls, setEditExternalImageUrls] = useState('');
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      editImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews, editImagePreviews]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => (await api.get('/products?pageSize=1000')).data.products,
  });

  const categories = ['all', ...new Set((products ?? []).map((p: any) => p.category?.name ?? p.category?.slug ?? 'Uncategorized'))];
  const filteredProducts = categoryFilter === 'all' ? (products ?? []) : (products ?? []).filter((p: any) => (p.category?.name ?? p.category?.slug ?? 'Uncategorized') === categoryFilter);

  async function runSync() {
    setSyncing(true);
    try {
      const res = await api.post('/products/admin/sync', { keyword });
      setLastSyncCount(Number(res.data.synced ?? 0));
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch {
      toast.error('Sync failed. Check your CJ API key in backend/.env.');
    } finally {
      setSyncing(false);
    }
  }

  async function handleCreateProduct() {
    setCreating(true);
    try {
      const payload = new FormData();
      payload.append('name', name);
      payload.append('price', String(Number(price)));
      payload.append('stock', String(Number(stock)));
      payload.append('description', description);
      payload.append('discountPercent', String(Number(discountPercent || 0)));
      payload.append('categorySlug', productCategorySlug);
      if (productCategorySlug === 'sexual-wellness') {
        externalImageUrls
          .split('\n')
          .map((url) => url.trim())
          .filter(Boolean)
          .forEach((url) => payload.append('imageUrls', url));
        imageFiles.forEach((file) => payload.append('images', file));
      } else {
        imageFiles.forEach((file) => payload.append('images', file));
      }

      const endpoint = productCategorySlug === 'sexual-wellness' ? '/admin/products/sexual-wellness' : '/admin/products';
      const res = await api.post(endpoint, payload);
      toast.success(res.data.message || 'Product created.');
      setName('');
      setPrice('');
      setStock('1');
      setDiscountPercent('0');
      setDescription('');
      setProductCategorySlug('sexual-wellness');
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      setImageFiles([]);
      setImagePreviews([]);
      setExternalImageUrls('');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create product.');
    } finally {
      setCreating(false);
    }
  }

  function onFileChange(files?: FileList | null) {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    const nextFiles = Array.from(files ?? []);
    setImageFiles(nextFiles);
    setImagePreviews(nextFiles.map((file) => URL.createObjectURL(file)));
  }

  function onEditFileChange(files?: FileList | null) {
    editImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    const nextFiles = Array.from(files ?? []);
    setEditImageFiles(nextFiles);
    setEditImagePreviews(nextFiles.map((file) => URL.createObjectURL(file)));
  }

  const adminProducts = (products ?? []).filter((p: any) => ['MANUAL-', 'ADMIN-'].some((prefix) => String(p.aliexpressId ?? '').startsWith(prefix)));
  const productCategoryOptions = [
    { label: 'Sexual Wellness', value: 'sexual-wellness' },
    { label: 'Gift Ideas', value: 'gift-ideas' },
  ];

  function startEditingProduct(product: any) {
    setEditingProductId(product.id);
    setEditName(product.title ?? '');
    setEditPrice(String(product.basePrice ?? ''));
    setEditStock(String(product.stock ?? '1'));
    setEditDiscountPercent(product.basePrice > product.sellingPrice ? String(Math.round((1 - Number(product.sellingPrice) / Number(product.basePrice)) * 100)) : '0');
    setEditDescription(product.description ?? '');
    setEditCategorySlug(product.category?.slug === 'gift-ideas' ? 'gift-ideas' : 'sexual-wellness');
    editImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setEditImageFiles([]);
    setEditImagePreviews([]);
    setEditImageUrl(product.images?.[0]?.url ?? '');
    setEditExternalImageUrls((product.images ?? []).map((image: any) => image.url).filter(Boolean).join('\n'));
  }

  async function handleUpdateProduct() {
    if (!editingProductId) {
      toast.error('Select an admin-created product to edit first.');
      return;
    }

    setEditing(true);
    try {
      const payload = new FormData();
      payload.append('name', editName);
      payload.append('price', String(Number(editPrice)));
      payload.append('stock', String(Number(editStock)));
      payload.append('description', editDescription);
      payload.append('discountPercent', String(Number(editDiscountPercent || 0)));
      payload.append('categorySlug', editCategorySlug);
      if (editCategorySlug === 'sexual-wellness') {
        editExternalImageUrls
          .split('\n')
          .map((url) => url.trim())
          .filter(Boolean)
          .forEach((url) => payload.append('imageUrls', url));
      } else {
        editImageFiles.forEach((file) => payload.append('images', file));
      }

      const res = await api.patch(`/admin/products/${editingProductId}`, payload);
      toast.success(res.data.message || 'Product updated.');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update product.');
    } finally {
      setEditing(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ivory">Premium Collection</h1>
      <p className="mt-1 text-sm text-slate">
        Create Sexual Wellness products from external HTTPS images, add Gift Ideas with uploads, or refresh the Premium Collection.
      </p>

      <div className="mt-6 rounded-2xl border border-gold/15 bg-charcoal/50 p-6">
        <div className="flex items-center gap-2 text-gold">
          <PlusCircle size={18} />
          <h2 className="font-display text-lg">Create Product</h2>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" className="input-elite" />
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" type="number" step="0.01" min="0" className="input-elite" />
          <input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Amount available" type="number" min="0" className="input-elite" />
          <input value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="Discount % (optional)" type="number" step="0.1" min="0" max="100" className="input-elite" />
          <select
            value={productCategorySlug}
            onChange={(e) => {
              setProductCategorySlug(e.target.value);
              imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
              setImageFiles([]);
              setImagePreviews([]);
              setExternalImageUrls('');
            }}
            className="input-elite"
          >
            {productCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => onFileChange(e.target.files)} className="input-elite md:col-span-2" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write-up about the product" rows={4} className="input-elite md:col-span-2" />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleCreateProduct} disabled={creating} className="btn-gold disabled:opacity-60">
            {creating ? 'Creating...' : 'Create Product'}
          </button>
          <p className="text-xs text-slate">{productCategorySlug === 'sexual-wellness' ? 'Choose image files; they are stored directly in the database.' : 'Gift Ideas images are uploaded to Cloudinary.'}</p>
        </div>

        {imagePreviews.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/5 bg-obsidian/60 p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate">Image Preview</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {imagePreviews.map((preview) => (
                <img key={preview} src={preview} alt="Preview" className="h-48 w-full rounded-xl object-cover" />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-gold/15 bg-charcoal/50 p-6">
        <div className="flex items-center gap-2 text-gold">
          <SettingsIcon size={18} />
          <h2 className="font-display text-lg">Edit Product</h2>
        </div>
        <p className="mt-2 text-sm text-slate">Pick one admin-created product below, update the details, and save the changes.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <select
            value={editingProductId}
            onChange={(e) => {
              const product = adminProducts.find((item: any) => item.id === e.target.value);
              setEditingProductId(e.target.value);
              if (product) startEditingProduct(product);
            }}
            className="input-elite md:col-span-2"
          >
            <option value="">Select a product</option>
            {adminProducts.map((product: any) => (
              <option key={product.id} value={product.id}>{product.title}</option>
            ))}
          </select>
          <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Product name" className="input-elite" />
          <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="Price" type="number" step="0.01" min="0" className="input-elite" />
          <input value={editStock} onChange={(e) => setEditStock(e.target.value)} placeholder="Amount available" type="number" min="0" className="input-elite" />
          <input value={editDiscountPercent} onChange={(e) => setEditDiscountPercent(e.target.value)} placeholder="Discount % (optional)" type="number" step="0.1" min="0" max="100" className="input-elite" />
          <select
            value={editCategorySlug}
            onChange={(e) => {
              setEditCategorySlug(e.target.value);
              editImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
              setEditImageFiles([]);
              setEditImagePreviews([]);
              setEditExternalImageUrls('');
            }}
            className="input-elite"
          >
            {productCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => onEditFileChange(e.target.files)} className="input-elite md:col-span-2" />
          <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Write-up about the product" rows={4} className="input-elite md:col-span-2" />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleUpdateProduct} disabled={editing || !editingProductId} className="btn-gold disabled:opacity-60">
            {editing ? 'Saving...' : 'Save Changes'}
          </button>
          <p className="text-xs text-slate">{editCategorySlug === 'sexual-wellness' ? 'Sexual Wellness images are stored as external URLs with no Cloudinary public ID.' : 'Gift Ideas image changes use Cloudinary uploads.'}</p>
        </div>

        {(editImagePreviews.length > 0 || editImageUrl) && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/5 bg-obsidian/60 p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate">Image Preview</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(editImagePreviews.length ? editImagePreviews : [editImageUrl]).map((preview) => (
                <img key={preview} src={preview} alt="Edit preview" className="h-48 w-full rounded-xl object-cover" />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-gold/15 bg-charcoal/50 p-6 sm:flex-row">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Keyword to search the Premium Collection (leave blank to sync catalog)"
          className="input-elite flex-1"
        />
        <button onClick={runSync} disabled={syncing} className="btn-gold shrink-0 disabled:opacity-60">
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Run Sync'}
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-white/5 bg-charcoal/50 p-6">
        <h2 className="font-display text-lg text-ivory">Catalog ({filteredProducts.length})</h2>
        {isLoading ? (
          <div className="mt-4 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate">
                  <th className="pb-3">Product</th><th className="pb-3">Base Price</th><th className="pb-3">Markup</th><th className="pb-3">Selling Price</th><th className="pb-3">Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p: any) => (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="flex items-center gap-3 py-3 text-ivory">
                      <img src={getProductImageUrl(p)} className={'h-9 w-9 rounded-lg object-cover'} alt={p.title} />
                      <div>
                        <span className="line-clamp-1 max-w-[220px]">{p.title}</span>
                        {['MANUAL-', 'ADMIN-'].some((prefix) => String(p.aliexpressId ?? '').startsWith(prefix)) && <span className="mt-1 block text-[11px] uppercase tracking-wide text-gold">Admin</span>}
                      </div>
                    </td>
                    <td className="py-3 text-slate">{formatNaira(Number(p.basePrice))}</td>
                    <td className="py-3 text-slate">{Number(p.markupPercent)}%</td>
                    <td className="py-3 text-gold">{formatNaira(Number(p.sellingPrice))}</td>
                    <td className="py-3 text-slate">{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersPanel() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard-orders'],
    queryFn: async () => (await api.get('/admin/dashboard')).data.recentOrders,
  });

  async function updateStatus(id: string, status: string) {
    await api.patch(`/orders/${id}/status`, { status });
    toast.success(`Order updated to ${status}`);
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-orders'] });
  }

  const statuses = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ivory">Order Management</h1>
      {isLoading ? (
        <div className="mt-6 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : (
        <div className="mt-6 space-y-3">
          {(data ?? []).map((o: any) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-charcoal/50 p-5">
              <div>
                <p className="font-display text-ivory">#{o.orderNumber}</p>
                <p className="text-xs text-slate">{o.user.firstName} {o.user.lastName} - {formatNaira(Number(o.grandTotal))}</p>
              </div>
              <select
                defaultValue={o.status}
                onChange={(e) => updateStatus(o.id, e.target.value)}
                className="input-elite w-auto !py-2 text-sm"
              >
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SessionsPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => (await api.get('/admin/sessions')).data.sessions,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ivory">Active Sessions</h1>
      {isLoading ? (
        <div className="mt-6 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      ) : error ? (
        <p className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          Unable to load active sessions right now.
        </p>
      ) : (data ?? []).length === 0 ? (
        <p className="mt-6 rounded-2xl border border-white/5 bg-charcoal/50 p-4 text-sm text-slate">
          No active sessions found.
        </p>
      ) : (
        <div className="mt-6 space-y-3 rounded-2xl border border-white/5 bg-charcoal/50 p-6">
          {(data ?? []).map((session: any) => (
            <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/[0.02] px-4 py-3">
              <div>
                <p className="font-display text-ivory">{session.user.firstName} {session.user.lastName}</p>
                <p className="text-xs text-slate">{session.user.email} ? {session.user.role}</p>
              </div>
              <p className="text-xs text-slate">Signed in {new Date(session.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomersPanel() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/admin/users')).data.users,
  });

  async function toggleRole(id: string, currentRole: string) {
    const role = currentRole === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    await api.patch(`/admin/users/${id}/role`, { role });
    toast.success(`Role updated to ${role}`);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ivory">Customers</h1>
      {isLoading ? (
        <div className="mt-6 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/5 bg-charcoal/50 p-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate">
                <th className="pb-3">Name</th><th className="pb-3">Email</th><th className="pb-3">Verified</th><th className="pb-3">Role</th><th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((u: any) => (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="py-3 text-ivory">{u.firstName} {u.lastName}</td>
                  <td className="py-3 text-slate">{u.email}</td>
                  <td className="py-3">{u.isEmailVerified ? <CheckCircle2 size={16} className="text-emerald-300" /> : <span className="text-slate">No</span>}</td>
                  <td className="py-3 text-gold">{u.role}</td>
                  <td className="py-3">
                    <button onClick={() => toggleRole(u.id, u.role)} className="text-xs text-gold underline underline-offset-2">
                      Make {u.role === 'ADMIN' ? 'Customer' : 'Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SettingsPanel() {
  const [markup, setMarkup] = useState('35');
    const [cjRate, setCjRate] = useState('1600');
    const [savingRate, setSavingRate] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: logs } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => (await api.get('/admin/audit-logs')).data.logs,
  });

 async function saveCjRate() {
  setSavingRate(true);
  try {
    const res = await api.post('/admin/settings/cj-rate', {
      cjUsdToNgnRate: parseFloat(cjRate),
    });

    toast.success(res.data.message);
    queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  } catch {
    toast.error('Failed to update collection rate.');
  } finally {
    setSavingRate(false);
  }
}

async function saveMarkup() {
  setSaving(true);

  try {
    const res = await api.post('/admin/settings/markup', {
      markupPercent: parseFloat(markup),
    });

    toast.success(res.data.message);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  } catch {
    toast.error('Failed to update markup.');
  } finally {
    setSaving(false);
  }
}
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ivory">Settings</h1>

      <div className="mt-6 rounded-2xl border border-gold/15 bg-charcoal/50 p-6">
        <div className="flex items-center gap-2 text-gold"><Percent size={18} /><h2 className="font-display text-lg">Default Markup Percentage</h2></div>
        <p className="mt-2 text-sm text-slate">Applied automatically to every synced Premium Collection product. Admin-created products keep their own prices.</p>
        <div className="mt-4 flex items-center gap-3">
          <input
            type="number" step="0.1" min="0" value={markup}
            onChange={(e) => setMarkup(e.target.value)}
            className="input-elite w-32"
          />
          <span className="text-slate">%</span>
          <button onClick={saveMarkup} disabled={saving} className="btn-gold disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Markup'}
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-gold/15 bg-charcoal/50 p-6">
        <div className="flex items-center gap-2 text-gold"><DollarSign size={18} /><h2 className="font-display text-lg">Collection USD to NGN Rate</h2></div>
        <p className="mt-2 text-sm text-slate">Used when importing Premium Collection products. Change this if the exchange rate moves.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="number"
            step="0.01"
            min="0"
            value={cjRate}
            onChange={(e) => setCjRate(e.target.value)}
            className="input-elite w-full sm:w-56"
          />
          <button onClick={saveCjRate} disabled={savingRate} className="btn-gold disabled:opacity-60">
            {savingRate ? 'Saving...' : 'Save Rate'}
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/5 bg-charcoal/50 p-6">
        <div className="flex items-center gap-2 text-ivory"><ScrollText size={18} className="text-gold" /><h2 className="font-display text-lg">Audit Log</h2></div>
        <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
          {(logs ?? []).map((log: any) => (
            <div key={log.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-2.5 text-sm">
              <span className="text-ivory">{log.action}</span>
              <span className="text-xs text-slate">{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'} - {new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-charcoal/50 p-6">
          <h3 className="font-display text-ivory">Payment Provider</h3>
          <p className="mt-1 text-xs text-slate">Paystack is the only supported checkout provider.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {['Paystack'].map((p) => (
              <li key={p} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                <span className="text-ivory">{p}</span>
                <span className="text-xs text-slate">Set in backend/.env</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/5 bg-charcoal/50 p-6">
          <h3 className="font-display text-ivory">Premium Collection Connection</h3>
          <p className="mt-1 text-xs text-slate">Configure collection API credentials in backend/.env to go live.</p>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2 text-sm text-ivory">
            <TrendingUp size={14} className="text-gold" /> Using mock catalog fallback until configured
          </div>
        </div>
      </div>
    </div>
  );
}












