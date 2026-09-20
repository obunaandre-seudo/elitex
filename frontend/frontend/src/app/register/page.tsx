'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';
import AmbientBackground from '@/components/AmbientBackground';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (form.password.length < 8 || !/\d/.test(form.password))
      next.password = 'At least 8 characters, including a number.';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });

      if (data?.user && data?.accessToken) {
        setSession(data.user, data.accessToken);
      }

      toast.success(data?.message || 'Account created successfully.');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = Math.min(
    (form.password.length >= 8 ? 1 : 0) + (/\d/.test(form.password) ? 1 : 0) + (/[A-Z]/.test(form.password) ? 1 : 0) + (/[^A-Za-z0-9]/.test(form.password) ? 1 : 0),
    4
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-obsidian px-6 py-16">
      <AmbientBackground density={26} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel relative z-10 w-full max-w-md rounded-3xl p-8 shadow-gold-lg sm:p-10"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={44} />
          <p className="mt-5 font-display text-2xl font-semibold text-ivory">Create your account</p>
          <p className="mt-2 text-sm text-slate">Join Elite X Shop for curated products at honest prices.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate">First name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
                <input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} className="input-elite pl-11" placeholder="Ada" />
              </div>
              {errors.firstName && <p className="mt-1.5 text-xs text-red-400">{errors.firstName}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate">Last name</label>
              <input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} className="input-elite" placeholder="Lovelace" />
              {errors.lastName && <p className="mt-1.5 text-xs text-red-400">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input-elite pl-11" placeholder="you@example.com" />
            </div>
            {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="input-elite pl-11 pr-11"
                placeholder="Password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate hover:text-gold">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="mt-2 flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < passwordStrength ? 'bg-gold' : 'bg-white/10'}`} />
              ))}
            </div>
            {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate">Confirm password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.confirm}
              onChange={(e) => update('confirm', e.target.value)}
              className="input-elite"
              placeholder="Confirm password"
            />
            {errors.confirm && <p className="mt-1.5 text-xs text-red-400">{errors.confirm}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Create Account <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-gold hover:text-gold-light">Sign in</Link>
        </p>
      </motion.div>
    </main>
  );
}
