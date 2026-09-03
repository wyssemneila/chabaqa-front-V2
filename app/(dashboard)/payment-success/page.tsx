import { Suspense } from 'react';
import PaymentSuccessContent from './payment-success-content';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Status",
  description: "Payment confirmation and enrollment status.",
};

export default function PaymentSuccess() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
