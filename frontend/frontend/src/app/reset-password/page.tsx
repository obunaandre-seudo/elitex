'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';
import AmbientBackground from '@/components/AmbientBackground';
import { api } from '@/lib/api';

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters.');
    if (password !== confirm) return toast.error('Passwords do not match.');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset. Please sign in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-obsidian px-6 py-16">
      <AmbientBackground density={18} />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-panel relative z-10 w-full max-w-md rounded-3xl p-8 shadow-gold-lg sm:p-10"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={44} />
          <p className="mt-5 font-display text-2xl font-semibold text-ivory">Set a new password</p>
          <p className="mt-2 text-sm text-slate">Choose a strong password you haven't used before.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate">New password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-elite pl-11" placeholder="••••••••" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate">Confirm password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-elite" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Reset Password <ArrowRight size={16} /></>}
          </button>
        </form>
      </motion.div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
