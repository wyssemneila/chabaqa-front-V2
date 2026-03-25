import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Google OAuth Callback Handler
 * 
 * This route handles the redirect from Google after the user authorizes the app.
 * Google redirects here with:
 * - code: The authorization code to exchange for tokens
 * - state: The user ID (passed in getAuthUrl for security)
 * - error: If the user denied access
 * 
 * The backend GET /google-calendar/callback endpoint handles the token exchange
 * using the state parameter (userId) to identify the user.
 * 
 * If state is missing, we render a client-side page that reads the token from
 * localStorage (stored by the parent window) and calls the backend.
 */
export async function GET(request: NextRequest) {
  // Parse URL carefully - Google sometimes encodes parameters differently
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // Try to get parameters from query string
  let code = searchParams.get('code');
  let error = searchParams.get('error');
  let state = searchParams.get('state'); // User ID for security

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const [forwardedHostname, forwardedPort] = (forwardedHost || '').split(':', 2);
  const forwardedOrigin = forwardedHostname
    ? `${forwardedProto || 'https'}://${forwardedHostname}${forwardedPort ? `:${forwardedPort}` : ''}`
    : '';
  const appUrl = forwardedOrigin
    ? forwardedOrigin
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080';
  const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  // For client-side calls, use the public API URL
  const clientApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  // Log the full URL to debug
  console.log('[Google Callback] Full URL:', request.url);
  console.log('[Google Callback] URL pathname:', url.pathname);
  console.log('[Google Callback] URL search:', url.search);
  console.log('[Google Callback] All search params:', Object.fromEntries(searchParams.entries()));
  console.log('[Google Callback] Received callback:', { 
    hasCode: !!code, 
    codeLength: code?.length,
    hasError: !!error, 
    state,
    apiUrl 
  });
  
  // Get JWT token from cookies for fallback authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  // Also try to get token from request cookies directly
  const requestCookies = request.cookies.get('token')?.value;
  const effectiveToken = token || requestCookies;
  
  console.log('[Google Callback] Token from cookieStore:', token ? 'present' : 'missing');
  console.log('[Google Callback] Token from request.cookies:', requestCookies ? 'present' : 'missing');
  console.log('[Google Callback] Effective token:', effectiveToken ? 'present' : 'missing');

  // Handle OAuth errors (user denied access)
  if (error) {
    console.log('[Google Callback] OAuth error:', error);
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Google Calendar - Error</title></head>
        <body>
          <script>
            localStorage.removeItem('google_calendar_oauth_pending');
            localStorage.removeItem('google_calendar_oauth_token');
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_CALENDAR_ERROR',
                message: 'Authorization was denied or cancelled.'
              }, '${appUrl}');
              window.close();
            } else {
              window.location.href = '/creator/sessions?google_error=denied';
            }
          </script>
          <p>Authorization was denied. This window should close automatically.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (!code) {
    console.log('[Google Callback] No authorization code received');
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Google Calendar - Error</title></head>
        <body>
          <script>
            localStorage.removeItem('google_calendar_oauth_pending');
            localStorage.removeItem('google_calendar_oauth_token');
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_CALENDAR_ERROR',
                message: 'No authorization code received.'
              }, '${appUrl}');
              window.close();
            } else {
              window.location.href = '/creator/sessions?google_error=no_code';
            }
          </script>
          <p>No authorization code received. This window should close automatically.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // If no state, render a client-side page that will read token from localStorage
  if (!state) {
    console.log('[Google Callback] No state (userId) received, rendering client-side handler');
    
    // If we have a server-side token, try that first
    if (effectiveToken) {
      console.log('[Google Callback] Using server-side JWT token');
      try {
        const callbackUrl = `${apiUrl}/google-calendar/callback`;
        console.log('[Google Callback] Calling backend POST with JWT:', callbackUrl);
        
        const response = await fetch(callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveToken}`,
          },
          body: JSON.stringify({ code }),
        });

        console.log('[Google Callback] Backend POST response status:', response.status);

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          console.log('[Google Callback] Server-side JWT success:', data);
          
          return new Response(`
            <!DOCTYPE html>
            <html>
              <head><title>Google Calendar - Connected</title></head>
              <body>
                <script>
                  localStorage.removeItem('google_calendar_oauth_pending');
                  localStorage.removeItem('google_calendar_oauth_token');
                  if (window.opener) {
                    window.opener.postMessage({
                      type: 'GOOGLE_CALENDAR_SUCCESS',
                      message: 'Google Calendar connected successfully!'
                    }, '${appUrl}');
                    window.close();
                  } else {
                    window.location.href = '/creator/sessions?google_success=true';
                  }
                </script>
                <p>Google Calendar connected successfully! This window should close automatically.</p>
              </body>
            </html>
          `, {
            headers: { 'Content-Type': 'text/html' },
          });
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('[Google Callback] Server-side JWT error:', errorData);
        }
      } catch (jwtError: any) {
        console.error('[Google Callback] Server-side JWT exception:', jwtError);
      }
    }
    
    // Fall back to client-side handling with localStorage token
    console.log('[Google Callback] Falling back to client-side localStorage token');
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Calendar - Connecting...</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
            .container { text-align: center; padding: 20px; }
            .spinner { width: 40px; height: 40px; border: 3px solid #e0e0e0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
            @keyframes spin { to { transform: rotate(360deg); } }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner" id="spinner"></div>
            <p id="status">Connecting Google Calendar...</p>
          </div>
          <script>
            (async function() {
              const code = '${code}';
              const appUrl = '${appUrl}';
              const apiUrl = '${clientApiUrl}';
              
              // Try to get token from localStorage (stored by parent window)
              const token = localStorage.getItem('google_calendar_oauth_token');
              
              console.log('[Google Callback Client] Token from localStorage:', token ? 'present' : 'missing');
              
              if (!token) {
                document.getElementById('spinner').style.display = 'none';
                document.getElementById('status').innerHTML = '<span class="error">Session expired. Please close this window and try again.</span>';
                localStorage.removeItem('google_calendar_oauth_pending');
                
                setTimeout(() => {
                  if (window.opener) {
                    window.opener.postMessage({
                      type: 'GOOGLE_CALENDAR_ERROR',
                      message: 'Session expired. Please try again.'
                    }, appUrl);
                    window.close();
                  }
                }, 2000);
                return;
              }
              
              try {
                const response = await fetch(apiUrl + '/google-calendar/callback', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                  },
                  body: JSON.stringify({ code })
                });
                
                console.log('[Google Callback Client] Response status:', response.status);
                
                if (response.ok) {
                  document.getElementById('status').textContent = 'Connected successfully!';
                  localStorage.removeItem('google_calendar_oauth_pending');
                  localStorage.removeItem('google_calendar_oauth_token');
                  
                  if (window.opener) {
                    window.opener.postMessage({
                      type: 'GOOGLE_CALENDAR_SUCCESS',
                      message: 'Google Calendar connected successfully!'
                    }, appUrl);
                    window.close();
                  } else {
                    window.location.href = '/creator/sessions?google_success=true';
                  }
                } else {
                  const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                  console.error('[Google Callback Client] Error:', errorData);
                  
                  document.getElementById('spinner').style.display = 'none';
                  document.getElementById('status').innerHTML = '<span class="error">' + (errorData.message || 'Failed to connect') + '</span>';
                  localStorage.removeItem('google_calendar_oauth_pending');
                  localStorage.removeItem('google_calendar_oauth_token');
                  
                  setTimeout(() => {
                    if (window.opener) {
                      window.opener.postMessage({
                        type: 'GOOGLE_CALENDAR_ERROR',
                        message: errorData.message || 'Failed to connect Google Calendar'
                      }, appUrl);
                      window.close();
                    }
                  }, 2000);
                }
              } catch (err) {
                console.error('[Google Callback Client] Exception:', err);
                
                document.getElementById('spinner').style.display = 'none';
                document.getElementById('status').innerHTML = '<span class="error">Connection failed. Please try again.</span>';
                localStorage.removeItem('google_calendar_oauth_pending');
                localStorage.removeItem('google_calendar_oauth_token');
                
                setTimeout(() => {
                  if (window.opener) {
                    window.opener.postMessage({
                      type: 'GOOGLE_CALENDAR_ERROR',
                      message: 'Connection failed: ' + (err.message || 'Unknown error')
                    }, appUrl);
                    window.close();
                  }
                }, 2000);
              }
            })();
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    // Call backend to exchange code for tokens
    // The backend GET /google-calendar/callback endpoint uses the state parameter as userId
    const callbackUrl = `${apiUrl}/google-calendar/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    console.log('[Google Callback] Calling backend:', callbackUrl);
    
    const response = await fetch(callbackUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[Google Callback] Backend response status:', response.status);

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log('[Google Callback] Success:', data);
      
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Google Calendar - Connected</title></head>
          <body>
            <script>
              localStorage.removeItem('google_calendar_oauth_pending');
              localStorage.removeItem('google_calendar_oauth_token');
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_CALENDAR_SUCCESS',
                  message: 'Google Calendar connected successfully!'
                }, '${appUrl}');
                window.close();
              } else {
                window.location.href = '/creator/sessions?google_success=true';
              }
            </script>
            <p>Google Calendar connected successfully! This window should close automatically.</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      });
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('[Google Callback] Backend error:', errorData);
      
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Google Calendar - Error</title></head>
          <body>
            <script>
              localStorage.removeItem('google_calendar_oauth_pending');
              localStorage.removeItem('google_calendar_oauth_token');
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_CALENDAR_ERROR',
                  message: '${errorData.message || 'Failed to connect Google Calendar'}'
                }, '${appUrl}');
                window.close();
              } else {
                window.location.href = '/creator/sessions?google_error=backend_error';
              }
            </script>
            <p>Failed to connect Google Calendar. This window should close automatically.</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      });
    }
  } catch (error: any) {
    console.error('[Google Callback] Exception:', error);
    
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Google Calendar - Error</title></head>
        <body>
          <script>
            localStorage.removeItem('google_calendar_oauth_pending');
            localStorage.removeItem('google_calendar_oauth_token');
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_CALENDAR_ERROR',
                message: 'Connection failed: ${error.message || 'Unknown error'}'
              }, '${appUrl}');
              window.close();
            } else {
              window.location.href = '/creator/sessions?google_error=exception';
            }
          </script>
          <p>Connection failed. This window should close automatically.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
