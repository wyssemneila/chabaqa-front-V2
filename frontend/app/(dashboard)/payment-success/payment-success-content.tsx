'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Clock3, Loader2, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { communitiesApi } from '@/lib/api/communities.api';
import { useToast } from '@/components/ui/use-toast';
import { toPaymentViewModel, type PaymentStatus } from '@/lib/view-models/payment-view-model';

interface VerificationResponse {
  success?: boolean;
  data?: Record<string, any>;
  status?: string;
  action?: string;
  message?: string;
  error?: string;
  [key: string]: any;
}

type JourneyStage = 'verifying' | 'pending' | 'syncing' | 'ready' | 'failed' | 'cancelled';

const TERMINAL_SUCCESS = new Set<PaymentStatus>(['paid', 'requires_action']);
const TERMINAL_FAILURE = new Set<PaymentStatus>(['failed', 'cancelled']);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const [journeyStage, setJourneyStage] = useState<JourneyStage>('verifying');

  const sessionId = searchParams.get('sessionId');
  const paymentRef = searchParams.get('paymentRef');
  const paymentId = searchParams.get('paymentId');
  const orderIdParam = searchParams.get('orderId');
  const scope = searchParams.get('scope');
  const id = searchParams.get('id');
  const chapterId = searchParams.get('chapterId') || id;
  const provider = searchParams.get('provider');

  const isAlreadyRegisteredEventMessage = (value: unknown): boolean => {
    const message = String(value || '').toLowerCase();
    return message.includes('already registered') || message.includes('already purchased') || message.includes('already enrolled');
  };

  const buildVerifyUrl = useCallback(() => {
    if (orderIdParam && (!sessionId && !paymentRef && !paymentId)) {
      return `/api/payments/order/${encodeURIComponent(orderIdParam)}`;
    }
    if (provider === 'konnect' && paymentRef) {
      return `/api/payments/verify?paymentRef=${encodeURIComponent(paymentRef)}`;
    }
    if ((provider === 'stripe' || provider === 'stripe-link') && sessionId) {
      return `/api/payments/verify?sessionId=${encodeURIComponent(sessionId)}`;
    }
    if (sessionId) {
      return `/api/payments/verify?sessionId=${encodeURIComponent(sessionId)}`;
    }
    if (paymentRef) {
      return `/api/payments/verify?paymentRef=${encodeURIComponent(paymentRef)}`;
    }
    if (paymentId) {
      return `/api/payments/verify?paymentId=${encodeURIComponent(paymentId)}`;
    }
    return null;
  }, [orderIdParam, paymentId, paymentRef, provider, sessionId]);

  useEffect(() => {
    let cancelled = false;

    const verifyPayment = async () => {
      const verifyUrl = buildVerifyUrl();
      if (!verifyUrl) {
        setError('No payment identifier provided. If you completed payment, contact support with your checkout email.');
        setJourneyStage('failed');
        setLoading(false);
        return;
      }

      const retryDelays = [0, 1000, 2000, 3000, 5000, 8000];
      let lastData: any = null;
      let lastResponseOk = false;

      try {
        for (const delay of retryDelays) {
          if (delay > 0) await sleep(delay);
          if (cancelled) return;

          const accessToken =
            typeof window !== 'undefined'
              ? localStorage.getItem('accessToken') || localStorage.getItem('token') || ''
              : '';

          const response = await fetch(verifyUrl, {
            method: 'GET',
            credentials: 'include',
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          });

          lastResponseOk = response.ok;
          lastData = await response.json().catch(() => null);
          const normalized = toPaymentViewModel(lastData);

          setVerificationData(lastData);

          if (TERMINAL_SUCCESS.has(normalized.status) || TERMINAL_FAILURE.has(normalized.status)) {
            break;
          }

          setJourneyStage('pending');
        }

        if (cancelled) return;

        const normalizedPayment = toPaymentViewModel(lastData);
        const status = normalizedPayment.status;
        const action = normalizedPayment.actionRequired || normalizedPayment.action;
        const errorMessage = normalizedPayment.message || lastData?.message || lastData?.error;
        const isEventAlreadyRegistered =
          scope === 'event' && !normalizedPayment.success && isAlreadyRegisteredEventMessage(errorMessage);

        if (normalizedPayment.success && status === 'paid') {
          setJourneyStage('ready');
          setVerified(true);
          return;
        }

        if (isEventAlreadyRegistered) {
          setJourneyStage('ready');
          setVerified(true);
          if (!duplicateEventToastShown.current) {
            duplicateEventToastShown.current = true;
            toast({
              title: 'Already registered',
              description: 'You already have access to this item. Opening it now.',
            });
          }
          return;
        }

        if (normalizedPayment.success && status === 'requires_action' && action === 'choose_session_slot') {
          const orderId = normalizedPayment.orderId;
          const sessionContentId = normalizedPayment.sessionContentId || normalizedPayment.targetId || id;
          const redirectUrl =
            normalizedPayment.creatorSlug && normalizedPayment.communitySlug && orderId
              ? `/${normalizedPayment.creatorSlug}/${normalizedPayment.communitySlug}/sessions?paymentAction=choose-slot&orderId=${encodeURIComponent(String(orderId))}&sessionId=${encodeURIComponent(String(sessionContentId || ''))}`
              : `/dashboard?paymentAction=choose-slot&orderId=${encodeURIComponent(String(orderId || ''))}&sessionId=${encodeURIComponent(String(sessionContentId || ''))}`;

          toast({
            title: 'Payment received',
            description: normalizedPayment.message || 'Please choose a date and time to finalize your booking.',
          });

          router.replace(redirectUrl);
          return;
        }

        if (status === 'pending') {
          setJourneyStage('pending');
          setError(
            normalizedPayment.message ||
              (normalizedPayment.provider === 'manual'
                ? 'Your manual payment proof is pending creator review.'
                : 'Payment is still pending. This can happen while the payment provider sends the webhook.'),
          );
          return;
        }

        if (status === 'cancelled') {
          setJourneyStage('cancelled');
          setError('Checkout was canceled. No charge was confirmed.');
          return;
        }

        setJourneyStage('failed');
        setError(errorMessage || (lastResponseOk ? 'Payment could not be verified.' : 'Payment verification failed.'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Verification failed';
        setError(message);
        setJourneyStage('failed');
        setVerificationData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [buildVerifyUrl, id, router, scope, toast]);

  const paymentData = useMemo(() => verificationData?.data || verificationData || {}, [verificationData]);
  const normalizedPayment = useMemo(() => toPaymentViewModel(verificationData), [verificationData]);
  const paymentMethod = paymentData?.paymentMethod;
  const contentTitle = paymentData?.contentTitle;
  const creatorSlug = paymentData?.creatorSlug;
  const communitySlug = paymentData?.communitySlug;
  const targetId = paymentData?.targetId || id;
  const eventQrHref =
    creatorSlug && communitySlug && targetId
      ? `/${creatorSlug}/${communitySlug}/events/qr?eventId=${encodeURIComponent(String(targetId))}`
      : null;

  useEffect(() => {
    if (!verified || redirectDone.current) return;

    const redirectTimer = window.setTimeout(() => {
      setJourneyStage('syncing');

      if (scope === 'course' && creatorSlug && communitySlug && targetId) {
        redirectDone.current = true;
        router.replace(`/${creatorSlug}/${communitySlug}/courses/${targetId}`);
        return;
      }

      if (scope === 'chapter' && creatorSlug && communitySlug) {
        redirectDone.current = true;
        const courseTargetId = searchParams.get('courseId') || paymentData?.courseId || paymentData?.sessionContentId || paymentData?.targetId;
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
              } catch {
                // retry until timeout
              }
              await sleep(intervalMs);
            }
          } finally {
            router.replace(`/${creatorSlug}/${communitySlug}/home${joined ? '' : '?joined=1'}`);
          }
        })();
        return;
      }

      if (scope === 'session' && creatorSlug && communitySlug) {
        redirectDone.current = true;
        router.replace(`/${creatorSlug}/${communitySlug}/sessions`);
        return;
      }

      if (scope === 'event' && eventQrHref) {
        redirectDone.current = true;
        router.replace(eventQrHref);
        return;
      }

      if (scope === 'subscription') {
        redirectDone.current = true;
        router.replace('/creator/billing?checkout=success');
      }
    }, 1800);

    return () => window.clearTimeout(redirectTimer);
  }, [chapterId, communitySlug, creatorSlug, eventQrHref, paymentData, router, scope, searchParams, sessionId, targetId, verified]);

  const isRedirecting = verified && (
    (scope === 'course' && creatorSlug && communitySlug && targetId) ||
    (scope === 'chapter' && creatorSlug && communitySlug) ||
    (scope === 'community' && creatorSlug && communitySlug) ||
    (scope === 'session' && creatorSlug && communitySlug) ||
    (scope === 'event' && eventQrHref) ||
    scope === 'subscription'
  );

  const renderContentButton = () => {
    const baseClass = 'block w-full rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700';

    if (scope === 'course' && creatorSlug && communitySlug && targetId) {
      return <Link href={`/${creatorSlug}/${communitySlug}/courses/${targetId}`} className={baseClass}>Go to Course</Link>;
    }

    if (scope === 'chapter' && creatorSlug && communitySlug) {
      const courseTargetId = searchParams.get('courseId') || paymentData?.courseId || paymentData?.sessionContentId || paymentData?.targetId;
      if (courseTargetId) {
        const nextParams = new URLSearchParams();
        if (chapterId) nextParams.set('paidChapterId', String(chapterId));
        nextParams.set('checkout', 'success');
        if (sessionId) nextParams.set('sessionId', String(sessionId));
        const query = nextParams.toString();
        return <Link href={`/${creatorSlug}/${communitySlug}/courses/${courseTargetId}${query ? `?${query}` : ''}`} className={baseClass}>Go to Course</Link>;
      }
    }

    if (scope === 'community' && creatorSlug && communitySlug) {
      return <Link href={`/${creatorSlug}/${communitySlug}/home`} className={baseClass}>Go to Community</Link>;
    }

    if (scope === 'product' && creatorSlug && communitySlug && targetId) {
      return <Link href={`/${creatorSlug}/${communitySlug}/products/${targetId}`} className={baseClass}>Go to Product</Link>;
    }

    if (scope === 'challenge' && creatorSlug && communitySlug && targetId) {
      return <Link href={`/${creatorSlug}/${communitySlug}/challenges/${targetId}`} className={baseClass}>Go to Challenge</Link>;
    }

    if (scope === 'event' && eventQrHref) {
      return <Link href={eventQrHref} className={baseClass}>View Ticket QR</Link>;
    }

    if (scope === 'session') {
      return <Link href={creatorSlug && communitySlug ? `/${creatorSlug}/${communitySlug}/sessions` : '/dashboard'} className={baseClass}>View My Bookings</Link>;
    }

    if (scope === 'subscription') {
      return <Link href="/creator/billing" className={baseClass}>View Account Billing</Link>;
    }

    return null;
  };

  const supportReference = sessionId || paymentRef || paymentId || orderIdParam || normalizedPayment.orderId;
  const pending = journeyStage === 'pending';
  const failed = journeyStage === 'failed' || journeyStage === 'cancelled';

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_70px_-42px_rgba(15,23,42,0.45)]">
          {loading ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <p className="font-semibold text-gray-900">Verifying payment</p>
              <p className="mt-2 text-sm text-gray-500">Confirming checkout and waiting for provider reconciliation.</p>
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
              <h1 className="mb-2 text-2xl font-bold text-gray-900">Access Granted!</h1>
              <p className="mb-6 text-gray-600">
                Your payment was successful and your access has been enabled.
                {contentTitle && <span className="mt-1 block font-semibold text-blue-900">{contentTitle}</span>}
              </p>

              {paymentMethod && (
                <div className="mb-6 rounded-lg bg-gray-50 p-4 text-left">
                  <h3 className="mb-3 font-semibold text-gray-900">Payment Method</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Type:</span> <span className="font-medium">{paymentMethod.type}</span></p>
                    {paymentMethod.card && (
                      <>
                        <p><span className="text-gray-600">Card:</span> <span className="font-medium">{paymentMethod.card.brand?.toUpperCase()} •••• {paymentMethod.card.last4}</span></p>
                        <p><span className="text-gray-600">Expires:</span> <span className="font-medium">{paymentMethod.card.exp_month}/{paymentMethod.card.exp_year}</span></p>
                      </>
                    )}
                    {paymentMethod.bank_account && (
                      <>
                        <p><span className="text-gray-600">Bank:</span> <span className="font-medium">{paymentMethod.bank_account.bank_name}</span></p>
                        <p><span className="text-gray-600">Account:</span> <span className="font-medium">•••• {paymentMethod.bank_account.last4}</span></p>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {renderContentButton()}
                <Link href={scope === 'subscription' ? '/creator/billing' : '/dashboard'} className="block w-full rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-900 transition hover:bg-gray-200">
                  {scope === 'subscription' ? 'Back to Billing' : 'Back to Dashboard'}
                </Link>
              </div>
            </div>
          ) : pending ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Clock3 className="h-8 w-8" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">Payment Pending</h1>
              <p className="mb-4 text-gray-600">{error || 'We are still waiting for final confirmation.'}</p>
              <p className="mb-6 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                Keep this page reference. Access will unlock automatically after the provider webhook or manual review is completed.
              </p>
              <div className="space-y-3">
                <button onClick={() => window.location.reload()} className="block w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700">Check Again</button>
                <Link href="/dashboard" className="block w-full rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-900 transition hover:bg-gray-200">Back to Dashboard</Link>
              </div>
            </div>
          ) : failed ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                {journeyStage === 'cancelled' ? <AlertTriangle className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">{journeyStage === 'cancelled' ? 'Checkout Canceled' : 'Payment Not Confirmed'}</h1>
              <p className="mb-2 text-gray-600">{error || 'Payment could not be verified.'}</p>
              {supportReference && (
                <details className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-3 text-left text-xs text-gray-500">
                  <summary className="cursor-pointer font-semibold text-gray-700">Support reference</summary>
                  <p className="mt-2 break-all font-mono">{supportReference}</p>
                </details>
              )}
              <div className="space-y-3">
                <button onClick={() => window.location.reload()} className="block w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700">Retry Verification</button>
                <Link href="/dashboard" className="block w-full rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-900 transition hover:bg-gray-200">Back to Dashboard</Link>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
