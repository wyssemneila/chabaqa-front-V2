'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { communitiesApi } from '@/lib/api/communities.api';
import { useToast } from '@/components/ui/use-toast';


interface VerificationResponse {
  success?: boolean;
  data?: {
    status: string;
    orderId?: string;
    contentTitle?: string;
    communitySlug?: string;
    creatorSlug?: string;
    targetId?: string;
    paymentMethod?: {
      type: string;
      card?: {
        brand: string;
        last4: string;
        exp_month: number;
        exp_year: number;
      };
      bank_account?: {
        bank_name: string;
        last4: string;
      };
    };
    customerId?: string;
    action?: string;
    message?: string;
    sessionContentId?: string;
  };
  // Fallback for flat structure
  status?: string;
  action?: string;
  message?: string;
  sessionContentId?: string;
  error?: string;
  paymentMethod?: any;
  contentTitle?: string;
  communitySlug?: string;
  creatorSlug?: string;
  targetId?: string;
}

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const redirectDone = useRef(false);
  const duplicateEventToastShown = useRef(false);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<VerificationResponse | null>(null);

  const sessionId = searchParams.get('sessionId');
  const scope = searchParams.get('scope');
  const id = searchParams.get('id');
  const chapterId = searchParams.get('chapterId') || id;
  const provider = searchParams.get('provider'); // Add provider check

  console.log('Payment Success Params:', searchParams.toString());
  console.log('Session ID:', sessionId);

  const isAlreadyRegisteredEventMessage = (value: unknown): boolean => {
    const message = String(value || '').toLowerCase();
    return message.includes('déjà inscrit') || message.includes('already registered');
  };

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        // Determine correct endpoint based on provider
        let verifyUrl = `/api/payments/verify?paymentId=${sessionId}`; // Default to Flouci
        if (provider === 'stripe' || provider === 'stripe-link') {
          verifyUrl = `/api/payments/verify?sessionId=${sessionId}`;
        }

        const shouldRetry = scope === 'chapter';
        const retryDelays = shouldRetry ? [0, 1000, 2000, 3000, 4000, 5000] : [0];
        let response: Response | null = null;
        let data: any = null;

        for (const delay of retryDelays) {
          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          const accessToken =
            (typeof window !== 'undefined' && (localStorage.getItem('accessToken') || localStorage.getItem('token'))) ||
            '';

          response = await fetch(verifyUrl, {
            method: 'GET',
            credentials: 'include',
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          });
          data = await response.json().catch(() => null);

          const payload = data?.data || data;
          const status = payload?.status;
          const isSuccess = data?.success === true || response.ok;
          if (!shouldRetry || (isSuccess && (status === 'paid' || status === 'complete' || status === 'succeeded'))) {
            break;
          }
        }

        setVerificationData(data);

        // Check both potential structures (active wrapper or direct response)
        const isSuccess = data?.success === true || Boolean(response?.ok);
        const payload = data.data || data;
        const status = payload?.status;
        const action = payload?.action;
        const errorMessage = payload?.message || data?.message || data?.error;
        const isEventAlreadyRegistered =
          scope === 'event' &&
          !isSuccess &&
          isAlreadyRegisteredEventMessage(errorMessage);

        if (isSuccess && (status === 'paid' || status === 'complete' || status === 'succeeded')) {
          setVerified(true);
        } else if (isEventAlreadyRegistered) {
          setVerified(true);
          if (!duplicateEventToastShown.current) {
            duplicateEventToastShown.current = true;
            toast({
              title: 'Already Registered',
              description: 'You can only register once per event (1 ticket per user).',
            });
          }
        } else if (isSuccess && status === 'paid_action_required' && action === 'choose_session_slot') {
          const orderId = payload?.orderId;
          const sessionTargetId = payload?.sessionContentId || payload?.targetId || id;
          const redirectUrl =
            payload?.creatorSlug && payload?.communitySlug && orderId
              ? `/${payload.creatorSlug}/${payload.communitySlug}/sessions?paymentAction=choose-slot&orderId=${encodeURIComponent(String(orderId))}&sessionId=${encodeURIComponent(String(sessionTargetId || ''))}`
              : `/dashboard?paymentAction=choose-slot&orderId=${encodeURIComponent(String(orderId || ''))}&sessionId=${encodeURIComponent(String(sessionTargetId || ''))}`;

          toast({
            title: 'Payment received',
            description: payload?.message || 'Please choose a date and time to finalize your booking.',
          });

          router.replace(redirectUrl);
          return;
        } else {
          if (scope === 'chapter') {
            setError(
              data?.error ||
                'Payment may be successful but unlock verification is still syncing. Please wait and retry.',
            );
          } else {
            setError(data?.error || 'Payment verification failed');
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Verification failed';
        setError(errorMessage);
        // Ensure verificationData is reset or null if verification fails significantly
        setVerificationData(null);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, provider, id, scope, router, toast]);

  // Helper to access data safely
  const paymentData = verificationData?.data || verificationData;
  const paymentMethod = paymentData?.paymentMethod;
  const contentTitle = paymentData?.contentTitle;
  const creatorSlug = paymentData?.creatorSlug;
  const communitySlug = paymentData?.communitySlug;
  const targetId = paymentData?.targetId || id;
  const eventQrHref =
    creatorSlug && communitySlug && targetId
      ? `/${creatorSlug}/${communitySlug}/events/qr?eventId=${encodeURIComponent(String(targetId))}`
      : null;

  // After successful payment, redirect straight to content (no success page)
  useEffect(() => {
    if (!verified || redirectDone.current) return;

    // Course Redirect
    if (scope === 'course' && creatorSlug && communitySlug && targetId) {
      redirectDone.current = true;
      router.replace(`/${creatorSlug}/${communitySlug}/courses/${targetId}`);
      return;
    }

    // Chapter Redirect (back to parent course page)
    if (scope === 'chapter' && creatorSlug && communitySlug) {
      redirectDone.current = true;
      const courseTargetId =
        searchParams.get('courseId') ||
        paymentData?.sessionContentId ||
        paymentData?.targetId;
      if (courseTargetId) {
        const nextParams = new URLSearchParams();
        if (chapterId) nextParams.set('paidChapterId', String(chapterId));
        nextParams.set('checkout', 'success');
        if (sessionId) nextParams.set('sessionId', String(sessionId));
        const query = nextParams.toString();
        router.replace(`/${creatorSlug}/${communitySlug}/courses/${courseTargetId}${query ? `?${query}` : ''}`);
        return;
      }
    }

    // Community Redirect: poll joined list until membership appears (to avoid race with webhook)
    if (scope === 'community' && creatorSlug && communitySlug) {
      redirectDone.current = true;
      (async () => {
        const timeoutMs = 20000; // 20 seconds
        const intervalMs = 1000;
        const started = Date.now();
        let joined = false;
        try {
          while (Date.now() - started < timeoutMs) {
            try {
              const res = await communitiesApi.getMyJoined();
              const joinedList = res?.data || [];
              if (Array.isArray(joinedList) && joinedList.some((c: any) => String(c.slug) === String(communitySlug))) {
                joined = true;
                break;
              }
            } catch (e) {
              // ignore and retry
            }
            await new Promise((r) => setTimeout(r, intervalMs));
          }
        } finally {
          if (joined) {
            router.replace(`/${creatorSlug}/${communitySlug}/home`);
          } else {
            // fallback: redirect and include joined flag so client refreshes
            router.replace(`/${creatorSlug}/${communitySlug}/home?joined=1`);
          }
        }
      })();
    }

    // Session Redirect
    if (scope === 'session' && creatorSlug && communitySlug) {
      redirectDone.current = true;
      router.replace(`/${creatorSlug}/${communitySlug}/sessions`);
      return;
    }

    // Event Redirect (QR)
    if (scope === 'event' && eventQrHref) {
      redirectDone.current = true;
      router.replace(eventQrHref);
      return;
    }
  }, [verified, scope, creatorSlug, communitySlug, targetId, router, searchParams, paymentData, chapterId, sessionId]);

  const isRedirecting = verified && (
    (scope === 'course' && creatorSlug && communitySlug && targetId) ||
    (scope === 'chapter' && creatorSlug && communitySlug) ||
    (scope === 'community' && creatorSlug && communitySlug) ||
    (scope === 'session' && creatorSlug && communitySlug) ||
    (scope === 'event' && eventQrHref)
  );

  const renderContentButton = () => {
    const baseClass = "block w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition text-center";

    // 1. Course
    if (scope === 'course' && creatorSlug && communitySlug && targetId) {
      return (
        <Link href={`/${creatorSlug}/${communitySlug}/courses/${targetId}`} className={baseClass}>
          Go to Course
        </Link>
      );
    }

    if (scope === 'chapter' && creatorSlug && communitySlug) {
      const courseTargetId =
        searchParams.get('courseId') ||
        paymentData?.sessionContentId ||
        paymentData?.targetId;
      if (courseTargetId) {
        const nextParams = new URLSearchParams();
        if (chapterId) nextParams.set('paidChapterId', String(chapterId));
        nextParams.set('checkout', 'success');
        if (sessionId) nextParams.set('sessionId', String(sessionId));
        const query = nextParams.toString();
        return (
          <Link href={`/${creatorSlug}/${communitySlug}/courses/${courseTargetId}${query ? `?${query}` : ''}`} className={baseClass}>
            Go to Course
          </Link>
        );
      }
    }

    // 2. Community
    if (scope === 'community' && creatorSlug && communitySlug) {
      return (
        <Link href={`/${creatorSlug}/${communitySlug}/home`} className={baseClass}>
          Go to Community
        </Link>
      );
    }

    // 3. Product
    if (scope === 'product' && creatorSlug && communitySlug && targetId) {
      return (
        <Link href={`/${creatorSlug}/${communitySlug}/products/${targetId}`} className={baseClass}>
          Go to Product
        </Link>
      );
    }

    // 4. Challenge
    if (scope === 'challenge' && creatorSlug && communitySlug && targetId) {
      return (
        <Link href={`/${creatorSlug}/${communitySlug}/challenges/${targetId}`} className={baseClass}>
          Go to Challenge
        </Link>
      );
    }

    // 5. Event
    if (scope === 'event' && eventQrHref) {
      return (
        <Link href={eventQrHref} className={baseClass}>
          View Ticket QR
        </Link>
      );
    }

    // 6. Session
    if (scope === 'session') {
      if (creatorSlug && communitySlug) {
        return (
          <Link href={`/${creatorSlug}/${communitySlug}/sessions`} className={baseClass}>
            View My Bookings
          </Link>
        );
      }

      return (
        <Link href="/dashboard" className={baseClass}>
          View My Bookings
        </Link>
      );
    }

    // 7. Subscription
    if (scope === 'subscription') {
      return (
        <Link href="/dashboard" className={baseClass}>
          Go to Dashboard
        </Link>
      );
    }

    // Fallback if metadata missing but we have ID for course (assuming legacy path if any) or just dashboard
    return null;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-md w-full px-6">
          {loading ? (
            <div className="text-center">
              <div className="animate-spin inline-block w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full mb-4"></div>
              <p className="text-gray-600 font-semibold">Verifying payment...</p>
              <p className="text-sm text-gray-500 mt-2">Session ID: {sessionId}</p>
            </div>
          ) : isRedirecting ? (
            <div className="text-center">
              <div className="animate-spin inline-block w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full mb-4"></div>
              <p className="text-gray-600 font-semibold">Payment successful. Redirecting...</p>
            </div>
          ) : verified ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Granted!</h1>
              <p className="text-gray-600 mb-6">
                Your payment was successful and your access has been enabled.
                {contentTitle && <span className="block mt-1 font-semibold text-blue-900">{contentTitle}</span>}
              </p>


              {paymentMethod && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Type:</span>{' '}
                      <span className="font-medium">
                        {paymentMethod.type}
                      </span>
                    </p>
                    {paymentMethod.card && (
                      <>
                        <p>
                          <span className="text-gray-600">Card:</span>{' '}
                          <span className="font-medium">
                            {paymentMethod.card.brand.toUpperCase()} •••• •••• •••• {paymentMethod.card.last4}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-600">Expires:</span>{' '}
                          <span className="font-medium">
                            {paymentMethod.card.exp_month}/
                            {paymentMethod.card.exp_year}
                          </span>
                        </p>
                      </>
                    )}
                    {paymentMethod.bank_account && (
                      <>
                        <p>
                          <span className="text-gray-600">Bank:</span>{' '}
                          <span className="font-medium">
                            {paymentMethod.bank_account.bank_name}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-600">Account:</span>{' '}
                          <span className="font-medium">
                            •••• {paymentMethod.bank_account.last4}
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* {verificationData && (
                <details className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-left text-xs">
                  <summary className="cursor-pointer font-semibold text-blue-900 mb-3">
                    API Response
                  </summary>
                  <pre className="bg-gray-800 text-green-400 p-2 rounded overflow-auto">
                    {JSON.stringify(verificationData, null, 2)}
                  </pre>
                </details>
              )} */}

              <div className="space-y-3">
                {renderContentButton()}
                <Link
                  href="/dashboard"
                  className="block w-full bg-gray-100 text-gray-900 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
              <p className="text-gray-600 mb-2">
                {typeof error === 'string' ? error : 'Payment could not be verified'}
              </p>
              <p className="text-sm text-gray-500 mb-6">Session ID: {sessionId}</p>

              {/* {verificationData && (
                <details className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-left text-xs">
                  <summary className="cursor-pointer font-semibold text-red-900 mb-3">
                    Error Details
                  </summary>
                  <pre className="bg-gray-800 text-red-400 p-2 rounded overflow-auto">
                    {JSON.stringify(verificationData, null, 2)}
                  </pre>
                </details>
              )} */}

              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="block w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </main >

      <Footer />
    </div >
  );
}
