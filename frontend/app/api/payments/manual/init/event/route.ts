import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Use API_INTERNAL_URL for server-side (Docker), NEXT_PUBLIC_API_URL for browser
const BACKEND_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const promoCode = searchParams.get('promoCode');
        const formData = await request.formData();

        const authHeader = request.headers.get('Authorization');
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('accessToken') || cookieStore.get('token');
        const token = authHeader || (tokenCookie ? `Bearer ${tokenCookie.value}` : null);

        if (!token) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        const apiBaseUrl = BACKEND_URL.replace(/\/$/, '');
        let backendUrl = `${apiBaseUrl}/payment/manual/init/event`;
        if (promoCode) backendUrl += `?promoCode=${encodeURIComponent(promoCode)}`;

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
            data = { message: `Backend error: ${text.substring(0, 100)}` };
        }

        if (!backendResponse.ok) {
            return NextResponse.json({ message: data?.message || 'Failed' }, { status: backendResponse.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Manual payment init error:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
}
