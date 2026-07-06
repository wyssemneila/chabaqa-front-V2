import { Suspense } from 'react';
import type { Metadata } from 'next';
import { noIndexRobots } from '@/lib/seo-config';
import PaymentFailedContent from './payment-failed-content';

export const metadata: Metadata = {
  title: 'Payment Failed',
  description: 'Checkout failed or was canceled.',
  robots: noIndexRobots,
};

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-white">Loading...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
