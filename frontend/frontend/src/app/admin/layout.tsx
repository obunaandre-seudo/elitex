'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Small delay lets the persisted zustand store hydrate from localStorage
    // before we decide whether to redirect, avoiding a false-negative flash.
    const timer = setTimeout(() => {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'ADMIN') {
        router.replace('/');
      } else {
        setChecked(true);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [user, router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <Loader2 className="animate-spin text-gold" size={28} />
      </div>
    );
  }

  return <>{children}</>;
}
