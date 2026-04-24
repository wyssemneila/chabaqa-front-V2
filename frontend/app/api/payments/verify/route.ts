import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to verify payment status
 * Gets called after user returns from Stripe / Flouci / Konnect checkout
 */
export async function GET(req: NextRequest) {
  const noCacheHeaders = { 'Cache-Control': 'private, no-cache' };
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    const paymentId = req.nextUrl.searchParams.get('paymentId');
    const paymentRef = req.nextUrl.searchParams.get('paymentRef');
    const authHeader = req.headers.get('authorization');
    const incomingCookies = req.headers.get('cookie') || '';

    if (!sessionId && !paymentId && !paymentRef) {
      return NextResponse.json(
        { message: 'sessionId, paymentId, or paymentRef query parameter is required' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const cookieToken =
      req.cookies.get('accessToken')?.value ||
      req.cookies.get('token')?.value ||
      req.cookies.get('jwt')?.value ||
      req.cookies.get('authToken')?.value;

    const forwardedAuthHeader =
      authHeader || (cookieToken ? `Bearer ${cookieToken}` : '');

    // Get the backend API URL (must include /api because Nest uses global prefix)
    const backendUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    // Ensure URL is absolute for server-side fetch
    const finalBackendUrl = backendUrl.startsWith('http') 
      ? backendUrl 
      : `http://localhost:3000${backendUrl}`;

    let verifyPath: string;
    let providerLabel: string;

    if (paymentRef) {
      // Konnect payment verification
      verifyPath = `/payment/konnect/verify?paymentRef=${encodeURIComponent(paymentRef)}`;
      providerLabel = 'konnect';
    } else if (sessionId) {
      // Stripe session verification
      verifyPath = `/payment/stripe-link/verify?sessionId=${encodeURIComponent(sessionId)}`;
      providerLabel = 'stripe session';
    } else {
      // Flouci payment verification
      verifyPath = `/payment/verify?paymentId=${encodeURIComponent(paymentId as string)}`;
      providerLabel = 'flouci payment';
    }

    console.log(`[Payment Verify] Verifying ${providerLabel} at ${finalBackendUrl}${verifyPath}`);

    // Call the backend verification endpoint
    const response = await fetch(
      `${finalBackendUrl}${verifyPath}`,
      {
        method: 'GET',
        headers: {
          ...(forwardedAuthHeader ? { 'Authorization': forwardedAuthHeader } : {}),
          ...(incomingCookies ? { 'Cookie': incomingCookies } : {}),
        },
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status, headers: noCacheHeaders });
  } catch (error) {
    console.error('Payment verification error:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to verify payment';

    return NextResponse.json(
      { message: errorMessage, status: 'error' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
