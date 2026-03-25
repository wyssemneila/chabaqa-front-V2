import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const communitySlug = searchParams.get('communitySlug');

        const authHeader = request.headers.get('Authorization');
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('accessToken') || cookieStore.get('token');
        const token = authHeader || (tokenCookie ? `Bearer ${tokenCookie.value}` : null);

        console.log('[Participations Route] Auth header:', authHeader ? 'present' : 'missing');
        console.log('[Participations Route] Cookie token:', tokenCookie ? 'present' : 'missing');
        console.log('[Participations Route] Final token:', token ? 'present' : 'missing');

        if (!token) {
            console.log('[Participations Route] No token, returning empty participations');
            return NextResponse.json({ participations: [] }, { status: 200 });
        }

        const apiBaseUrl = BACKEND_URL.replace(/\/$/, '');
        let backendUrl = `${apiBaseUrl}/challenges/user/my-participations`;
        if (communitySlug) backendUrl += `?communitySlug=${encodeURIComponent(communitySlug)}`;

        console.log('[Participations Route] Calling backend:', backendUrl);

        const backendResponse = await fetch(backendUrl, {
            method: 'GET',
            headers: { 
                'Authorization': token,
                'Content-Type': 'application/json',
            },
        });

        console.log('[Participations Route] Backend response status:', backendResponse.status);

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.log('[Participations Route] Backend error:', errorText);
            // Return empty participations on error (user not logged in, etc.)
            return NextResponse.json({ participations: [] }, { status: 200 });
        }

        const data = await backendResponse.json();
        console.log('[Participations Route] Success, participations count:', data?.participations?.length || 0);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Participations Route] Error:', error);
        return NextResponse.json({ participations: [] }, { status: 200 });
    }
}
