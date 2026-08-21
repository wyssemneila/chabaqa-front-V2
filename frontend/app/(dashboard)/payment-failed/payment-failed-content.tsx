'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { buildPaymentRetryHref } from '@/lib/payment-retry';

const scopeLabels: Record<string, string> = {
  community: 'community access',
  course: 'course enrollment',
  chapter: 'chapter access',
  challenge: 'challenge registration',
  event: 'event ticket',
  product: 'product purchase',
  session: 'session booking',
  subscription: 'creator plan',
};

export default function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const scope = searchParams.get('scope');
  const id = searchParams.get('id');
  const tier = searchParams.get('tier');
  const provider = searchParams.get('provider') || 'payment provider';
  const courseId = searchParams.get('courseId');
  const label = scopeLabels[String(scope || '')] || 'checkout';
  const backHref = buildPaymentRetryHref(scope, id, courseId, tier);
  const reference = id || tier || courseId;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-[0_20px_70px_-42px_rgba(15,23,42,0.45)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <XCircle className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Checkout not completed</h1>
          <p className="mt-3 text-gray-600">
            Your {label} was not confirmed by {provider}. No access was changed unless your provider later confirms the payment.
          </p>

          <div className="mt-6 rounded-xl bg-amber-50 p-4 text-left text-sm text-amber-900">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              What to do next
            </div>
            <p>Try Stripe checkout again, or return safely without changing access.</p>
            {reference && (
              <p className="mt-3 break-all font-mono text-xs text-amber-800">Reference: {reference}</p>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href={backHref}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Link>
            <Link
              href="/dashboard"
              className="block w-full rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-900 transition hover:bg-gray-200"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
