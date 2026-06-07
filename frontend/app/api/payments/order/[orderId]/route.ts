import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  const noCacheHeaders = { 'Cache-Control': 'private, no-cache' };

  try {
    const params = await context.params;
    const orderId = params.orderId;

    if (!orderId) {
      return NextResponse.json(
        { success: false, status: 'failed', message: 'orderId is required' },
        { status: 400, headers: noCacheHeaders },
      );
    }

    const authHeader = req.headers.get('authorization');
    const incomingCookies = req.headers.get('cookie') || '';
    const cookieToken =
      req.cookies.get('accessToken')?.value ||
      req.cookies.get('token')?.value ||
      req.cookies.get('jwt')?.value ||
      req.cookies.get('authToken')?.value;

    const forwardedAuthHeader = authHeader || (cookieToken ? `Bearer ${cookieToken}` : '');
    const backendUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const finalBackendUrl = backendUrl.startsWith('http') ? backendUrl : `http://localhost:3000${backendUrl}`;

    const response = await fetch(`${finalBackendUrl}/payment/order/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        ...(forwardedAuthHeader ? { Authorization: forwardedAuthHeader } : {}),
        ...(incomingCookies ? { Cookie: incomingCookies } : {}),
      },
    });

    const data = await response.json().catch(() => ({ success: false, status: 'failed', message: 'Invalid backend response' }));
    return NextResponse.json(data, { status: response.status, headers: noCacheHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load order status';
    return NextResponse.json(
      { success: false, status: 'failed', message },
      { status: 500, headers: noCacheHeaders },
    );
  }
}
