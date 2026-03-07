import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How to Open a Paintball Field: Costs, Layout, and Insurance (2026)',
  description: 'Complete guide to starting a paintball business. Land requirements, field layouts, startup costs ($50K-$250K), permits, waivers, and the insurance coverages you need before opening.',
};

export default function PaintballGuide() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] py-20 px-6">
      <div className="max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-[#39ff14]">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-[#39ff14]">Resources</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">How to Open a Paintball Field</span>
        </div>

        <span className="bg-[#39ff14]/10 text-[#39ff14] text-xs font-bold px-3 py-1 rounded-full">Paintball</span>
        <h1 className="text-4xl font-bold text-white mt-4 mb-4 leading-tight">
          How to Open a Paintball Field: Costs, Layout, and Insurance
        </h1>
        <p className="text-gray-400 mb-2">8 min read · Updated March 2026</p>
        <p className="text-gray-400 text-lg mb-12 leading-relaxed">
          Paintball is a $1B+ industry with thousands of independent operators across the US. The barrier to entry is lower than most people think -- but the mistakes in year one are predictable and expensive. This guide covers everything you need to get from idea to open day.
        </p>

        <article className="prose prose-invert prose-lg max-w-none space-y-10">

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Land Requirements</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              The minimum viable outdoor paintball field is 2-3 acres. A full-featured facility with 3-5 fields, parking, a staging area, and a pro shop needs 5-10 acres. Indoor CQB (close quarters battle) arenas can operate in 5,000-15,000 square feet of warehouse space.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              Key land factors: road access (customers will not find you if you are on a dirt road), adequate parking (1 space per 2 players plus staff), natural terrain features (hills and obstacles reduce build cost), and zoning. Most outdoor paintball falls under agricultural or recreational zoning -- check with your county before signing anything.
            </p>
            <div className="bg-[#111111] border border-white/10 rounded-lg p-5 my-4">
              <p className="text-[#39ff14] font-bold text-sm mb-2">Tip: Use Our Free Layout Tool</p>
              <p className="text-gray-400 text-sm">Drop your parcel boundary into our optimizer and get a field placement plan, parking layout, and cost estimate in under 2 minutes.</p>
              <Link href="/" className="inline-block mt-3 px-4 py-2 bg-[#39ff14] text-black text-sm font-bold rounded-lg">Try It Free →</Link>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Startup Costs</h2>
            <p className="text-gray-300 leading-relaxed mb-4">Startup costs vary widely based on whether you own or lease land, and whether you build outdoor fields or an indoor arena.</p>
            <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-gray-300">Item</th>
                    <th className="text-right p-4 text-gray-300">Low</th>
                    <th className="text-right p-4 text-gray-300">High</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ['Land lease (annual)', '$6,000', '$30,000'],
                    ['Field construction (3-5 fields)', '$8,000', '$40,000'],
                    ['Equipment (guns, masks, paint)', '$15,000', '$60,000'],
                    ['Staging/Pro shop building', '$5,000', '$50,000'],
                    ['Parking and road access', '$3,000', '$20,000'],
                    ['Insurance (first year)', '$4,000', '$12,000'],
                    ['Marketing and signage', '$2,000', '$15,000'],
                    ['Working capital (6 months)', '$10,000', '$30,000'],
                  ].map(([item, low, high]) => (
                    <tr key={item}>
                      <td className="p-4 text-gray-300">{item}</td>
                      <td className="p-4 text-right text-gray-400">{low}</td>
                      <td className="p-4 text-right text-gray-400">{high}</td>
                    </tr>
                  ))}
                  <tr className="bg-white/5 font-bold">
                    <td className="p-4 text-white">Total estimate</td>
                    <td className="p-4 text-right text-[#39ff14]">$53,000</td>
                    <td className="p-4 text-right text-[#39ff14]">$257,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Field Layout Basics</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              A standard speedball field is 120 x 50 feet with inflatable bunkers. A woodsball field can use natural terrain but typically runs 150 x 300 feet or larger. Most operators start with 2-3 fields and expand.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              Key layout principles: fields should not share boundaries without significant netting separation (stray paintball hits cause disputes), staging areas should be central with sightlines to all fields, and parking should be separated from the play areas by at least 50 feet.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Permits and Licensing</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Paintball does not require a federal license. At the state and local level you will typically need:
            </p>
            <ul className="space-y-2 mb-4">
              {[
                'Business license (your city or county)',
                'Zoning variance or special use permit if your parcel is not already zoned recreational',
                'Building permits for any permanent structures',
                'Sales tax registration if selling equipment or paint',
                'Airgun/paintball-specific ordinance check -- some municipalities restrict velocity limits',
              ].map(item => (
                <li key={item} className="flex gap-3 text-gray-300">
                  <span className="text-[#39ff14] mt-1">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Insurance: What You Actually Need</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              This is where most new operators get it wrong. A standard general liability policy from a commercial insurer often excludes paintball or adds exclusions that gut the coverage. You need a policy written for the action sports industry.
            </p>
            <div className="space-y-4">
              {[
                {
                  title: 'General Liability',
                  body: 'Covers third-party bodily injury and property damage. For paintball you need explicit coverage for participant injury -- standard GL often excludes it. Minimum $1M per occurrence, $2M aggregate. Expect $3,000-$8,000/year.',
                },
                {
                  title: 'Participant Injury / Accident Coverage',
                  body: 'Pays medical bills for injured players regardless of fault. Critical for paintball because eye and facial injuries happen. This is separate from GL and typically runs $500-$1,500/year.',
                },
                {
                  title: 'Property Insurance',
                  body: 'Covers your equipment, inflatable bunkers, pro shop inventory, and any structures. Often overlooked by new operators.',
                },
                {
                  title: 'Commercial Auto',
                  body: 'If you have a cart, shuttle vehicle, or tractor on site, it needs to be scheduled -- personal auto does not cover commercial use.',
                },
              ].map(item => (
                <div key={item.title} className="bg-[#111111] border border-white/10 rounded-lg p-5">
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-[#0d1a0d] border border-[#39ff14]/30 rounded-xl p-6">
              <p className="text-[#39ff14] font-bold mb-2">Get a Quote Built for Paintball Operators</p>
              <p className="text-gray-400 text-sm mb-4">
                Specialty Insurance SC specializes in action sports and recreation businesses. We write paintball, airsoft, and FEC coverage across all 50 states.
              </p>
              <a
                href="mailto:mark.walters@joinalliancerisk.com?subject=Paintball Field Insurance Quote"
                className="inline-block px-6 py-2 bg-[#39ff14] text-black text-sm font-bold rounded-lg hover:opacity-90"
              >
                Get a Free Quote →
              </a>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Waivers</h2>
            <p className="text-gray-300 leading-relaxed">
              Every player must sign a waiver before participating -- minors need a parent or guardian signature. A badly written waiver is almost worthless in court. Have an attorney in your state review it. Key elements: assumption of risk language, release of liability, rules acknowledgment, and media release if you photograph players.
            </p>
          </section>

        </article>

        {/* CTA */}
        <div className="mt-16 bg-[#111111] border border-[#39ff14]/30 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Plan Your Paintball Field for Free</h2>
          <p className="text-gray-400 mb-6 text-sm">
            Drop your parcel into our optimizer and get a field layout, parking plan, and cost estimate in 2 minutes.
          </p>
          <Link href="/" className="inline-block px-8 py-3 bg-[#39ff14] text-black font-bold rounded-lg hover:opacity-90 transition-all">
            Start Designing Now →
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10">
          <Link href="/blog" className="text-[#39ff14] text-sm hover:underline">← Back to all guides</Link>
        </div>

      </div>
    </main>
  );
}
