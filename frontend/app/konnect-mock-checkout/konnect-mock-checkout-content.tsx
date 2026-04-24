'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function KonnectMockCheckoutContent() {
  const searchParams = useSearchParams();
  const paymentRef = searchParams.get('paymentRef') || '';
  const successUrl = searchParams.get('successUrl') || '/';
  const failUrl = searchParams.get('failUrl') || '/';

  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [message, setMessage] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  const confirm = async (outcome: 'success' | 'fail') => {
    setStatus('loading');
    try {
      const accessToken =
        (typeof window !== 'undefined' &&
          (localStorage.getItem('accessToken') || localStorage.getItem('token'))) ||
        '';

      const res = await fetch(
        `${backendUrl}/payment/konnect/mock/confirm?paymentRef=${encodeURIComponent(paymentRef)}&outcome=${outcome}`,
        {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          credentials: 'include',
        },
      );
      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.message || 'Confirmation failed');
        setStatus('idle');
        return;
      }

      setMessage(`Payment marked as ${outcome}. Redirecting...`);
      setStatus('done');

      // Redirect to the appropriate URL
      const target = outcome === 'success'
        ? successUrl.replace('PAYMENT_REF_PLACEHOLDER', paymentRef)
        : failUrl;

      setTimeout(() => {
        window.location.href = target;
      }, 1200);
    } catch (e: any) {
      setMessage(e?.message || 'Network error');
      setStatus('idle');
    }
  };

  if (!paymentRef) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7f7fe]">
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
          <p className="text-red-500 font-medium">Missing paymentRef parameter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7f7fe]">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#8e78fb]/10 mb-2">
            <svg className="w-6 h-6 text-[#8e78fb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 inline-block">
            <span className="text-amber-700 text-xs font-semibold uppercase tracking-wide">🧪 Dev Mock Checkout</span>
          </div>
          <h1 className="text-lg font-bold text-[#1a1730] mt-2">Konnect Mock Payment</h1>
          <p className="text-sm text-[#9590b8]">
            This simulated checkout lets you test the full payment flow without a real Konnect account.
          </p>
        </div>

        {/* Payment ref */}
        <div className="bg-[#f7f7fe] rounded-xl px-4 py-3 text-left">
          <p className="text-xs text-[#9590b8] mb-0.5">Payment Reference</p>
          <p className="text-xs font-mono text-[#46426a] break-all">{paymentRef}</p>
        </div>

        {/* Feedback message */}
        {message && (
          <p className="text-sm font-medium text-[#46426a] bg-[#f7f7fe] rounded-lg px-3 py-2">
            {message}
          </p>
        )}

        {/* Action buttons */}
        {status !== 'done' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => confirm('success')}
              disabled={status === 'loading'}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Pay (Success)
            </button>

            <button
              onClick={() => confirm('fail')}
              disabled={status === 'loading'}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Decline (Fail)
            </button>
          </div>
        )}

        <p className="text-xs text-[#9590b8]">
          This page only appears when <code className="bg-[#f0eeff] px-1 rounded">KONNECT_MOCK_MODE=true</code>
        </p>
      </div>
    </div>
  );
}
