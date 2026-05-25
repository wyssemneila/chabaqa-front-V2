'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { communitiesApi } from '@/lib/api/communities.api';
import { useToast } from '@/components/ui/use-toast';
import { toPaymentViewModel } from '@/lib/view-models/payment-view-model';
import { CheckCircle2, Clock3, Loader2, ShieldCheck, XCircle } from 'lucide-react';


interface VerificationResponse {
  success?: boolean;
  data?: {
    status: string;
    orderId?: string;
    contentTitle?: string;
    communitySlug?: string;
    creatorSlug?: string;
    targetId?: string;
    courseId?: string;
    chapterId?: string;
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
  courseId?: string;
  chapterId?: string;
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
  const [journeyStage, setJourneyStage] = useState<'verifying' | 'syncing' | 'ready' | 'failed'>('verifying');

  const sessionId = searchParams.get('sessionId');
  const scope = searchParams.get('scope');
  const id = searchParams.get('id');
  const chapterId = searchParams.get('chapterId') || id;
  const provider = searchParams.get('provider');
  const paymentRef = searchParams.get('paymentRef');

  console.log('Payment Success Params:', searchParams.toString());
  console.log('Session ID:', sessionId);

  const isAlreadyRegisteredEventMessage = (value: unknown): boolean => {
    const message = String(value || '').toLowerCase();
    return message.includes('déjà inscrit') || message.includes('already registered');
  };

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId && !paymentRef) {
        setError('No payment identifier provided');
        setJourneyStage('failed');
        setLoading(false);
        return;
      }

      try {
        // Determine correct endpoint based on provider
        let verifyUrl = `/api/payments/verify?paymentId=${sessionId}`; // Default to Flouci
        if (provider === 'konnect' && paymentRef) {
          verifyUrl = `/api/payments/verify?paymentRef=${paymentRef}`;
        } else if (provider === 'stripe' || provider === 'stripe-link') {
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
        const normalizedPayment = toPaymentViewModel(data);

        // Check both potential structures (active wrapper or direct response)
        const isSuccess = normalizedPayment.success || Boolean(response?.ok);
        const payload = normalizedPayment;
        const status = payload?.status;
        const action = payload?.action;
        const errorMessage = payload?.message || data?.message || data?.error;
        const isEventAlreadyRegistered =
          scope === 'event' &&
          !isSuccess &&
          isAlreadyRegisteredEventMessage(errorMessage);

        if (isSuccess && status === 'paid') {
          setJourneyStage('ready');
          setVerified(true);
        } else if (isEventAlreadyRegistered) {
          setJourneyStage('ready');
          setVerified(true);
          if (!duplicateEventToastShown.current) {
            duplicateEventToastShown.current = true;
            toast({
              title: 'Already Registered',
              description: 'You can only register once per event (1 ticket per user).',
            });
          }
        } else if (isSuccess && status === 'requires_action' && (action === 'choose_session_slot' || payload.actionRequired === 'choose_session_slot')) {
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
          setJourneyStage('failed');
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
        setJourneyStage('failed');
        // Ensure verificationData is reset or null if verification fails significantly
        setVerificationData(null);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, paymentRef, provider, id, scope, router, toast]);

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

  // After successful payment, briefly show a stable success state before moving users onward.
  useEffect(() => {
    if (!verified || redirectDone.current) return;

    const redirectTimer = window.setTimeout(() => {
      setJourneyStage('syncing');

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
          paymentData?.courseId ||
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
          const timeoutMs = 20000;
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
              router.replace(`/${creatorSlug}/${communitySlug}/home?joined=1`);
            }
          }
        })();
        return;
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
      }
    }, 1800);

    return () => window.clearTimeout(redirectTimer);
  }, [verified, scope, creatorSlug, communitySlug, targetId, router, searchParams, paymentData, chapterId, sessionId]);

  const isRedirecting = verified && (
    (scope === 'course' && creatorSlug && communitySlug && targetId) ||
    (scope === 'chapter' && creatorSlug && communitySlug) ||
    (scope === 'community' && creatorSlug && communitySlug) ||
    (scope === 'session' && creatorSlug && communitySlug) ||
    (scope === 'event' && eventQrHref)
  );

  const renderContentButton = () => {
    const baseClass = "block w-full rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700";

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

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_70px_-42px_rgba(15,23,42,0.45)]">
          {loading ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <p className="font-semibold text-gray-900">Verifying payment</p>
              <p className="mt-2 text-sm text-gray-500">Confirming the payment before enabling access.</p>
            </div>
          ) : isRedirecting ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                {journeyStage === 'syncing' ? <Clock3 className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
              </div>
              <p className="font-semibold text-gray-900">Access ready</p>
              <p className="mt-2 text-sm text-gray-500">Your payment is confirmed. We are opening the right page now.</p>
            </div>
          ) : verified ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                <ShieldCheck className="h-8 w-8" />
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
                  className="block w-full rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-900 transition hover:bg-gray-200"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <XCircle className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
              <p className="text-gray-600 mb-2">
                {typeof error === 'string' ? error : 'Payment could not be verified'}
              </p>
              {(sessionId || paymentRef) && (
                <details className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-3 text-left text-xs text-gray-500">
                  <summary className="cursor-pointer font-semibold text-gray-700">Support reference</summary>
                  <p className="mt-2 font-mono break-all">{sessionId || paymentRef}</p>
                </details>
              )}

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
                  className="block w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
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
