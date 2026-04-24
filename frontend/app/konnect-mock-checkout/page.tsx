import { Suspense } from 'react';
import KonnectMockCheckoutContent from './konnect-mock-checkout-content';

export default function KonnectMockCheckoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <KonnectMockCheckoutContent />
    </Suspense>
  );
}
