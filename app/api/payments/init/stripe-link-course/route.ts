import { NextRequest, NextResponse } from 'next/server';

/**
 * API proxy for initiating Stripe Link payment for courses
 * This endpoint acts as a bridge between the frontend and the backend payment service
 */
export async function POST(req: NextRequest) {
  try {
    // Get the authorization token from the request
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header missing' },
        { status: 401 }
      );
    }

    // Get the course ID from the request body
    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { message: 'courseId is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const promoCode = searchParams.get('promoCode');

    // Get the backend API URL from environment (must include /api because Nest uses global prefix)
    const backendUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    // Ensure URL is absolute for server-side fetch
    const finalBackendUrl = backendUrl.startsWith('http') 
      ? backendUrl 
      : `http://localhost:3000${backendUrl}`;

    const backendEndpoint = promoCode
      ? `${finalBackendUrl}/payment/stripe-link/init/course?promoCode=${encodeURIComponent(promoCode)}`
      : `${finalBackendUrl}/payment/stripe-link/init/course`;

    // Forward the request to the backend
    const response = await fetch(
      backendEndpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({ courseId }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        data,
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Payment API error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to initiate payment';
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
