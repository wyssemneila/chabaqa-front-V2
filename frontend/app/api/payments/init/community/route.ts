import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const promoCode = searchParams.get('promoCode');

        const body = await request.json();
        const communityId =
            typeof body?.communityId === 'string' ? body.communityId.trim() : '';
        const inviteCode =
            typeof body?.inviteCode === 'string' ? body.inviteCode.trim() : '';

        if (!communityId) {
            return NextResponse.json(
                { message: 'Community ID is required' },
                { status: 400 }
            );
        }

        // Get auth token from header or cookies
        const authHeader = request.headers.get('Authorization');
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('accessToken') || cookieStore.get('token');

        const token = authHeader || (tokenCookie ? `Bearer ${tokenCookie.value}` : null);

        if (!token) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Build backend URL with promo code if provided
        const backendUrl = promoCode
            ? `${BACKEND_URL}/payment/init/community?promoCode=${encodeURIComponent(promoCode)}`
            : `${BACKEND_URL}/payment/init/community`;

        // Forward request to backend
        const backendResponse = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                communityId,
                ...(inviteCode ? { inviteCode } : {}),
            }),
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            return NextResponse.json(
                { message: data?.message || 'Failed to initiate payment' },
                { status: backendResponse.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Payment init error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
