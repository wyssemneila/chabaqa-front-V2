import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Use API_INTERNAL_URL for server-side (Docker), NEXT_PUBLIC_API_URL for browser
const BACKEND_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from headers or cookies
    const authHeader = request.headers.get('authorization');
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('accessToken') || cookieStore.get('token');
    const token = authHeader || (tokenCookie ? `Bearer ${tokenCookie.value}` : null);
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string;
    const slotId = formData.get('slotId') as string;
    const proofFile = formData.get('proof') as File;
    const notes = formData.get('notes') as string;
    
    console.log('[Session Payment Route] sessionId:', sessionId);
    console.log('[Session Payment Route] slotId:', slotId);
    console.log('[Session Payment Route] has proof:', !!proofFile);

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!proofFile) {
      return NextResponse.json(
        { success: false, error: 'Payment proof file is required' },
        { status: 400 }
      );
    }

    // Get promo code from query params
    const url = new URL(request.url);
    const promoCode = url.searchParams.get('promoCode');

    // Create form data for backend - backend expects 'sessionId' not 'contentId'
    const backendFormData = new FormData();
    backendFormData.append('sessionId', sessionId);
    backendFormData.append('proof', proofFile);
    if (slotId) {
      backendFormData.append('slotId', slotId);
    }
    if (notes) {
      backendFormData.append('notes', notes);
    }

    // Use internal URL for server-side requests (Docker networking)
    const apiBaseUrl = BACKEND_URL.replace(/\/$/, '');
    let backendUrl = `${apiBaseUrl}/payment/manual/init/session`;
    if (promoCode) {
      backendUrl += `?promoCode=${encodeURIComponent(promoCode)}`;
    }
    
    console.log('[Session Payment Route] Calling backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': token,
      },
      body: backendFormData,
    });

    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.log('[Session Payment Route] Backend text response:', text);
      data = { message: `Backend error: ${text.substring(0, 200)}` };
    }

    console.log('[Session Payment Route] Backend response:', response.status, data);

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.message || data.error || 'Payment submission failed' 
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Payment proof submitted successfully. Please wait for verification.',
      data: data.data || data
    });

  } catch (error: any) {
    console.error('[Session Payment Route] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
