'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, ShoppingBag, Menu, X, User, Package, Bell, Settings, LogOut, LayoutGrid } from 'lucide-react';
import Logo from './Logo';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

const links = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/shop?category=sexual-wellness' + String.fromCharCode(38) + 'sort=newest', label: 'New Arrivals' },
  { href: '/shop?category=sexual-wellness' + String.fromCharCode(38) + 'sort=price_asc', label: 'Flash Deals' },
];

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const itemCount = useCartStore((s) => s.itemCount);
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } finally {
      clear();
      setAccountOpen(false);
      router.push('/login');
    }
  }

  return (
    <header className='sticky top-0 z-50 border-b border-white/5 bg-obsidian/80 backdrop-blur-xl'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-2 md:px-6 lg:px-8 lg:py-3'>
        <Logo size={104} />

        <nav className='hidden items-center gap-5 lg:flex'>
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className='group relative font-body text-sm tracking-wide text-ivory/80 transition-colors hover:text-ivory'
            >
              {l.label}
              <span className='absolute -bottom-1 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full' />
            </Link>
          ))}
        </nav>

        <div className='flex items-center gap-3'>
          <button aria-label='Search' className='hidden text-ivory/80 transition-colors hover:text-gold sm:block'>
            <Search size={17} />
          </button>
          <Link href='/wishlist' aria-label='Wishlist' className='hidden text-ivory/80 transition-colors hover:text-gold sm:block'>
            <Heart size={17} />
          </Link>
          <Link href='/cart' aria-label='Cart' className='relative text-ivory/80 transition-colors hover:text-gold'>
            <ShoppingBag size={17} />
            {itemCount > 0 && (
              <motion.span
                key={itemCount}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className='absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-ink'
              >
                {itemCount}
              </motion.span>
            )}
          </Link>
          {user ? (
            <div className='relative hidden sm:block' ref={accountRef}>
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className='flex items-center gap-2 rounded-full border border-gold/30 px-2.5 py-1.5 text-sm text-ivory transition-colors hover:border-gold hover:bg-gold/5'
              >
                <User size={14} /> {user.firstName}
              </button>
              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className='glass-panel absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl p-2'
                  >
                    {user.role === 'ADMIN' && (
                      <Link href='/admin' onClick={() => setAccountOpen(false)} className='flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ivory hover:bg-white/5'>
                        <LayoutGrid size={15} className='text-gold' /> Admin Dashboard
                      </Link>
                    )}
                    <Link href='/profile' onClick={() => setAccountOpen(false)} className='flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ivory hover:bg-white/5'>
                      <User size={15} className='text-gold' /> Profile
                    </Link>
                    <Link href='/orders' onClick={() => setAccountOpen(false)} className='flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ivory hover:bg-white/5'>
                      <Package size={15} className='text-gold' /> Orders
                    </Link>
                    <Link href='/notifications' onClick={() => setAccountOpen(false)} className='flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ivory hover:bg-white/5'>
                      <Bell size={15} className='text-gold' /> Notifications
                    </Link>
                    <Link href='/settings' onClick={() => setAccountOpen(false)} className='flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ivory hover:bg-white/5'>
                      <Settings size={15} className='text-gold' /> Settings
                    </Link>
                    <div className='my-1 h-px bg-white/5' />
                    <button onClick={handleLogout} className='flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-300 hover:bg-red-400/10'>
                      <LogOut size={15} /> Log Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href='/login'
              className='hidden items-center gap-2 rounded-full border border-gold/30 px-2.5 py-1.5 text-sm text-ivory transition-colors hover:border-gold hover:bg-gold/5 sm:flex'
            >
              <User size={14} /> Sign In
            </Link>
          )}
          <button className='text-ivory lg:hidden' onClick={() => setOpen(!open)} aria-label='Toggle menu'>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className='overflow-hidden border-t border-white/5 lg:hidden'
          >
            <div className='flex flex-col gap-4 px-6 py-6'>
              {links.map((l) => (
                <Link key={l.label} href={l.href} onClick={() => setOpen(false)} className='text-ivory/80 hover:text-gold'>
                  {l.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link href='/profile' onClick={() => setOpen(false)} className='text-ivory/80 hover:text-gold'>Profile</Link>
                  <Link href='/orders' onClick={() => setOpen(false)} className='text-ivory/80 hover:text-gold'>Orders</Link>
                  <Link href='/wishlist' onClick={() => setOpen(false)} className='text-ivory/80 hover:text-gold'>Wishlist</Link>
                  <Link href='/notifications' onClick={() => setOpen(false)} className='text-ivory/80 hover:text-gold'>Notifications</Link>
                  <Link href='/settings' onClick={() => setOpen(false)} className='text-ivory/80 hover:text-gold'>Settings</Link>
                  {user.role === 'ADMIN' && <Link href='/admin' onClick={() => setOpen(false)} className='text-ivory/80 hover:text-gold'>Admin Dashboard</Link>}
                  <button onClick={() => { setOpen(false); handleLogout(); }} className='text-left text-red-300 hover:text-red-200'>Log Out</button>
                </>
              ) : (
                <Link href='/login' onClick={() => setOpen(false)} className='text-ivory/80 hover:text-gold'>Sign In</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

