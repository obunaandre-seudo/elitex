'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Plus, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => (await api.get('/addresses')).data.addresses as any[],
  });

  async function removeAddress(id: string) {
    await api.delete(`/addresses/${id}`);
    toast.success('Address removed');
    queryClient.invalidateQueries({ queryKey: ['addresses'] });
  }

  async function handleAddAddress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    await api.post('/addresses', { ...payload, isDefault: !addresses || addresses.length === 0 });
    toast.success('Address added');
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['addresses'] });
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="section-label">Your account</div>
      <h1 className="mt-3 font-display text-4xl font-semibold text-ivory">Profile</h1>

      <div className="mt-10 flex items-center gap-5 rounded-2xl border border-gold/15 bg-charcoal/50 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
          <User size={28} />
        </div>
        <div>
          <p className="font-display text-lg text-ivory">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-slate">{user?.email}</p>
          <span className="mt-1 inline-block rounded-full border border-gold/30 px-2.5 py-0.5 text-[11px] text-gold">{user?.role}</span>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-xl text-ivory"><MapPin size={18} className="text-gold" /> Saved Addresses</h2>
        <button onClick={() => setShowForm((s) => !s)} className="btn-ghost !px-4 !py-2 text-sm">
          <Plus size={14} /> Add Address
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleAddAddress}
            className="mt-4 overflow-hidden rounded-2xl border border-white/5 bg-charcoal/50 p-6"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="fullName" required placeholder="Full name" className="input-elite" />
              <input name="phone" required placeholder="Phone number" className="input-elite" />
              <input name="line1" required placeholder="Address line 1" className="input-elite sm:col-span-2" />
              <input name="line2" placeholder="Address line 2 (optional)" className="input-elite sm:col-span-2" />
              <input name="city" required placeholder="City" className="input-elite" />
              <input name="state" placeholder="State / Province" className="input-elite" />
              <input name="postalCode" required placeholder="Postal code" className="input-elite" />
              <input name="country" required placeholder="Country" className="input-elite" />
            </div>
            <button type="submit" className="btn-gold mt-4">Save Address</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          [1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)
        ) : addresses && addresses.length > 0 ? (
          addresses.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 rounded-2xl border border-white/5 bg-charcoal/50 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ivory">{a.fullName}</p>
                  {a.isDefault && <span className="flex items-center gap-1 text-[11px] text-gold"><Star size={11} fill="currentColor" /> Default</span>}
                </div>
                <p className="mt-1 text-sm text-slate">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state ?? ''} {a.postalCode}, {a.country}</p>
                <p className="text-xs text-slate">{a.phone}</p>
              </div>
              <button onClick={() => removeAddress(a.id)} className="text-slate hover:text-red-400" aria-label="Delete address">
                <Trash2 size={18} />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate">No saved addresses yet.</p>
        )}
      </div>
    </main>
  );
}
