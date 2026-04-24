# Challenge Promo Page - Troubleshooting Guide

## Issue: Page redirects but doesn't show challenge data

### Debugging Steps

1. **Open Browser Console** (F12 or Right-click > Inspect > Console)
   - Look for logs starting with `[Promo Page]`
   - Check for any error messages

2. **Check Console Logs**
   ```
   [Promo Page] Fetching challenge: <challengeId>
   [Promo Page] Challenge API response: {...}
   [Promo Page] Challenge data: {...}
   ```

3. **Common Issues**

   **Issue: "Challenge not found" error**
   - **Cause**: Invalid challenge ID or challenge doesn't exist
   - **Solution**: Verify the challenge ID is correct
   - **Check**: Look at the URL - `/challenge-promo/[id]`

   **Issue: API returns 401 Unauthorized**
   - **Cause**: Challenge requires authentication
   - **Solution**: User needs to be logged in
   - **Check**: Console will show "401" error

   **Issue: API returns 404 Not Found**
   - **Cause**: Challenge doesn't exist or was deleted
   - **Solution**: Verify challenge exists in database
   - **Check**: Console will show "404" error

   **Issue: Network error / CORS**
   - **Cause**: API server not reachable or CORS misconfigured
   - **Solution**: Check API_URL in .env.local
   - **Check**: Network tab in browser dev tools

4. **Verify API Configuration**
   ```bash
   # Check .env.local file
   NEXT_PUBLIC_API_URL=http://51.254.132.77:3000/api
   API_INTERNAL_URL=http://51.254.132.77:3000/api
   ```

5. **Test API Directly**
   ```bash
   # Test if API is reachable
   curl http://51.254.132.77:3000/api/challenges/<challengeId>
   ```

6. **Check Response Structure**
   The API should return:
   ```json
   {
     "success": true,
     "data": {
       "id": "...",
       "title": "...",
       "description": "...",
       // ... other challenge fields
     }
   }
   ```

### Development Mode Debug Info

In development mode, the error page shows debug information including:
- Challenge ID
- Error message
- Loading state

### Expected Console Output (Success)

```
[Promo Page] Fetching challenge: 123abc
[Promo Page] Challenge API response: { success: true, data: {...} }
[Promo Page] Challenge data: { id: "123abc", title: "...", ... }
[Promo Page] Stats response: { success: true, data: {...} }
[Promo Page] Rendering with challenge: { id: "123abc", ... }
```

### Expected Console Output (Error)

```
[Promo Page] Fetching challenge: 123abc
[Promo Page] Error fetching challenge: { message: "...", statusCode: 404 }
[Promo Page] Error details: { message: "...", status: 404, error: "..." }
```

## Quick Fixes

### Fix 1: Clear Browser Cache
```
Ctrl+Shift+Delete (Windows/Linux)
Cmd+Shift+Delete (Mac)
```

### Fix 2: Restart Development Server
```bash
npm run dev
# or
yarn dev
```

### Fix 3: Check Challenge Exists
- Go to challenges list page
- Verify the challenge is visible
- Click "View Promo Page" button
- Check if URL is correct

### Fix 4: Verify Authentication
- Some challenges may require login
- Try logging in first
- Then access the promo page

## Contact Support

If issues persist:
1. Copy console logs
2. Note the challenge ID
3. Screenshot the error page
4. Report to development team
