'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Package, Megaphone, Info, CheckCheck } from 'lucide-react';
import { api } from '@/lib/api';

const typeIcon: Record<string, any> = {
  ORDER_UPDATE: Package,
  PROMO: Megaphone,
  SYSTEM: Info,
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data.notifications as any[],
  });

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <div className="section-label">Stay updated</div>
          <h1 className="mt-3 font-display text-4xl font-semibold text-ivory">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 text-sm text-gold hover:text-gold-light">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="mt-10 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="mt-16 flex flex-col items-center rounded-2xl border border-dashed border-white/10 py-24 text-center">
          <Bell size={40} className="text-gold/60" />
          <p className="mt-4 text-lg text-ivory">You're all caught up</p>
          <p className="mt-1 text-sm text-slate">Order updates and announcements will show up here.</p>
        </div>
      ) : (
        <div className="mt-10 space-y-3">
          <AnimatePresence>
            {notifications.map((n, i) => {
              const Icon = typeIcon[n.type] ?? Info;
              return (
                <motion.button
                  key={n.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.03 }}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-colors ${
                    n.isRead ? 'border-white/5 bg-charcoal/40' : 'border-gold/25 bg-gold/[0.04]'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${n.isRead ? 'bg-white/5 text-slate' : 'bg-gold/10 text-gold'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-ivory">{n.title}</p>
                    <p className="mt-1 text-sm text-slate">{n.body}</p>
                    <p className="mt-2 text-xs text-slate/70">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}
