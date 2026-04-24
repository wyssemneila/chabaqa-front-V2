import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const productId = formData.get('productId') as string;
    const proofFile = formData.get('proof') as File;
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
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

    // Create form data for backend
    const backendFormData = new FormData();
    backendFormData.append('productId', productId);
    backendFormData.append('proof', proofFile);

    // Forward to backend
    const apiBaseUrl = (process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
    const backendUrl = promoCode
      ? `${apiBaseUrl}/payment/manual/init/product?promoCode=${encodeURIComponent(promoCode)}`
      : `${apiBaseUrl}/payment/manual/init/product`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: backendFormData,
    });

    const data = await response.json();

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
    console.error('Manual payment init error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
