/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        obsidian: 'rgb(var(--color-bg) / <alpha-value>)',
        charcoal: 'rgb(var(--color-panel) / <alpha-value>)',
        graphite: 'rgb(var(--color-surface) / <alpha-value>)',
        slate: {
          DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
          light: 'rgb(var(--color-muted) / 0.72)',
        },
        gold: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          light: 'rgb(247 225 152 / <alpha-value>)',
          dark: 'rgb(var(--color-accent-strong) / <alpha-value>)',
        },
        ivory: 'rgb(var(--color-text) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-space)', 'monospace'],
      },
      backgroundImage: {
        'gold-shimmer':
          'linear-gradient(110deg, rgb(var(--color-accent-strong)) 0%, rgb(var(--color-accent)) 25%, rgb(247 225 152) 50%, rgb(var(--color-accent)) 75%, rgb(var(--color-accent-strong)) 100%)',
        'radial-glow':
          'radial-gradient(circle at 50% 0%, rgb(var(--color-accent) / 0.15), transparent 60%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'gradient-pan': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(1deg)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-22px)' },
        },
        drift: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '25%': { transform: 'translate3d(10px, -14px, 0)' },
          '50%': { transform: 'translate3d(-8px, -28px, 0)' },
          '75%': { transform: 'translate3d(-14px, -10px, 0)' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(0px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(0px) rotate(-360deg)' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)', opacity: '0' },
          '20%': { opacity: '0.85' },
          '50%': { opacity: '0.45' },
          '100%': { transform: 'translateX(140%) skewX(-18deg)', opacity: '0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-120%)' },
          '100%': { transform: 'translateY(220%)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.65' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        tilt: {
          '0%, 100%': { transform: 'rotate(-0.8deg)' },
          '50%': { transform: 'rotate(0.8deg)' },
        },
        'soft-bounce': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'seal-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'thread-trace': {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        'gradient-pan': 'gradient-pan 14s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        drift: 'drift 18s ease-in-out infinite',
        orbit: 'orbit 22s linear infinite',
        sheen: 'sheen 8s linear infinite',
        scanline: 'scanline 6s linear infinite',
        breathe: 'breathe 4s ease-in-out infinite',
        tilt: 'tilt 9s ease-in-out infinite',
        'soft-bounce': 'soft-bounce 5s ease-in-out infinite',
        'fade-up': 'fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'seal-rotate': 'seal-rotate 18s linear infinite',
        marquee: 'marquee 28s linear infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
      },
      boxShadow: {
        gold: '0 0 0 1px rgb(var(--color-accent) / 0.3), 0 8px 30px -8px rgb(var(--color-accent) / 0.35)',
        'gold-lg': '0 20px 60px -15px rgb(var(--color-accent) / 0.4)',
      },
    },
  },
  plugins: [],
};
