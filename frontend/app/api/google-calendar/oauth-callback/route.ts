import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const HTML_HEADERS = {
  'Content-Type': 'text/html',
  'Cross-Origin-Opener-Policy': 'unsafe-none',
  'Cross-Origin-Embedder-Policy': 'unsafe-none',
};

/**
 * Google Calendar OAuth Callback Handler
 *
 * This endpoint handles the OAuth callback specifically for Google Calendar integration.
 * Communication with the parent window uses localStorage because Google's accounts.google.com 
 * sets Cross-Origin-Opener-Policy: same-origin which severs window.opener.
 *
 * Flow:
 *   1. Callback writes result to localStorage key 'google_calendar_oauth_result'
 *   2. Parent listens via the 'storage' event and picks up the result
 *   3. Callback page auto-closes or redirects
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');  // This is the userId

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost =
    request.headers.get('x-forwarded-host') || request.headers.get('host');
  const [forwardedHostname, forwardedPort] = (forwardedHost || '').split(':', 2);
  const forwardedOrigin = forwardedHostname
    ? `${forwardedProto || 'https'}://${forwardedHostname}${forwardedPort ? `:${forwardedPort}` : ''}`
    : '';
  const appUrl = forwardedOrigin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080';
  const apiUrl =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3000/api';
  const clientApiUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  console.log('[Google Calendar Callback] Received:', {
    hasCode: !!code,
    hasError: !!error,
    state,
  });

  const cookieStore = await cookies();
  const effectiveToken =
    cookieStore.get('accessToken')?.value ||
    request.cookies.get('accessToken')?.value ||
    cookieStore.get('token')?.value ||
    request.cookies.get('token')?.value;

  // --- Error from Google (user denied) ---
  if (error) {
    return resultPage('error', 'Authorization was denied or cancelled.');
  }

  // --- No auth code ---
  if (!code) {
    return resultPage('error', 'No authorization code received.');
  }

  // --- Exchange code for tokens ---

  // Strategy 1: state param contains userId → call backend GET endpoint
  if (state && state.match(/^[0-9a-f]{24}$/i)) {
    try {
      const callbackUrl = `${apiUrl}/google-calendar/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
      console.log('[Google Calendar Callback] Backend GET:', callbackUrl);
      const response = await fetch(callbackUrl);
      console.log('[Google Calendar Callback] Backend status:', response.status);

      if (response.ok) {
        return resultPage('success', 'Google Calendar connected successfully!');
      }
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('[Google Calendar Callback] Backend error:', errorData);
      // fall through to strategy 2
    } catch (err: any) {
      console.error('[Google Calendar Callback] Backend exception:', err);
      // fall through to strategy 2
    }
  }

  return resultPage('error', 'Google Calendar authorization could not be verified. Please try again.');
}

/** Build an HTML page that signals the result via localStorage and auto-closes */
function resultPage(
  type: 'success' | 'error',
  message: string,
): Response {
  const eventType =
    type === 'success'
      ? 'GOOGLE_CALENDAR_SUCCESS'
      : 'GOOGLE_CALENDAR_ERROR';
  const redirectQs =
    type === 'success' ? 'google_success=true' : 'google_error=failed';
  const safeMessage = message.replace(/'/g, "\\'").replace(/\\/g, '\\\\');

  return new Response(
    `<!DOCTYPE html>
<html><head><title>Google Calendar - ${type === 'success' ? 'Connected' : 'Error'}</title>
<style>
  body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f5f5f5}
  .c{text-align:center;padding:20px}
  .success{color:#16a34a}
  .err{color:#dc2626}
</style>
</head>
<body>
<div class="c">
<p class="${type === 'success' ? 'success' : 'err'}">${type === 'success' ? 'Google Calendar connected successfully!' : message}</p>
<p>This window should close automatically.</p>
</div>
<script>
  localStorage.removeItem('google_calendar_oauth_pending');
  localStorage.removeItem('google_calendar_oauth_token');
  localStorage.setItem('google_calendar_oauth_result',JSON.stringify({type:'${eventType}',message:'${safeMessage}'}));
  setTimeout(function(){try{window.close()}catch(e){}},1200);
  setTimeout(function(){window.location.href='/creator/sessions?${redirectQs}'},2500);
</script>
</body></html>`,
    { headers: HTML_HEADERS }
  );
}
