'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const SISC_URL = 'http://178.156.252.103:8095'; // TODO: swap to production domain

const NAV_LINKS = [
  { label: 'About Us',  href: `${SISC_URL}/about/` },
  { label: 'Businesses', href: `${SISC_URL}/businesses/` },
  { label: 'Coverages', href: `${SISC_URL}/coverages/` },
  { label: 'Resources', href: '/blog' },
];

export default function SISCHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sisc-header">
      <div className="sisc-header-inner">

        {/* Logo */}
        <a href={SISC_URL} className="flex-shrink-0" aria-label="Specialty Insurance SC — Home">
          <Image
            src="/sisc-logo.png"
            alt="Specialty Insurance SC"
            width={160}
            height={74}
            priority
            className="h-9 w-auto"
          />
        </a>

        {/* Tool breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-xs text-[var(--text-dim)]">
          <span>/</span>
          <span className="font-semibold tracking-widest uppercase text-[var(--text-muted)]">Land Optimizer</span>
        </div>

        {/* Desktop Nav */}
        <nav className="sisc-nav ml-4" aria-label="Main Navigation">
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
          ))}
        </nav>

        {/* CTA */}
        <a
          href={`${SISC_URL}/get-a-quote/`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-sisc btn-sisc-primary ml-auto"
        >
          Get a Quote
        </a>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden ml-2 flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen(o => !o)}
        >
          <span className={`block h-0.5 w-5 bg-[var(--text)] transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 w-5 bg-[var(--text)] transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-5 bg-[var(--text)] transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[var(--bg-2)] border-t border-[var(--border)] px-4 py-4 space-y-1">
          {NAV_LINKS.map(l => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--green)] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a
            href={`${SISC_URL}/get-a-quote/`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-sisc btn-sisc-primary w-full justify-center mt-3"
          >
            Get a Quote
          </a>
        </div>
      )}
    </header>
  );
}
