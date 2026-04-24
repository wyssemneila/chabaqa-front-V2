import { NextRequest, NextResponse } from 'next/server'

function extractErrorMessage(payload: any): string {
  if (!payload) return ''
  if (typeof payload === 'string') return payload
  if (Array.isArray(payload)) {
    return payload.map((entry) => extractErrorMessage(entry)).filter(Boolean).join(', ')
  }
  if (typeof payload === 'object') {
    return (
      extractErrorMessage(payload.message) ||
      extractErrorMessage(payload.error?.message) ||
      extractErrorMessage(payload.error) ||
      ''
    )
  }
  return ''
}

async function parseBackendResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  try {
    const text = await response.text()
    return text ? { message: text } : null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const communityId =
      typeof body?.communityId === 'string' ? body.communityId.trim() : ''
    const inviteCode =
      typeof body?.inviteCode === 'string' ? body.inviteCode.trim() : ''
    const message = typeof body?.message === 'string' ? body.message : undefined

    if (!communityId && !inviteCode) {
      return NextResponse.json(
        { success: false, message: 'communityId or inviteCode is required' },
        { status: 400 }
      )
    }

    // Get JWT token from Authorization header or cookies
    const authHeader = request.headers.get('authorization') || ''
    const bearerToken = authHeader && authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader
      : null
    // Try common JWT cookie names
    const cookieToken =
      request.cookies.get('accessToken')?.value ||
      request.cookies.get('token')?.value ||
      request.cookies.get('jwt')?.value ||
      request.cookies.get('authToken')?.value ||
      null
    const incomingCookies = request.headers.get('cookie') || ''
    const origin = request.headers.get('origin') || ''

    if (!bearerToken && !cookieToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Make request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
    const useInviteRoute = Boolean(inviteCode)
    const endpoint = useInviteRoute
      ? `${backendUrl}/community-aff-crea-join/join-by-invite`
      : `${backendUrl}/community-aff-crea-join/join`
    const payload = useInviteRoute
      ? { inviteCode, message }
      : { communityId, message }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // JwtStrategy expects Authorization: Bearer
        'Authorization': bearerToken || (cookieToken ? `Bearer ${cookieToken}` : ''),
        // Forward cookies as well (harmless, may be used by other middlewares)
        ...(incomingCookies ? { 'Cookie': incomingCookies } : {}),
        ...(origin ? { 'Origin': origin } : {}),
      },
      body: JSON.stringify(payload)
    })

    const data = await parseBackendResponse(response)
    const backendMessage = extractErrorMessage(data)

    if (!response.ok) {
      if (response.status === 409) {
        return NextResponse.json(
          {
            success: true,
            message: backendMessage || 'Already a member of this community',
            data: data?.data ?? null,
          },
          { status: 200 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          message:
            backendMessage ||
            `Failed to join community (${response.status})`,
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: backendMessage || 'Successfully joined community',
      data: data?.data ?? null,
    })

  } catch (error) {
    console.error('Join community error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
