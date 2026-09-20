'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Truck, Package, Home } from 'lucide-react';
import { api } from '@/lib/api';
import { formatNaira } from '@/lib/currency';

const STEPS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const stepIcons = [Package, CheckCircle2, Package, Truck, Home];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await api.get(`/orders/${id}`);
      return res.data.order;
    },
  });

  if (isLoading || !data) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="skeleton h-64 rounded-2xl" />
      </main>
    );
  }

  const currentStepIndex = Math.max(STEPS.indexOf(data.status), 0);
  const isCancelled = data.status === 'CANCELLED' || data.status === 'REFUNDED';

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="section-label">Order details</div>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ivory">Order #{data.orderNumber}</h1>
      <p className="mt-1 text-sm text-slate">
        Placed {new Date(data.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {!isCancelled ? (
        <div className="glass-panel mt-10 rounded-2xl p-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => {
              const Icon = stepIcons[i];
              const active = i <= currentStepIndex;
              return (
                <div key={step} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    {i > 0 && (
                      <motion.div
                        className="h-px flex-1 bg-white/10"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: active ? 1 : 0 }}
                        style={{ transformOrigin: 'left', background: active ? '#d4af37' : undefined }}
                        transition={{ duration: 0.6 }}
                      />
                    )}
                    <motion.div
                      animate={active ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.5 }}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                        active ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-slate'
                      }`}
                    >
                      <Icon size={16} />
                    </motion.div>
                    {i < STEPS.length - 1 && (
                      <motion.div
                        className="h-px flex-1 bg-white/10"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: i < currentStepIndex ? 1 : 0 }}
                        style={{ transformOrigin: 'left', background: i < currentStepIndex ? '#d4af37' : undefined }}
                        transition={{ duration: 0.6 }}
                      />
                    )}
                  </div>
                  <span className={`mt-2 text-[11px] uppercase tracking-wide ${active ? 'text-gold' : 'text-slate'}`}>{step}</span>
                </div>
              );
            })}
          </div>
          {data.trackingNumber && (
            <p className="mt-6 text-center text-sm text-slate">
              Tracking ({data.trackingCarrier ?? 'Carrier'}): <span className="text-ivory">{data.trackingNumber}</span>
            </p>
          )}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-center text-red-300">
          This order was {data.status.toLowerCase()}.
        </div>
      )}

      <div className="mt-10 space-y-4">
        {data.items.map((item: any) => (
          <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-charcoal/50 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-ivory">{item.titleSnapshot}</p>
              <p className="text-xs text-slate">Qty {item.quantity}</p>
            </div>
            <p className="font-display text-gold">{formatNaira(Number(item.unitPrice) * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel mt-6 rounded-2xl p-6">
        <div className="flex justify-between text-sm text-slate"><span>Subtotal</span><span className="text-ivory">{formatNaira(data.subtotal)}</span></div>
        <div className="mt-2 flex justify-between text-sm text-slate"><span>Shipping</span><span className="text-ivory">{formatNaira(data.shippingTotal)}</span></div>
        {Number(data.discountTotal) > 0 && (
          <div className="mt-2 flex justify-between text-sm text-slate"><span>Discount</span><span className="text-emerald-300">-{formatNaira(data.discountTotal)}</span></div>
        )}
        <div className="mt-4 flex justify-between border-t border-white/10 pt-4 font-display text-lg text-ivory">
          <span>Total</span><span className="text-gold">{formatNaira(data.grandTotal)}</span>
        </div>
      </div>
    </main>
  );
}

