import Link from 'next/link';
import Logo from './Logo';

const columns = [
  {
    title: 'Shop',
    links: [
      { href: '/shop', label: 'All Products' },
      { href: '/shop?category=sexual-wellness' + String.fromCharCode(38) + 'sort=newest', label: 'New Arrivals' },
      { href: '/shop?category=sexual-wellness' + String.fromCharCode(38) + 'sort=price_asc', label: 'Flash Deals' },
      { href: '/wishlist', label: 'Wishlist' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/contact', label: 'Contact Us' },
      { href: '/faq', label: 'FAQ' },
      { href: '/orders', label: 'Track Order' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Elite X Shop' },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className='border-t border-white/5 bg-charcoal/40'>
      <div className='mx-auto max-w-7xl px-6 py-16'>
        <div className='grid grid-cols-1 gap-10 md:grid-cols-4'>
          <div>
            <Logo size={80} />
            <p className='mt-4 max-w-xs text-sm leading-relaxed text-slate'>
              Curated sex toy, honest prices. Every product is verified and
              priced with your local bank  before it reaches you.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className='mb-4 font-display text-sm font-semibold uppercase tracking-widest text-gold'>
                {col.title}
              </h4>
              <ul className='space-y-3'>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className='text-sm text-slate transition-colors hover:text-ivory'>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className='mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-slate md:flex-row'>
          <p>© {new Date().getFullYear()} Elite X Shop. All rights reserved.</p>
          <p>Secured checkout · Verified collection · Transparent markup</p>
        </div>
      </div>
    </footer>
  );
}

