import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = {
  title: 'Axe Throwing Venue Startup: Layout, Licensing, and Insurance (2026)',
  description: 'How to open an axe throwing venue. Lane design, WATL certification, alcohol license considerations, and why your standard GL policy probably excludes axe throwing.',
};
const sections = [
  { title: 'Lane Design Standards', content: 'The World Axe Throwing League (WATL) sets the standard: each lane is 15 feet deep with a 4-foot wide target zone and at least 3 feet of clearance on each side. Lanes must have solid backstop material (typically 2-inch thick pine boards, replaced regularly). Ceiling height minimum is 10 feet. Most venues run 6-20 lanes in 2,000-5,000 sq ft.' },
  { title: 'WATL Certification', content: 'WATL certification is not legally required but is the de facto industry standard and strongly preferred by insurers. It demonstrates you follow safety protocols, which affects your premium and your ability to get coverage at all. Certification involves a venue inspection, coach training, and ongoing compliance.' },
  { title: 'Alcohol and Liquor Liability', content: 'Many axe throwing venues serve alcohol -- it is a major revenue driver. But alcohol plus sharp implements creates serious underwriting challenges. Most insurers require that participants stop throwing after a certain point in their session if alcohol is served, or require separate drunk-throwing exclusions. Your liquor liability coverage must be specifically written to address this. A standard dram shop policy may not cover axe throwing incidents.' },
  { title: 'Insurance', content: 'Standard commercial GL policies routinely exclude axe throwing. You need a specialty recreation policy with an explicit participant injury endorsement. WATL-certified venues generally get better rates. Expect $4,000-$10,000/year. If you serve alcohol, add liquor liability ($1,500-$3,500/year). Do not assume your BOP covers this -- it almost certainly does not.' },
];
export default function AxeGuide() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-sm text-gray-500 mb-8"><Link href="/" className="hover:text-[#39ff14]">Home</Link><span className="mx-2">/</span><Link href="/blog" className="hover:text-[#39ff14]">Resources</Link><span className="mx-2">/</span><span className="text-gray-300">Axe Throwing Startup Guide</span></div>
        <span className="bg-[#39ff14]/10 text-[#39ff14] text-xs font-bold px-3 py-1 rounded-full">Axe Throwing</span>
        <h1 className="text-4xl font-bold text-white mt-4 mb-4 leading-tight">Axe Throwing Venue Startup: Layout, Licensing, and Insurance</h1>
        <p className="text-gray-400 mb-12">6 min read · Updated March 2026</p>
        <article className="space-y-10">
          {sections.map(s => (<section key={s.title}><h2 className="text-2xl font-bold text-white mb-4">{s.title}</h2><p className="text-gray-300 leading-relaxed">{s.content}</p></section>))}
          <div className="bg-[#0d1a0d] border border-[#39ff14]/30 rounded-xl p-6"><p className="text-[#39ff14] font-bold mb-2">Axe Throwing Insurance Quote</p><p className="text-gray-400 text-sm mb-4">We write specialty recreation coverage for axe throwing venues across all 50 states, including alcohol-serving operations.</p><a href="mailto:mark.walters@joinalliancerisk.com?subject=Axe Throwing Venue Insurance Quote" className="inline-block px-6 py-2 bg-[#39ff14] text-black text-sm font-bold rounded-lg hover:opacity-90">Get a Free Quote →</a></div>
        </article>
        <div className="mt-16 bg-[#111111] border border-[#39ff14]/30 rounded-xl p-8 text-center"><h2 className="text-2xl font-bold text-white mb-3">Plan Your Venue Layout for Free</h2><p className="text-gray-400 mb-6 text-sm">Optimize lane count, parking, and flow in 2 minutes.</p><Link href="/" className="inline-block px-8 py-3 bg-[#39ff14] text-black font-bold rounded-lg hover:opacity-90">Start Designing Now →</Link></div>
        <div className="mt-10 pt-8 border-t border-white/10"><Link href="/blog" className="text-[#39ff14] text-sm hover:underline">← Back to all guides</Link></div>
      </div>
    </main>
  );
}
