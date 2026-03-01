import Image from 'next/image';

const SISC_URL = 'http://178.156.252.103:8095'; // TODO: swap to production domain

export default function SISCFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="sisc-footer">
      <div className="sisc-footer-inner">
        <div className="sisc-footer-grid">

          {/* Brand col */}
          <div>
            <a href={SISC_URL}>
              <Image src="/sisc-logo.png" alt="Specialty Insurance SC" width={140} height={65} className="h-8 w-auto mb-4" />
            </a>
            <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed">
              The only insurance program built specifically for action sports and specialty entertainment operators.
              Powered by Alliance Risk Insurance Services.
            </p>
            <a
              href={`${SISC_URL}/get-a-quote/`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-sisc btn-sisc-primary mt-5 inline-flex"
            >
              Get a Free Quote →
            </a>
          </div>

          {/* Industries */}
          <div>
            <span className="sisc-footer-col-label">Industries</span>
            <ul className="sisc-footer-links">
              {[
                ['Paintball',    '/paintball/'],
                ['Airsoft',      '/airsoft/'],
                ['GellyBall',    '/gellyball/'],
                ['Go-Karts',     '/go-karts/'],
                ['Axe Throwing', '/axe-throwing/'],
                ['Laser Tag',    '/laser-tag/'],
                ['FEC',          '/fec/'],
                ['Special Events', '/special-events/'],
              ].map(([label, path]) => (
                <li key={label}>
                  <a href={`${SISC_URL}${path}`} target="_blank" rel="noopener noreferrer">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Coverages */}
          <div>
            <span className="sisc-footer-col-label">Coverages</span>
            <ul className="sisc-footer-links">
              {[
                ['General Liability',   '/general-liability-insurance/'],
                ['Participant Injury',  '/participant-injury-insurance/'],
                ['Property Insurance',  '/property-insurance/'],
                ['BOP',                 '/business-owners-policy-insurance/'],
                ['Commercial Auto',     '/commercial-auto-insurance/'],
                ['Excess / Umbrella',   '/excess-umbrella-liability-insurance/'],
              ].map(([label, path]) => (
                <li key={label}>
                  <a href={`${SISC_URL}${path}`} target="_blank" rel="noopener noreferrer">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <span className="sisc-footer-col-label">Contact</span>
            <ul className="sisc-footer-links">
              <li className="text-sm text-[var(--text-muted)]">Alliance Risk Insurance Services LLC</li>
              <li className="text-sm text-[var(--text-muted)]">250 W 57th St, Ste 1301</li>
              <li className="text-sm text-[var(--text-muted)]">New York, NY 10107</li>
              <li className="mt-2"><a href="tel:+12123217475">(212) 321-7475</a></li>
              <li><a href="mailto:mark.walters@joinalliancerisk.com">mark.walters@joinalliancerisk.com</a></li>
            </ul>
            <div className="mt-4">
              <span className="sisc-footer-col-label">Resources</span>
              <ul className="sisc-footer-links">
                <li><a href={`${SISC_URL}/blog/`} target="_blank" rel="noopener noreferrer">Blog</a></li>
                <li><a href={`${SISC_URL}/faq/`} target="_blank" rel="noopener noreferrer">FAQ</a></li>
                <li><a href={`${SISC_URL}/file-a-claim/`} target="_blank" rel="noopener noreferrer">File a Claim</a></li>
              </ul>
            </div>
          </div>

        </div>

        <div className="sisc-footer-bottom">
          <span>© {year} Alliance Risk Insurance Services LLC · All rights reserved</span>
          <span>Land Optimizer is a free planning tool. Not insurance advice.</span>
        </div>
      </div>
    </footer>
  );
}
