# Security Fixes Deployment Checklist

## Pre-Deployment Steps

### 1. Generate Admin API Key
```bash
# Generate a secure 64-character random key
openssl rand -hex 32
```

**Save this key securely** - you'll need it for all admin operations.

### 2. Update Environment Variables

**Railway (Backend)**:
1. Go to your Railway project dashboard
2. Navigate to Variables tab
3. Add/Update these variables:

```env
# Required - Server will not start without these
STARSHARE_BASE_URL=https://starshare.cx
STARSHARE_USERNAME=<your_actual_starshare_username>
STARSHARE_PASSWORD=<your_actual_starshare_password>

# Required - Admin endpoints disabled without this
ADMIN_API_KEY=<the_key_you_generated_above>
```

**Vercel (Frontend)**:
- No changes needed - frontend security is handled client-side

### 3. Update Frontend Code (if using custom admin dashboard)

If you have a separate admin dashboard that calls backend admin endpoints:

```javascript
// Add x-admin-key header to all admin API calls
const response = await fetch('https://your-backend.railway.app/api/admin/stats', {
  headers: {
    'x-admin-key': 'YOUR_ADMIN_API_KEY' // Store in env var, not hardcoded!
  }
});
```

### 4. Update Frontend Stream Requests

Ensure all stream requests include the username:

```javascript
// Example: Playing a movie
const streamUrl = `${backendUrl}/api/stream/vod/${movieId}?username=${currentUser.username}`;

// Or via header (preferred)
const response = await fetch(`${backendUrl}/api/stream/vod/${movieId}`, {
  headers: {
    'X-Username': currentUser.username
  }
});
```

---

## Deployment Process

### Step 1: Deploy Backend
```bash
# Railway will auto-deploy on git push
cd dash-streaming-server
git add .
git commit -m "Security fixes: Authentication, authorization, XSS prevention"
git push railway main
```

**Wait for deployment to complete** - Check logs for:
- ✅ "Server started on port 3000"
- ❌ "CRITICAL: Missing required environment variables" - Add missing vars

### Step 2: Deploy Frontend
```bash
# Vercel will auto-deploy on git push
cd dash-webtv
git add .
git commit -m "Security fix: XSS prevention in search"
git push origin main
```

### Step 3: Verify Deployment

**Test Backend Health**:
```bash
curl https://your-backend.railway.app/health
```

**Test Admin Protection**:
```bash
# Should return 401
curl https://your-backend.railway.app/api/admin/stats

# Should return 200
curl -H "x-admin-key: YOUR_ADMIN_KEY" https://your-backend.railway.app/api/admin/stats
```

**Test Stream Protection**:
```bash
# Should return 401
curl https://your-backend.railway.app/api/stream/vod/12345

# Should return 401 (user not found) or 200 (if user exists)
curl -H "X-Username: test_user" https://your-backend.railway.app/api/stream/vod/12345
```

**Test XSS Prevention**:
1. Open frontend: https://your-frontend.vercel.app
2. Search for: `<script>alert('xss')</script>`
3. Verify it shows escaped text, not an alert

---

## Post-Deployment Verification

### Critical Checks
- [ ] Backend starts without errors
- [ ] Admin endpoints require admin key
- [ ] Stream endpoints require username
- [ ] Unauthenticated requests return 401
- [ ] XSS in search shows escaped text
- [ ] Existing users can still stream content
- [ ] Admin dashboard works with new headers

### Monitor Logs
Watch Railway logs for:
- "Unauthorized access attempt" - Normal, shows security working
- "Authentication failed: User not found" - Check username passed correctly
- "CRITICAL: Missing required environment variables" - Add missing vars

---

## Rollback Plan (If Issues Occur)

### If Backend Won't Start
```bash
# Check Railway logs for missing env vars
# Add them in Railway dashboard > Variables
# Redeploy
```

### If Streams Don't Work
```bash
# Check frontend is sending X-Username header
# Verify user exists in system
# Check user status is 'active' not 'suspended'
```

### Emergency Rollback
```bash
# Railway
cd dash-streaming-server
git revert HEAD
git push railway main

# Vercel
cd dash-webtv
git revert HEAD
git push origin main
```

---

## Common Issues & Solutions

### Issue: "CRITICAL: Missing required environment variables"
**Solution**: Add the missing env vars to Railway dashboard

### Issue: "Admin functionality disabled"
**Solution**: Set ADMIN_API_KEY in Railway environment variables

### Issue: "Authentication required"
**Solution**:
- Frontend must send `X-Username` header or query param
- Verify username exists in IPTV users system

### Issue: "Package upgrade required"
**Solution**:
- User's package doesn't include the content type
- Upgrade user package or restrict access to appropriate content

### Issue: "Account suspended"
**Solution**:
- User status is not 'active'
- Reactivate user via admin API

---

## Security Best Practices

### DO
✅ Store ADMIN_API_KEY in environment variables only
✅ Use HTTPS for all API requests
✅ Rotate admin key periodically (every 90 days)
✅ Monitor logs for unauthorized access attempts
✅ Keep .env.example updated (no real credentials)

### DON'T
❌ Hardcode ADMIN_API_KEY in frontend code
❌ Commit .env file to git
❌ Share admin key in chat/email (use secure channels)
❌ Use weak admin keys (minimum 32 characters)
❌ Disable authentication "temporarily" (always keep it on)

---

## Support Contacts

**Implementation**: ZION SYNAPSE
**Platform**: DASH WebTV
**Date**: December 7, 2025

For issues, check:
1. Railway logs for backend errors
2. Browser console for frontend errors
3. Network tab for failed API requests
4. Security report: `SECURITY_FIXES_REPORT.md`
