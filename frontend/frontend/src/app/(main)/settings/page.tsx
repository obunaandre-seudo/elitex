'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { KeyRound, Bell, LogOut, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const [sending, setSending] = useState(false);
  const [prefs, setPrefs] = useState({ orderUpdates: true, promotions: false, newsletter: true });

  async function sendPasswordReset() {
    if (!user?.email) return;
    setSending(true);
    try {
      await api.post('/auth/forgot-password', { email: user.email });
      toast.success('Password reset link sent to your email.');
    } catch {
      toast.error('Could not send reset link. Please try again.');
    } finally {
      setSending(false);
    }
  }

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } finally {
      clear();
      router.push('/login');
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="section-label">Account</div>
      <h1 className="mt-3 font-display text-4xl font-semibold text-ivory">Settings</h1>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-2xl border border-white/5 bg-charcoal/50 p-6">
        <div className="flex items-center gap-2 text-ivory"><KeyRound size={18} className="text-gold" /><h2 className="font-display text-lg">Password & Security</h2></div>
        <p className="mt-2 text-sm text-slate">We'll email a secure reset link to <span className="text-ivory">{user?.email}</span>.</p>
        <button onClick={sendPasswordReset} disabled={sending} className="btn-ghost mt-4 !py-2.5 text-sm disabled:opacity-60">
          {sending ? 'Sending…' : 'Send Password Reset Link'}
        </button>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 rounded-2xl border border-white/5 bg-charcoal/50 p-6">
        <div className="flex items-center gap-2 text-ivory"><Bell size={18} className="text-gold" /><h2 className="font-display text-lg">Notification Preferences</h2></div>
        <div className="mt-4 space-y-3">
          {[
            { key: 'orderUpdates', label: 'Order & shipping updates' },
            { key: 'promotions', label: 'Promotions & flash deals' },
            { key: 'newsletter', label: 'Product newsletter' },
          ].map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center justify-between rounded-xl bg-white/[0.02] px-4 py-3">
              <span className="text-sm text-ivory">{label}</span>
              <button
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key as keyof typeof prefs] }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${prefs[key as keyof typeof prefs] ? 'bg-gold' : 'bg-white/10'}`}
              >
                <motion.span
                  animate={{ x: prefs[key as keyof typeof prefs] ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 h-4 w-4 rounded-full bg-obsidian"
                />
              </button>
            </label>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/[0.03] p-6">
        <div className="flex items-center gap-2 text-red-300"><ShieldAlert size={18} /><h2 className="font-display text-lg">Session</h2></div>
        <p className="mt-2 text-sm text-slate">Sign out of Elite X Shop on this device.</p>
        <button onClick={handleLogout} className="mt-4 flex items-center gap-2 rounded-full border border-red-400/30 px-5 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-400/10">
          <LogOut size={16} /> Log Out
        </button>
      </motion.section>
    </main>
  );
}
