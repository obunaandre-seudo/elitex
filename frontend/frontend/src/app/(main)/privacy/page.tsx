const sections = [
  {
    title: '1. Information We Collect',
    body: 'We collect information you provide directly — name, email, shipping addresses, and order history — along with usage data such as pages viewed and products browsed, used to improve recommendations.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'Your data is used to process orders, send transactional emails (confirmations, shipping updates), personalize product recommendations, and secure your account. We do not sell your personal data to third parties.',
  },
  {
    title: '3. Payment Data',
    body: 'Card and payment details are handled directly by our payment processors (Stripe, PayPal, Paystack, Flutterwave) under their own PCI-compliant systems. Elite X Shop never stores raw card numbers on its servers.',
  },
  {
    title: '4. Cookies',
    body: 'We use essential cookies to keep you signed in and remember your cart, plus optional analytics cookies to understand how the shop is used. You can control non-essential cookies in your browser settings.',
  },
  {
    title: '5. Third-Party Sharing',
    body: 'Product and inventory data is synchronized from CJ Dropshipping for the purpose of listing and fulfilling orders. Shipping details are shared with couriers strictly to deliver your order.',
  },
  {
    title: '6. Your Rights',
    body: 'You may request a copy of your data, ask us to correct it, or request deletion of your account at any time by contacting support@elitexshop.com.',
  },
  {
    title: '7. Data Retention',
    body: 'We retain order records as required for tax and legal purposes, and account data for as long as your account remains active.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <div className="section-label mx-auto w-fit">Legal</div>
      <h1 className="mt-4 text-center font-display text-4xl font-semibold text-ivory">Privacy Policy</h1>
      <p className="mt-3 text-center text-sm text-slate">Last updated July 2026</p>

      <div className="mt-14 space-y-8">
        {sections.map((s) => (
          <div key={s.title}>
            <h2 className="font-display text-lg text-gold">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">{s.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
