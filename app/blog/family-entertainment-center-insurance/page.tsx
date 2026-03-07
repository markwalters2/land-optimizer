import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = {
  title: 'Family Entertainment Center Insurance: Complete Coverage Guide (2026)',
  description: 'FEC insurance explained. Bounce houses, laser tag, go-karts, climbing walls -- every coverage line an FEC owner needs and the gaps that sink operators after a claim.',
};
const sections = [
  { title: 'Why FEC Insurance Is Complicated', content: 'A family entertainment center typically combines 3-10 different activity types under one roof -- bounce houses, laser tag, go-karts, arcade, food service, birthday party rooms. Each activity has its own risk profile, and many standard GL policies have activity-specific exclusions buried in the endorsements. You can buy a policy, pay premiums for years, and discover after a claim that the specific activity that caused the loss was excluded.' },
  { title: 'Coverage You Need for Every Activity', content: 'General liability must explicitly list or not exclude each activity. Trampoline and inflatable attractions are frequently excluded on standard GL -- verify this. Participant injury coverage (accident medical) is separate from GL and pays regardless of fault. This is essential for high-frequency minor injuries like sprained ankles and collisions. Property coverage should include all equipment, inflatables, and arcade machines -- replacement cost, not actual cash value.' },
  { title: 'Food Service and Alcohol', content: 'If you sell food, you need product liability coverage. If you serve alcohol, add liquor liability. If you have a commercial kitchen, make sure your property policy covers kitchen equipment and business interruption from a fire or equipment breakdown.' },
  { title: 'Party Room and Event Liability', content: 'Birthday parties and private events are a core revenue stream but create additional liability. Make sure your GL covers hired/rented premises liability, and that your policy does not cap coverage for events above a certain attendance threshold.' },
  { title: 'What to Look for in a Policy', content: 'Ask specifically: Is trampoline/inflatable covered? Is participant injury included or excluded? What is the per-occurrence limit for a single injured child? Is there a professional liability exclusion for your party coordinators? A well-written FEC policy runs $6,000-$18,000/year depending on size and activity mix. A poorly written one costs the same until the claim hits.' },
];
export default function FECGuide() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-sm text-gray-500 mb-8"><Link href="/" className="hover:text-[#39ff14]">Home</Link><span className="mx-2">/</span><Link href="/blog" className="hover:text-[#39ff14]">Resources</Link><span className="mx-2">/</span><span className="text-gray-300">FEC Insurance Guide</span></div>
        <span className="bg-[#39ff14]/10 text-[#39ff14] text-xs font-bold px-3 py-1 rounded-full">Family Entertainment</span>
        <h1 className="text-4xl font-bold text-white mt-4 mb-4 leading-tight">Family Entertainment Center Insurance: A Complete Coverage Guide</h1>
        <p className="text-gray-400 mb-12">9 min read · Updated March 2026</p>
        <article className="space-y-10">
          {sections.map(s => (<section key={s.title}><h2 className="text-2xl font-bold text-white mb-4">{s.title}</h2><p className="text-gray-300 leading-relaxed">{s.content}</p></section>))}
          <div className="bg-[#0d1a0d] border border-[#39ff14]/30 rounded-xl p-6"><p className="text-[#39ff14] font-bold mb-2">FEC Insurance Quote</p><p className="text-gray-400 text-sm mb-4">We write FEC coverage programs across all 50 states. Tell us your activity mix and we will build a program that actually covers what you do.</p><a href="mailto:mark.walters@joinalliancerisk.com?subject=FEC Insurance Quote" className="inline-block px-6 py-2 bg-[#39ff14] text-black text-sm font-bold rounded-lg hover:opacity-90">Get a Free Quote →</a></div>
        </article>
        <div className="mt-16 bg-[#111111] border border-[#39ff14]/30 rounded-xl p-8 text-center"><h2 className="text-2xl font-bold text-white mb-3">Plan Your FEC Layout for Free</h2><p className="text-gray-400 mb-6 text-sm">Optimize your activity zones, parking, and flow in 2 minutes.</p><Link href="/" className="inline-block px-8 py-3 bg-[#39ff14] text-black font-bold rounded-lg hover:opacity-90">Start Designing Now →</Link></div>
        <div className="mt-10 pt-8 border-t border-white/10"><Link href="/blog" className="text-[#39ff14] text-sm hover:underline">← Back to all guides</Link></div>
      </div>
    </main>
  );
}
