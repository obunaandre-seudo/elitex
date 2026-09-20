'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';
import AmbientBackground from '@/components/AmbientBackground';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function extractSessionPayload(payload: any) {
  const user = payload?.user ?? payload?.data?.user ?? payload?.userData ?? null;
  const accessToken = payload?.accessToken ?? payload?.token ?? payload?.data?.accessToken ?? payload?.data?.token ?? null;

  return { user, accessToken };
}

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const normalizedEmail = email.trim().toLowerCase();

  function validate() {
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) next.email = 'Enter a valid email address.';
    if (password.trim().length < 1) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email: normalizedEmail, password });
      const session = extractSessionPayload(response.data);

      if (!session.user || !session.accessToken) {
        throw new Error('Login succeeded but the backend response did not include a user and access token.');
      }

      clear();
      setSession(session.user, session.accessToken);
      toast.success('Welcome back, ' + session.user.firstName + '.');
      router.push(session.user.role === 'ADMIN' ? '/admin' : '/');
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? 'Unable to sign in. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className='relative flex min-h-screen items-center justify-center overflow-hidden bg-obsidian px-6 py-16'>
      <AmbientBackground density={30} />

      <div className='pointer-events-none absolute inset-0 hidden lg:block' aria-hidden='true'>
        <motion.div
          className='absolute left-[8%] top-[18%] h-40 w-32 rounded-2xl border border-gold/10 bg-charcoal/40 backdrop-blur-sm'
          animate={{ y: [0, -20, 0], rotate: [-3, 2, -3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className='absolute right-[10%] top-[28%] h-32 w-32 rounded-2xl border border-gold/10 bg-charcoal/40 backdrop-blur-sm'
          animate={{ y: [0, 24, 0], rotate: [4, -2, 4] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className='absolute bottom-[16%] left-[14%] h-28 w-40 rounded-2xl border border-gold/10 bg-charcoal/40 backdrop-blur-sm'
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className='absolute bottom-[22%] right-[14%] h-36 w-28 rounded-2xl border border-gold/10 bg-charcoal/40 backdrop-blur-sm'
          animate={{ y: [0, 18, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className='glass-panel relative z-10 w-full max-w-md rounded-3xl p-8 shadow-gold-lg sm:p-10'
      >
        <div className='mb-8 flex flex-col items-center text-center'>
          <Logo size={48} />
          <p className='mt-5 font-display text-2xl font-semibold text-ivory'>Welcome back</p>
          <p className='mt-2 text-sm text-slate'>Sign in to continue your curated shopping experience.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className='space-y-5'>
          <div>
            <label htmlFor='email' className='mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate'>
              Email
            </label>
            <div className='relative'>
              <Mail size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-slate' />
              <input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='you@example.com'
                className='input-elite pl-11'
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>
            {errors.email && <p id='email-error' className='mt-1.5 text-xs text-red-400'>{errors.email}</p>}
          </div>

          <div>
            <div className='mb-1.5 flex items-center justify-between'>
              <label htmlFor='password' className='block text-xs font-medium uppercase tracking-wider text-slate'>
                Password
              </label>
              <Link href='/forgot-password' className='text-xs text-gold/80 hover:text-gold'>
                Forgot password?
              </Link>
            </div>
            <div className='relative'>
              <Lock size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-slate' />
              <input
                id='password'
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Password'
                className='input-elite pl-11 pr-11'
                aria-invalid={!!errors.password}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-4 top-1/2 -translate-y-1/2 text-slate hover:text-gold'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className='mt-1.5 text-xs text-red-400'>{errors.password}</p>}
          </div>

          <button type='submit' disabled={loading} className='btn-gold w-full disabled:opacity-60'>
            {loading ? <Loader2 size={18} className='animate-spin' /> : <>Sign In <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className='mt-8 text-center text-sm text-slate'>
          New to Elite X Shop?{' '}
          <Link href='/register' className='font-medium text-gold hover:text-gold-light'>
            Create an account
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

