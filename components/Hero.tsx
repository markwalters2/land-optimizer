import SISCFooter from './SISCFooter';

interface HeroProps {
  onStart: () => void;
  onTryExample: () => void;
  isLoadingExample: boolean;
}

const STATS = [
  { value: '50',   label: 'States Licensed' },
  { value: '500+', label: 'Active Policies' },
  { value: '24hr', label: 'Quote Turnaround' },
  { value: '10+',  label: 'Yrs Specialty Coverage' },
];

const INDUSTRIES = [
  '🎯 Paintball', '🔫 Airsoft', '💧 GellyBall',
  '🎉 Family Entertainment', '🏹 Axe Throwing', '🏎 Go-Karts',
  '🧗 Climbing Walls', '🎳 Bowling', '⛳ Mini Golf',
];

export default function Hero({ onStart, onTryExample, isLoadingExample }: HeroProps) {
  return (
    <div className="flex flex-col bg-[#0a0a0a]">

      {/* ── Hero band ─────────────────────────────────────────── */}
      <section className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 py-20 text-center relative overflow-hidden">

        {/* Subtle grid bg */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#00ff41 1px,transparent 1px),linear-gradient(90deg,#00ff41 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-4xl">
          {/* Eyebrow */}
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[#00ff41] mb-5">
            Free Planning Tool from Specialty Insurance SC
          </span>

          <h1 className="text-5xl md:text-7xl font-black mb-6 text-white leading-[1.05] tracking-tight">
            Design Your Facility<br />
            <em className="text-[#00ff41] not-italic">in Minutes.</em>
          </h1>

          <p className="text-lg md:text-xl text-[#888888] mb-10 max-w-2xl mx-auto leading-relaxed">
            AI-powered land use optimizer for paintball fields, airsoft arenas,
            family entertainment centers, and every specialty recreation business.
            Drop your property boundary — get a complete layout, cost estimate, and site plan.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
            <button
              onClick={onStart}
              className="btn-sisc btn-sisc-primary text-base px-8 py-3.5"
            >
              Start Designing Now →
            </button>
            <button
              onClick={onTryExample}
              disabled={isLoadingExample}
              className="btn-sisc btn-sisc-secondary text-base px-8 py-3.5 disabled:opacity-50 disabled:cursor-wait"
            >
              {isLoadingExample ? '⏳ Loading…' : '▶ See Example Layout'}
            </button>
          </div>
          <p className="text-xs text-[#555555]">
            No credit card · No account · Example: 5-acre paintball facility, Dallas TX
          </p>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      <section className="bg-[#111111] border-y border-white/[0.06] py-8">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black text-[#00ff41]">{s.value}</p>
              <p className="text-xs font-semibold tracking-widest uppercase text-[#888888] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Industries ────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#00ff41] block mb-3">Industries We Serve</span>
            <h2 className="text-3xl md:text-4xl font-black text-white">Optimized for Every Arena</h2>
            <p className="text-[#888888] mt-3 max-w-xl mx-auto">
              From small backyard paintball fields to multi-attraction family entertainment centers — our optimizer handles it.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {INDUSTRIES.map(i => (
              <span key={i} className="px-4 py-2 bg-[#111111] border border-white/[0.08] rounded text-sm text-[#e0e0e0] hover:border-[#00ff41]/40 hover:text-[#00ff41] transition-colors cursor-default">
                {i}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#111111]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#00ff41] block mb-3">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-black text-white">Three Steps to Your Layout</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: '01', title: 'Draw Your Property', body: 'Drop a pin, search your address, and draw your property boundary on a satellite map. Takes 60 seconds.' },
              { n: '02', title: 'Set Your Parameters', body: 'Choose facility type, budget tier, and whether you have utilities. We detect road access automatically.' },
              { n: '03', title: 'Get Your Layout', body: 'Receive a field placement plan, parking lot design, cost breakdown, and exportable site plan PDF.' },
            ].map(step => (
              <div key={step.n} className="bg-[#0a0a0a] border border-white/[0.08] rounded p-6 hover:border-[#00ff41]/25 transition-colors">
                <div className="text-4xl font-black text-[#00ff41]/20 mb-3">{step.n}</div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-[#888888] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={onStart} className="btn-sisc btn-sisc-primary text-base px-8 py-3.5">
              Start Designing Now →
            </button>
          </div>
        </div>
      </section>

      <SISCFooter />
    </div>
  );
}
