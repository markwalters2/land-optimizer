'use client';

import { useState } from 'react';

interface EmailCaptureProps {
  onSubmit: (email: string) => void;
  onClose: () => void;
  facilityType?: string;
  budget?: number;
  fieldCount?: number;
  totalArea?: number;
  address?: string;
}

export default function EmailCapture({
  onSubmit, onClose,
  facilityType, budget, fieldCount, totalArea, address,
}: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const res = await fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          facilityType,
          budget,
          fieldCount,
          totalArea,
          address,
          source: 'save-plan',
        }),
      });

      if (!res.ok) throw new Error('Submission failed');

      setStatus('success');
      onSubmit(email); // notify parent (optional downstream actions)
    } catch {
      setStatus('idle');
      setError('Something went wrong — please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#111111] border-2 border-neon-green rounded-xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
        >
          ×
        </button>

        {status === 'success' ? (
          <div className="text-center py-4">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold mb-2 text-neon-green">You're on the list!</h3>
            <p className="text-gray-300 text-sm mb-2">
              We'll send your site plan summary to <span className="text-white font-semibold">{email}</span>.
            </p>
            <p className="text-gray-400 text-sm mb-6">
              A specialist can also reach out about insurance coverage tailored for your facility type.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-neon-green text-black font-bold rounded-lg hover:opacity-90 transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-2xl font-bold mb-2">Save Your Site Plan</h3>
              <p className="text-gray-400 text-sm">
                Get a summary of your optimized layout — and learn about specialized insurance for{' '}
                {facilityType ? facilityType.charAt(0).toUpperCase() + facilityType.slice(1) + ' facilities' : 'your facility'}.
              </p>
            </div>

            {/* Layout context pill */}
            {(facilityType || budget) && (
              <div className="bg-[#1a1a1a] rounded-lg px-4 py-2 mb-4 text-xs text-gray-400 flex flex-wrap gap-3">
                {facilityType && <span>🏟 {facilityType.charAt(0).toUpperCase() + facilityType.slice(1)}</span>}
                {fieldCount && <span>⚽ {fieldCount} fields</span>}
                {budget && <span>💰 ${budget.toLocaleString()} budget</span>}
                {totalArea && <span>📐 {(totalArea / 43560).toFixed(1)} acres</span>}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="your@email.com"
                  disabled={status === 'loading'}
                  className="w-full bg-[#1a1a1a] border-2 border-white/[0.12] rounded-lg px-4 py-3 focus:border-neon-green focus:outline-none transition-colors disabled:opacity-50"
                />
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-6 py-3 bg-neon-green text-black font-bold rounded-lg hover:opacity-90 transition-all transform hover:scale-[1.02] shadow-lg shadow-neon-green/50 disabled:opacity-60 disabled:scale-100 disabled:cursor-wait"
              >
                {status === 'loading' ? 'Saving…' : 'Send Me My Plan →'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                No spam. Just your plan + a note on specialized insurance if it fits.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
