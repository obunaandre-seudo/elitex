'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

const faqs = [
  {
    q: 'How is the price calculated on each product?',
    a: 'Every listing is imported at its supplier cost, and a transparent markup (10% by default) is applied automatically. You can see the final price before you add anything to your cart — there are no hidden fees added at checkout.',
  },
  {
    q: 'How long does shipping take?',
    a: 'Since products ship from our supplier network, delivery windows vary by item and destination — typically 7 to 20 business days. Once your order ships, you will receive a tracking number by email and can follow progress from your Orders page.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'We support Stripe, PayPal, Paystack, and Flutterwave, so you can check out with a card, digital wallet, or regional payment method depending on your location.',
  },
  {
    q: 'Can I return or exchange an item?',
    a: 'Yes. Reach out within 14 days of delivery through the Contact page with your order number, and our support team will walk you through the return or exchange process for that item.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'We never store your raw card details. All payments are processed directly through PCI-compliant providers, and your account is protected with hashed passwords and secure session tokens.',
  },
  {
    q: 'How do I track my order?',
    a: 'Go to Orders in your account menu and select the order you want to follow. You will see a live status timeline plus a tracking number once it ships.',
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <div className="section-label mx-auto w-fit">Help center</div>
      <h1 className="mt-4 text-center font-display text-4xl font-semibold text-ivory">Frequently Asked Questions</h1>

      <div className="mt-12 space-y-3">
        {faqs.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="overflow-hidden rounded-2xl border border-white/5 bg-charcoal/50">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-display text-ivory">{item.q}</span>
                <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3 }} className="shrink-0 text-gold">
                  <Plus size={20} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <p className="px-6 pb-5 text-sm leading-relaxed text-slate">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </main>
  );
}
