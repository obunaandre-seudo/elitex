const sections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account or placing an order on Elite X Shop, you agree to these Terms of Service and our Privacy Policy.',
  },
  {
    title: '2. Product Listings & Pricing',
    body: 'Products are sourced from third-party suppliers and imported with a transparent markup applied to the supplier cost. Prices, availability, and descriptions are synced periodically and may change without notice due to supplier updates.',
  },
  {
    title: '3. Orders & Payment',
    body: 'Orders are confirmed once payment is successfully processed through one of our supported providers. We reserve the right to cancel orders in cases of pricing errors, suspected fraud, or supplier stock issues, with a full refund issued.',
  },
  {
    title: '4. Shipping',
    body: 'Estimated delivery windows are provided at checkout but are not guaranteed, as fulfillment depends on supplier and courier timelines. Risk of loss passes to you upon delivery to the carrier.',
  },
  {
    title: '5. Returns & Refunds',
    body: 'Returns must be requested within 14 days of delivery via the Contact page. Refunds are issued to the original payment method once a return is received and inspected, where applicable.',
  },
  {
    title: '6. Account Responsibilities',
    body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.',
  },
  {
    title: '7. Limitation of Liability',
    body: 'Elite X Shop is not liable for indirect, incidental, or consequential damages arising from the use of the platform, to the maximum extent permitted by law.',
  },
  {
    title: '8. Changes to These Terms',
    body: 'We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the revised terms.',
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <div className="section-label mx-auto w-fit">Legal</div>
      <h1 className="mt-4 text-center font-display text-4xl font-semibold text-ivory">Terms of Service</h1>
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
