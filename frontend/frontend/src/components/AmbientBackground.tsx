'use client';

import { useMemo } from 'react';

// Purely decorative floating blue motes + glow, used behind hero content.
// Deterministic pseudo-random positions so server/client render match.
export default function AmbientBackground({ density = 24 }: { density?: number }) {
  const motes = useMemo(() => {
    return Array.from({ length: density }, (_, i) => {
      const seed = i * 137.5;
      return {
        left: seed - Math.floor(seed / 100) * 100,
        top: seed * 1.7 - Math.floor((seed * 1.7) / 100) * 100,
        size: 1 + (i - Math.floor(i / 3) * 3),
        delay: (i - Math.floor(i / 10) * 10) * 0.6,
        duration: 6 + (i - Math.floor(i / 6) * 6),
      };
    });
  }, [density]);

  return (
    <div className='pointer-events-none absolute inset-0 overflow-hidden' aria-hidden='true'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,149,255,0.18),transparent_52%)]' />
      <div className='absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[120px] animate-pulse-glow' />
      <div className='absolute -bottom-48 right-[-10%] h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-[120px] animate-float-slow' />
      {motes.map((m, i) => (
        <span
          key={i}
          className='absolute rounded-full bg-sky-300/80 animate-float-slow'
          style={{
            left: m.left + String.fromCharCode(37),
            top: m.top + String.fromCharCode(37),
            width: m.size,
            height: m.size,
            animationDelay: m.delay + 's',
            animationDuration: m.duration + 's',
            boxShadow: '0 0 10px 1px rgba(56,149,255,0.65)',
          }}
        />
      ))}
    </div>
  );
}
