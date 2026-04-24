import { Suspense } from 'react';
import PaymentSuccessContent from './payment-success-content';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Status",
  description: "Payment confirmation and enrollment status.",
};

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full"></div></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
