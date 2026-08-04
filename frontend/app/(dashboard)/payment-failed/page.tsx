import { Suspense } from 'react';
import type { Metadata } from 'next';
import { noIndexRobots } from '@/lib/seo-config';
import PaymentFailedContent from './payment-failed-content';

export const metadata: Metadata = {
  title: 'Payment Not Completed',
  description: 'Your checkout was canceled or could not be completed. You can try again securely.',
  robots: noIndexRobots,
};

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-white">Loading...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
