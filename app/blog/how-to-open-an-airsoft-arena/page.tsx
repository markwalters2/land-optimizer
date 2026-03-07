import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How to Open an Airsoft Arena: Startup Guide (2026)',
  description: 'Complete guide to starting an airsoft arena. CQB vs outdoor fields, venue requirements, startup costs, waivers, and the liability insurance every airsoft operator needs.',
};

const sections = [
  {
    title: 'Indoor CQB vs. Outdoor Field',
    content: `Indoor close-quarters battle (CQB) arenas typically run in 5,000-15,000 sq ft of warehouse space. Startup costs are higher (build-out, HVAC, lighting) but weather-independent and easier to secure. Outdoor airsoft fields need 5-20+ acres and are closer to paintball in layout, but allow semi-auto and higher FPS rifles which attract a different customer segment. Most successful operators start indoor and add outdoor later.`,
  },
  {
    title: 'Startup Costs',
    content: `Indoor: $40,000-$150,000 depending on lease terms, build-out scope, and rental equipment inventory. Outdoor: $20,000-$80,000 for land prep, netting, obstacle construction, and equipment. Both require a staging area, safety gear (mesh face protection is mandatory), and a chrono station to check FPS before every game.`,
  },
  {
    title: 'FPS Rules and Safety Standards',
    content: `The standard for indoor CQB is 350 FPS with .20g BBs. Outdoor fields allow 400-450 FPS. Your house rules need to be posted, enforced, and acknowledged in your waiver. Barrel covers must be required in staging areas. Full-seal eye protection (ANSI Z87.1) is the minimum -- mesh goggles do not stop BB fragments at close range.`,
  },
  {
    title: 'Insurance',
    content: `Airsoft sits in a harder-to-place segment than paintball because of the realistic-looking firearms and higher FPS. Standard commercial GL policies often exclude or restrict airsoft. You need a policy specifically written for action sports that covers participant injury, third-party bodily injury, and property. Expect $3,500-$9,000/year for a properly written policy. Do not open on a standard BOP -- the exclusions will leave you exposed.`,
  },
];

export default function AirsoftGuide() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-[#39ff14]">Home</Link><span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-[#39ff14]">Resources</Link><span className="mx-2">/</span>
          <span className="text-gray-300">How to Open an Airsoft Arena</span>
        </div>
        <span className="bg-[#39ff14]/10 text-[#39ff14] text-xs font-bold px-3 py-1 rounded-full">Airsoft</span>
        <h1 className="text-4xl font-bold text-white mt-4 mb-4 leading-tight">How to Open an Airsoft Arena: A Complete Startup Guide</h1>
        <p className="text-gray-400 mb-12">7 min read · Updated March 2026</p>
        <article className="space-y-10">
          {sections.map(s => (
            <section key={s.title}>
              <h2 className="text-2xl font-bold text-white mb-4">{s.title}</h2>
              <p className="text-gray-300 leading-relaxed">{s.content}</p>
            </section>
          ))}
          <div className="bg-[#0d1a0d] border border-[#39ff14]/30 rounded-xl p-6">
            <p className="text-[#39ff14] font-bold mb-2">Need an Airsoft Arena Insurance Quote?</p>
            <p className="text-gray-400 text-sm mb-4">Specialty Insurance SC writes airsoft coverage across all 50 states. Same-day quotes available.</p>
            <a href="mailto:mark.walters@joinalliancerisk.com?subject=Airsoft Arena Insurance Quote" className="inline-block px-6 py-2 bg-[#39ff14] text-black text-sm font-bold rounded-lg hover:opacity-90">Get a Free Quote →</a>
          </div>
        </article>
        <div className="mt-16 bg-[#111111] border border-[#39ff14]/30 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Plan Your Airsoft Arena for Free</h2>
          <p className="text-gray-400 mb-6 text-sm">Generate a field layout and cost estimate in 2 minutes.</p>
          <Link href="/" className="inline-block px-8 py-3 bg-[#39ff14] text-black font-bold rounded-lg hover:opacity-90">Start Designing Now →</Link>
        </div>
        <div className="mt-10 pt-8 border-t border-white/10">
          <Link href="/blog" className="text-[#39ff14] text-sm hover:underline">← Back to all guides</Link>
        </div>
      </div>
    </main>
  );
}
