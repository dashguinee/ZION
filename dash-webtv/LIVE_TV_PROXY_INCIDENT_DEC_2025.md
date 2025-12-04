# Live TV Proxy Incident - December 4, 2025

## Incident Summary

**Date**: December 4, 2025
**Issue**: Live TV stopped working - all channels failing with "Switching proxy..." message
**Root Cause**: Starshare.cx started blocking Cloudflare Workers IP ranges (HTTP 419)
**Resolution**: Switched primary proxy from Cloudflare Workers to Vercel Edge Functions

---

## Timeline

| Time | Event |
|------|-------|
| Unknown | Starshare began blocking Cloudflare Workers IPs |
| Dec 4, ~23:00 MYT | User reported Live TV not working |
| Dec 4, 23:30 MYT | Diagnosed as HTTP 419 from Cloudflare proxy |
| Dec 4, 23:38 MYT | Fix deployed - Vercel Edge as primary proxy |

---

## Diagnostic Evidence

### Cloudflare Worker (BLOCKED)
```
URL: https://dash-webtv-proxy.dash-webtv.workers.dev/?url=<stream>
Response: HTTP 419
Body: {"error":"Upstream error","status":419,"statusText":""}
```

### Vercel Edge (WORKING)
```
URL: https://dash-webtv.vercel.app/api/stream?url=<stream>
Response: HTTP 200
Content-Type: video/mp2t
```

### Direct to Starshare (NO CORS)
```
URL: https://starshare.cx/live/{user}/{pass}/{id}.ts
Response: Works but no CORS headers - blocked by browser
```

---

## Technical Analysis

### Root Cause: IP-Based Blocking by Starshare

Starshare implemented IP-based blocking that affects different sources differently:

| Request Source | IP Range | Result |
|----------------|----------|--------|
| Cloudflare Workers | Cloudflare edge IPs | HTTP 419 (hard block) |
| WSL Server | 161.142.155.1 (Malaysia datacenter) | HTTP 200 but content-length: 0 (soft block) |
| Vercel Edge | Vercel AWS IPs | HTTP 200 with content ✅ |
| User's browser | User's home IP | Would work but CORS blocks it |

### Evidence

```bash
# Direct from WSL to Starshare - EMPTY response
$ curl -sI "https://starshare.cx/live/AzizTest1/Test1/1920.ts"
HTTP/2 200
content-length: 0  # <-- EMPTY!

# Through Cloudflare Worker - BLOCKED
$ curl -sI "https://dash-webtv-proxy.workers.dev/?url=..."
HTTP/2 419  # <-- Blocked

# Through Vercel Edge - WORKS
$ curl -sI "https://dash-webtv.vercel.app/api/stream?url=..."
HTTP/2 200
content-type: video/mp2t  # <-- Actual video data!
```

### Why HTTP 419?

HTTP 419 is a non-standard status code. Starshare uses it to indicate "blocked/rejected request".
They detect Cloudflare Workers by their well-known IP ranges.

### Why Vercel Edge Works?

- Vercel Edge runs on AWS infrastructure with different IPs
- Less commonly blocked by IPTV providers (for now)
- May be blocked in the future - need monitoring

### The Relative URL Bug

Additionally discovered: mpegts.js runs in a Web Worker which cannot resolve relative URLs.

**Before (broken)**:
```javascript
{ name: 'Vercel Edge', url: '/api/stream', param: 'url' }
```

**After (fixed)**:
```javascript
{ name: 'Vercel Edge', url: 'https://dash-webtv.vercel.app/api/stream', param: 'url' }
```

---

## Changes Made

### File: `js/xtream-client.js`

**Commit**: `84b86ee`

```javascript
// BEFORE (Cloudflare first, relative Vercel URL)
this.proxyList = [
  { name: 'Cloudflare', url: 'https://dash-webtv-proxy.dash-webtv.workers.dev', param: 'url' },
  { name: 'Vercel Edge', url: '/api/stream', param: 'url' }
]

// AFTER (Vercel first with absolute URL, Cloudflare fallback)
this.proxyList = [
  { name: 'Vercel Edge', url: 'https://dash-webtv.vercel.app/api/stream', param: 'url' },
  { name: 'Cloudflare', url: 'https://dash-webtv-proxy.dash-webtv.workers.dev', param: 'url' }
]
```

---

## Proxy Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  (mpegts.js in Web Worker - needs absolute URLs!)           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              PRIMARY: Vercel Edge Proxy                      │
│  URL: https://dash-webtv.vercel.app/api/stream              │
│  Status: ✅ WORKING (HTTP 200)                              │
│  File: /api/stream.js                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │ (on failure)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              FALLBACK: Cloudflare Workers                    │
│  URL: https://dash-webtv-proxy.dash-webtv.workers.dev       │
│  Status: ❌ BLOCKED (HTTP 419)                              │
│  File: /cloudflare-worker.js                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Starshare.cx                              │
│  URL: https://starshare.cx/live/{user}/{pass}/{id}.ts       │
│  Note: No CORS headers - proxy required for browser          │
└─────────────────────────────────────────────────────────────┘
```

---

## Prevention Strategy - NEVER AGAIN

### What Went Wrong
1. **No monitoring** - We didn't know Cloudflare was blocked until user reported
2. **No automatic failover** - App kept retrying blocked proxy instead of switching
3. **Relative URL bug** - Web Worker context wasn't tested
4. **Single point of failure** - When primary proxy died, fallback was broken too

### Prevention Measures (MUST IMPLEMENT)

#### 1. Proxy Health Check (Add to app startup)
```javascript
// Test each proxy on app load, reorder by health
async function checkProxyHealth() {
  for (const proxy of proxyList) {
    try {
      const testUrl = `${proxy.url}/?${proxy.param}=${encodeURIComponent('https://httpbin.org/get')}`
      const response = await fetch(testUrl, { method: 'HEAD', timeout: 5000 })
      proxy.healthy = response.ok
    } catch {
      proxy.healthy = false
    }
  }
  // Move healthy proxies to front
  proxyList.sort((a, b) => b.healthy - a.healthy)
}
```

#### 2. Automatic Failover (Already exists but needs improvement)
- Current: Switches after failure
- Needed: Switch FASTER (after 2 seconds, not waiting for timeout)
- Needed: Remember which proxy works, don't retry blocked ones in same session

#### 3. Multiple Backup Proxies
| Proxy | Status | Priority |
|-------|--------|----------|
| Vercel Edge (dash-webtv.vercel.app) | WORKING | 1 |
| Railway FFmpeg (/api/proxy) | NOT BUILT | 2 |
| Cloudflare Workers | BLOCKED | 3 |

#### 4. Alert System
- Add console warning when proxy switch happens
- Store proxy failures in localStorage
- Show user-visible indicator if streaming degraded

### Future Proxy Options (If Vercel Gets Blocked)

1. **Railway Proxy** - Add `/api/proxy/live` endpoint to FFmpeg server
2. **Netlify Edge** - Different IP range than Vercel
3. **Deno Deploy** - Another edge provider
4. **Self-hosted** - VPS with residential IP (last resort)

---

## Lessons Learned

1. **Always use absolute URLs** when code runs in Web Workers
2. **IPTV providers actively block known proxy services** - need fallback strategy
3. **Document proxy architecture** so future instances understand the flow
4. **Test both proxies** when debugging - don't assume which is failing
5. **Monitor proactively** - Don't wait for user reports
6. **Test from browser, not curl** - Different IP treatment
7. **Have 3+ proxy options** - Two is not enough

---

## Files Reference

| File | Purpose |
|------|---------|
| `/js/xtream-client.js` | Proxy list and URL building |
| `/api/stream.js` | Vercel Edge proxy function |
| `/cloudflare-worker.js` | Cloudflare Workers proxy |
| `/PLATFORM_ARCHITECTURE.md` | Full system documentation |

---

*Documented: December 4, 2025*
*Author: ZION SYNAPSE*
