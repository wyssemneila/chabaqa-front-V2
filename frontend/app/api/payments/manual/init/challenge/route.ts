import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Use API_INTERNAL_URL for server-side (Docker), NEXT_PUBLIC_API_URL for browser
const BACKEND_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const promoCode = searchParams.get('promoCode');
        const formData = await request.formData();

        // Log what we received
        console.log('[Challenge Payment Route] challengeId:', formData.get('challengeId'));
        console.log('[Challenge Payment Route] has proof:', formData.has('proof'));

        const authHeader = request.headers.get('Authorization');
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('accessToken') || cookieStore.get('token');
        const token = authHeader || (tokenCookie ? `Bearer ${tokenCookie.value}` : null);

        if (!token) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        const apiBaseUrl = BACKEND_URL.replace(/\/$/, '');
        let backendUrl = `${apiBaseUrl}/payment/manual/init/challenge`;
        if (promoCode) backendUrl += `?promoCode=${encodeURIComponent(promoCode)}`;

        console.log('[Challenge Payment Route] Calling backend:', backendUrl);

        const backendResponse = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Authorization': token },
            body: formData,
        });

        const contentType = backendResponse.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await backendResponse.json();
        } else {
            const text = await backendResponse.text();
            console.log('[Challenge Payment Route] Backend text response:', text);
            data = { message: `Backend error: ${text.substring(0, 200)}` };
        }

        console.log('[Challenge Payment Route] Backend response:', backendResponse.status, data);

        if (!backendResponse.ok) {
            return NextResponse.json({ 
                message: data?.message || 'Failed', 
                error: data 
            }, { status: backendResponse.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Challenge Payment Route] Error:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
}
