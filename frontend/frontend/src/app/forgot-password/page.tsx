'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, MailCheck } from 'lucide-react';
import Logo from '@/components/Logo';
import AmbientBackground from '@/components/AmbientBackground';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } finally {
      setLoading(false);
      setSent(true);
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
          <p className="mt-5 font-display text-2xl font-semibold text-ivory">Reset your password</p>
          <p className="mt-2 text-sm text-slate">Enter your email and we'll send you a reset link.</p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-elite pl-11"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Send Reset Link <ArrowRight size={16} /></>}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <MailCheck size={40} className="text-gold" />
            <p className="mt-4 text-sm text-slate">
              If an account exists for <span className="text-ivory">{email}</span>, a reset link is on its way.
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-slate">
          Remembered your password?{' '}
          <Link href="/login" className="font-medium text-gold hover:text-gold-light">Sign in</Link>
        </p>
      </motion.div>
    </main>
  );
}
