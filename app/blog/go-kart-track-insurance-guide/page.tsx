import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = {
  title: 'Go-Kart Track Insurance: What You Need and Why (2026)',
  description: 'How insurers evaluate go-kart risk. Speed limits, kart types, age restrictions, and a real breakdown of what a go-kart track insurance policy covers.',
};
const sections = [
  { title: 'How Underwriters Evaluate Go-Kart Risk', content: 'The main rating factors are kart speed (under 25 mph vs. higher-speed adult tracks), track layout (whether cars can collide), age of participants, and whether alcohol is served. A family go-kart track with 15 mph electric karts is a very different risk than a high-speed adult track with 45 mph gas karts. Expect very different premiums.' },
  { title: 'Kart Types and Speed', content: 'Electric karts dominate the indoor market -- quieter, cleaner, easier to maintain, and generally lower insurance risk. Gas karts are standard for outdoor tracks and carry higher premiums. High-speed or racing tracks (25 mph+) require specialty placement and are often declined by standard markets entirely.' },
  { title: 'Age Restrictions and Waivers', content: 'Most insurers require minimum age and height requirements to be posted and enforced. Bumper karts for young children are rated separately from adult karts. Every participant must sign a waiver; minors require guardian signature. Your waiver must be reviewed by a local attorney -- generic templates have been thrown out in court repeatedly.' },
  { title: 'What the Policy Should Cover', content: 'General liability covering third-party injury, participant injury coverage (separate from GL), property coverage for karts and track equipment, and commercial auto for any shuttle or maintenance vehicles. If you rent karts off-site for events, you need an inland marine endorsement for the equipment in transit. Expect $5,000-$15,000/year for a full coverage program.' },
];
export default function GoKartGuide() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-sm text-gray-500 mb-8"><Link href="/" className="hover:text-[#39ff14]">Home</Link><span className="mx-2">/</span><Link href="/blog" className="hover:text-[#39ff14]">Resources</Link><span className="mx-2">/</span><span className="text-gray-300">Go-Kart Track Insurance Guide</span></div>
        <span className="bg-[#39ff14]/10 text-[#39ff14] text-xs font-bold px-3 py-1 rounded-full">Go-Karts</span>
        <h1 className="text-4xl font-bold text-white mt-4 mb-4 leading-tight">Go-Kart Track Insurance: What You Need and Why It Costs What It Does</h1>
        <p className="text-gray-400 mb-12">7 min read · Updated March 2026</p>
        <article className="space-y-10">
          {sections.map(s => (<section key={s.title}><h2 className="text-2xl font-bold text-white mb-4">{s.title}</h2><p className="text-gray-300 leading-relaxed">{s.content}</p></section>))}
          <div className="bg-[#0d1a0d] border border-[#39ff14]/30 rounded-xl p-6"><p className="text-[#39ff14] font-bold mb-2">Go-Kart Track Insurance Quote</p><p className="text-gray-400 text-sm mb-4">We write go-kart coverage for indoor and outdoor tracks across all 50 states. Same-day quotes available.</p><a href="mailto:mark.walters@joinalliancerisk.com?subject=Go-Kart Track Insurance Quote" className="inline-block px-6 py-2 bg-[#39ff14] text-black text-sm font-bold rounded-lg hover:opacity-90">Get a Free Quote →</a></div>
        </article>
        <div className="mt-16 bg-[#111111] border border-[#39ff14]/30 rounded-xl p-8 text-center"><h2 className="text-2xl font-bold text-white mb-3">Plan Your Track Layout for Free</h2><p className="text-gray-400 mb-6 text-sm">Optimize your track, parking, and pit area in 2 minutes.</p><Link href="/" className="inline-block px-8 py-3 bg-[#39ff14] text-black font-bold rounded-lg hover:opacity-90">Start Designing Now →</Link></div>
        <div className="mt-10 pt-8 border-t border-white/10"><Link href="/blog" className="text-[#39ff14] text-sm hover:underline">← Back to all guides</Link></div>
      </div>
    </main>
  );
}
