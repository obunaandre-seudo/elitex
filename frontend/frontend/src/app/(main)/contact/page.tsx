'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, PhoneCall, Clock3, ShieldCheck, ArrowRight } from 'lucide-react';

const whatsappNumber = '+2348134739106';
const whatsappHref = 'https://wa.me/2348134739106?text=' + encodeURIComponent('Hello Elite X Shop, I need support.');
const emailHref = 'mailto:support@elitexshop.com?subject=' + encodeURIComponent('Elite X Shop Support');

const contactMethods = [
  { icon: MessageCircle, title: 'WhatsApp', value: whatsappNumber, detail: 'Fastest for order updates and product questions.', href: whatsappHref, action: 'Chat on WhatsApp', external: true },
  { icon: Mail, title: 'Email', value: 'support@elitexshop.com', detail: 'Best for detailed requests, receipts, or follow-ups.', href: emailHref, action: 'Send an email', external: false },
] as const;

const supportPoints = [
  'Order help and delivery questions',
  'Product availability and recommendations',
  'Payment, refund, and account support',
  'Discreet, direct communication',
];

export default function ContactPage() {
  return (
    <main className='mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:py-24'>
      <section className='relative overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-br from-charcoal/80 via-obsidian to-black/70 p-6 sm:p-10 lg:p-14'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,149,255,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_30%)]' />
        <div className='relative z-10'>
          <div className='section-label'>Get in touch</div>
          <div className='mt-5 max-w-3xl'>
            <h1 className='font-display text-4xl font-semibold leading-tight text-ivory sm:text-5xl lg:text-6xl'>Contact Elite X Shop</h1>
            <p className='mt-4 max-w-2xl text-base leading-7 text-slate sm:text-lg'>Reach us directly on WhatsApp or by email for orders, support, and product questions. The layout below stays readable and usable on mobile, tablet, and desktop.</p>
          </div>
        </div>
      </section>

      <section className='mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]'>
        <div className='space-y-6'>
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <motion.div key={method.title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: index * 0.08 }} className='glass-panel rounded-3xl p-6 sm:p-7'>
                <div className='flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between'>
                  <div className='flex items-start gap-4'>
                    <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/10 text-gold'><Icon size={20} /></div>
                    <div>
                      <p className='font-display text-lg text-ivory'>{method.title}</p>
                      <p className='mt-1 text-sm text-slate'>{method.detail}</p>
                      <p className='mt-3 break-all text-base font-medium text-ivory'>{method.value}</p>
                    </div>
                  </div>
                  <a href={method.href} target={method.external ? '_blank' : undefined} rel={method.external ? 'noreferrer' : undefined} className='btn-gold w-full sm:w-auto'>{method.action}<ArrowRight size={16} /></a>
                </div>
              </motion.div>
            );
          })}

          <div className='grid gap-6 sm:grid-cols-2'>
            <div className='glass-panel rounded-3xl p-6'>
              <div className='flex items-center gap-3'><Clock3 size={18} className='text-gold' /><p className='font-display text-ivory'>Response window</p></div>
              <p className='mt-3 text-sm leading-6 text-slate'>We aim to respond as quickly as possible during active support hours. If you message outside those hours, leave your order details and we will follow up.</p>
            </div>
            <div className='glass-panel rounded-3xl p-6'>
              <div className='flex items-center gap-3'><ShieldCheck size={18} className='text-gold' /><p className='font-display text-ivory'>Support note</p></div>
              <p className='mt-3 text-sm leading-6 text-slate'>For faster help, include your name, order number, and the exact product or issue you need help with.</p>
            </div>
          </div>
        </div>

        <aside className='glass-panel rounded-[2rem] p-6 sm:p-8'>
          <p className='section-label'>Quick help</p>
          <h2 className='mt-4 font-display text-2xl font-semibold text-ivory sm:text-3xl'>What support can help with</h2>
          <ul className='mt-6 space-y-3 text-sm leading-6 text-slate sm:text-base'>{supportPoints.map((point) => (<li key={point} className='flex items-start gap-3'><span className='mt-2 h-2 w-2 shrink-0 rounded-full bg-gold' /><span>{point}</span></li>))}</ul>
          <div className='mt-8 rounded-2xl border border-white/8 bg-white/5 p-5'>
            <p className='text-sm uppercase tracking-[0.28em] text-gold'>Preferred contact</p>
            <div className='mt-4 space-y-3'>
              <a href={whatsappHref} target='_blank' rel='noreferrer' className='flex items-center justify-between rounded-xl border border-white/5 px-4 py-3 text-sm text-ivory transition-colors hover:bg-white/5'><span className='flex items-center gap-3'><PhoneCall size={16} className='text-gold' />WhatsApp</span><span className='text-slate'>Open</span></a>
              <a href={emailHref} className='flex items-center justify-between rounded-xl border border-white/5 px-4 py-3 text-sm text-ivory transition-colors hover:bg-white/5'><span className='flex items-center gap-3'><Mail size={16} className='text-gold' />support@elitexshop.com</span><span className='text-slate'>Send</span></a>
            </div>
          </div>
          <div className='mt-8'><Link href='/faq' className='btn-ghost w-full'>Visit FAQ<ArrowRight size={16} /></Link></div>
        </aside>
      </section>
    </main>
  );
}
