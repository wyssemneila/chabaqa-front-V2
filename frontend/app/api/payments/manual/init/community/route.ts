import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Use API_INTERNAL_URL for server-side (Docker), NEXT_PUBLIC_API_URL for browser
const BACKEND_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const promoCode = searchParams.get('promoCode');

        // Parse FormData from the request
        const formData = await request.formData();

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

        // Build backend URL
        // Ensure BACKEND_URL doesn't have a trailing slash if we're going to append /payment...
        // But if BACKEND_URL is http://localhost:3000/api, we append /payment/manual/init/community
        const apiBaseUrl = BACKEND_URL.replace(/\/$/, '');

        let backendUrl = `${apiBaseUrl}/payment/manual/init/community`;
        if (promoCode) {
            backendUrl += `?promoCode=${encodeURIComponent(promoCode)}`;
        }

        console.log(`Forwarding manual payment request to: ${backendUrl}`);

        // Forward request to backend
        // We pass the formData directly. fetch in Node/Next.js environment should handle
        // the Content-Type boundary automatically when body is a FormData object.
        const backendResponse = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Authorization': token,
                // explicit Content-Type header is omitted to let fetch set the boundary
            },
            body: formData,
        });

        // Try to parse JSON response, but handle cases where it might be HTML (error)
        const contentType = backendResponse.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await backendResponse.json();
        } else {
            const text = await backendResponse.text();
            console.error('Backend returned non-JSON:', text);
            data = { message: `Backend returned status ${backendResponse.status}: ${text.substring(0, 100)}` };
        }

        if (!backendResponse.ok) {
            return NextResponse.json(
                { message: data?.message || 'Failed to initiate payment' },
                { status: backendResponse.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Manual payment init error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
