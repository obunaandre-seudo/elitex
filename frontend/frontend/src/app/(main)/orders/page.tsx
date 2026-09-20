'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, ChevronRight, Truck } from 'lucide-react';
import { api } from '@/lib/api';
import { formatNaira } from '@/lib/currency';

const statusColor: Record<string, string> = {
  PENDING: 'text-slate border-slate/30',
  PAID: 'text-gold border-gold/30',
  PROCESSING: 'text-gold border-gold/30',
  SHIPPED: 'text-blue-300 border-blue-300/30',
  DELIVERED: 'text-emerald-300 border-emerald-300/30',
  CANCELLED: 'text-red-300 border-red-300/30',
  REFUNDED: 'text-red-300 border-red-300/30',
};

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data.orders as any[];
    },
  });

  const orders = data ?? [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="section-label">Order history</div>
      <h1 className="mt-3 font-display text-4xl font-semibold text-ivory">Your Orders</h1>

      {isLoading ? (
        <div className="mt-10 space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-16 flex flex-col items-center rounded-2xl border border-dashed border-white/10 py-24 text-center">
          <Package size={40} className="text-gold/60" />
          <p className="mt-4 text-lg text-ivory">No orders yet</p>
          <p className="mt-1 text-sm text-slate">Your past orders will show up here once you check out.</p>
          <Link href="/shop" className="btn-gold mt-6">Start Shopping</Link>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                href={`/orders/${order.id}`}
                className="thread-card flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-charcoal/50 p-5 transition-colors hover:border-gold/20"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-graphite text-gold">
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="font-display text-ivory">Order #{order.orderNumber}</p>
                    <p className="text-xs text-slate">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      {' · '}{order.items?.length ?? 0} item{order.items?.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusColor[order.status] ?? 'text-slate border-slate/30'}`}>
                    {order.status}
                  </span>
                  <span className="hidden font-display text-gold sm:block">{formatNaira(order.grandTotal)}</span>
                  <ChevronRight size={18} className="text-slate" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}

