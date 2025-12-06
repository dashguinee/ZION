# Meta-Prompt: Security Fixes for DASH WebTV

## Context
You are implementing critical security fixes for DASH WebTV, a Netflix-style streaming platform. The audit identified 5 critical security vulnerabilities that MUST be fixed before production.

## Project Location
- Frontend: `/home/dash/zion-github/dash-webtv/`
- Backend: `/home/dash/zion-github/dash-streaming-server/`

## Tasks

### 1. Fix XSS Vulnerability in Search (CRITICAL)
**File**: `/home/dash/zion-github/dash-webtv/js/app.js` line ~4483
**Issue**: Search query rendered without escaping
**Fix**: Sanitize all user input before rendering to DOM
```javascript
// Add this sanitization function and use it for all user input display
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}
```

### 2. Remove Hardcoded Credentials (CRITICAL)
**File**: `/home/dash/zion-github/dash-streaming-server/src/config.js` lines 12-14
**Issue**: Default StarShare credentials in code
**Fix**:
- Remove ALL hardcoded credentials
- Use environment variables ONLY
- Add validation that env vars are set on startup
- Update .env.example with required vars (no actual values)

### 3. Fix Hardcoded Admin Key (CRITICAL)
**Files**:
- `/home/dash/zion-github/dash-streaming-server/src/routes/admin.js` line 16
- `/home/dash/zion-github/dash-streaming-server/src/routes/content-health.js` line 16
**Issue**: "dash-admin-2025" is predictable
**Fix**:
- Move admin key to environment variable `ADMIN_API_KEY`
- Generate strong random key (32+ chars)
- Add middleware that checks `x-admin-key` header against env var

### 4. Add Backend Authorization to Stream Endpoints (CRITICAL)
**File**: `/home/dash/zion-github/dash-streaming-server/src/routes/stream.js`
**Issue**: Stream endpoints have ZERO access checks - anyone can stream any content
**Fix**:
- Create `requireAuth` middleware that validates user session/token
- Create `requirePackageAccess` middleware that checks if user's package includes the content category
- Apply to ALL streaming endpoints:
  - `/api/stream/*`
  - `/api/live/*`
  - `/api/hls/*`

### 5. Secure Wallet Admin Endpoint (CRITICAL)
**File**: `/home/dash/zion-github/dash-streaming-server/src/routes/wallet.js` line ~329
**Issue**: `/api/wallet/admin/all` has no authentication
**Fix**: Add `requireAdmin` middleware to this endpoint

## Implementation Order
1. Add sanitizeHTML function to app.js
2. Fix search display to use sanitizeHTML
3. Create requireAuth middleware
4. Create requireAdmin middleware
5. Apply middlewares to all routes
6. Move credentials to env vars
7. Update config.js to read from env only

## Success Criteria
- [ ] XSS test: Searching for `<script>alert('xss')</script>` shows escaped text
- [ ] No hardcoded credentials in any source file
- [ ] Admin endpoints return 401 without valid admin key
- [ ] Stream endpoints return 401 without valid user session
- [ ] Server fails to start if required env vars missing

## DO NOT
- Do not change the API response formats
- Do not add new dependencies
- Do not modify the frontend routing logic
- Do not touch the video player code

## Output
When complete, provide:
1. List of files modified with line counts
2. New environment variables required
3. How to test each fix
