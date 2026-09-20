import { ShieldCheck, Globe2, Gem, Handshake } from 'lucide-react';

const pillars = [
  { icon: Globe2, title: 'Sourced Globally', body: 'We work directly with verified manufacturers to bring you products without the usual markup chain.' },
  { icon: ShieldCheck, title: 'Verified Quality', body: 'Every listing is checked for authenticity, ratings, and seller reliability before it reaches the shop.' },
  { icon: Gem, title: 'Transparent Pricing', body: 'Our markup is fixed and visible in settings — never hidden fees, never surprise charges at checkout.' },
  { icon: Handshake, title: 'Real Support', body: 'A human reviews every dispute. We stand behind what we sell, not just what we list.' },
];

export default function AboutPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow" />
      <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="section-label mx-auto w-fit">Our story</div>
        <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-ivory sm:text-5xl">
          Boutique curation, <span className="text-shimmer">wholesale reach</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-slate">
          Elite X Shop started with a simple frustration: incredible products exist on global marketplaces,
          but finding them takes hours of scrolling through look-alike listings and unreliable sellers.
          We built a shop that does that filtering for you — then prices everything honestly, with a
          single, visible markup instead of a maze of fees.
        </p>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="thread-card rounded-2xl border border-white/5 bg-charcoal/50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <Icon size={22} />
              </div>
              <h3 className="mt-5 font-display text-lg text-ivory">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
