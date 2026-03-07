import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Resources — Specialty Recreation Business Guides | Land Optimizer',
  description: 'Free guides for opening and running paintball fields, airsoft arenas, axe throwing venues, go-kart tracks, and more. Layouts, costs, insurance, and licensing.',
};

const posts = [
  {
    slug: 'how-to-open-a-paintball-field',
    title: 'How to Open a Paintball Field: Costs, Layout, and Insurance',
    desc: 'Everything you need to start a paintball business — land requirements, field design, startup costs, permits, and the insurance coverages you cannot skip.',
    tag: 'Paintball',
    readTime: '8 min',
  },
  {
    slug: 'how-to-open-an-airsoft-arena',
    title: 'How to Open an Airsoft Arena: A Complete Startup Guide',
    desc: 'Airsoft arena layout, CQB vs. outdoor field tradeoffs, waiver requirements, and the liability coverage every airsoft operator needs before opening day.',
    tag: 'Airsoft',
    readTime: '7 min',
  },
  {
    slug: 'axe-throwing-venue-startup-guide',
    title: 'Axe Throwing Venue Startup: Layout, Licensing, and Insurance',
    desc: 'Lane design standards, WATL certification, liquor license considerations, and why your general liability policy probably does not cover axe throwing.',
    tag: 'Axe Throwing',
    readTime: '6 min',
  },
  {
    slug: 'go-kart-track-insurance-guide',
    title: 'Go-Kart Track Insurance: What You Need and Why It Costs What It Does',
    desc: 'Speed limits, kart types, age restrictions, and how underwriters evaluate go-kart risk. Includes a breakdown of what a real policy covers.',
    tag: 'Go-Karts',
    readTime: '7 min',
  },
  {
    slug: 'family-entertainment-center-insurance',
    title: 'Family Entertainment Center Insurance: A Complete Coverage Guide',
    desc: 'From bounce houses to laser tag, FECs carry layered risk. This guide breaks down every coverage line an FEC owner needs and common gaps to watch for.',
    tag: 'Family Entertainment',
    readTime: '9 min',
  },
];

export default function BlogIndex() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <p className="text-[#39ff14] text-sm font-bold tracking-widest uppercase mb-3">Resources</p>
          <h1 className="text-4xl font-bold text-white mb-4">Specialty Recreation Business Guides</h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Free guides for operators opening and running specialty recreation businesses.
            Layouts, costs, permits, and the insurance questions nobody explains clearly.
          </p>
        </div>

        <div className="space-y-6">
          {posts.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <div className="bg-[#111111] border border-white/10 rounded-xl p-6 hover:border-[#39ff14]/40 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-[#39ff14]/10 text-[#39ff14] text-xs font-bold px-3 py-1 rounded-full">
                    {post.tag}
                  </span>
                  <span className="text-gray-500 text-xs">{post.readTime} read</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[#39ff14] transition-colors">
                  {post.title}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">{post.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 bg-[#111111] border border-[#39ff14]/30 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Plan Your Facility for Free</h2>
          <p className="text-gray-400 mb-6">
            Use our AI-powered layout tool to generate an optimized field plan, parking design, and cost estimate in minutes.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-[#39ff14] text-black font-bold rounded-lg hover:opacity-90 transition-all"
          >
            Start Designing Now →
          </Link>
        </div>
      </div>
    </main>
  );
}
