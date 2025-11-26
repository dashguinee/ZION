# DASH WebTV - Streaming Optimization Research

**Started:** November 26, 2025
**Goal:** Reduce buffering, identify what's essential vs fluff

---

## Current State (Baseline)

**Live TV is working but buffering**

Current flow:
```
Starshare (.ts) → Vercel Proxy → Browser → mpegts.js → Video Element
```

---

## Phase 1: Strip Down the Fluff (Your Proposal)
**Status:** COMPLETE

Objective: Remove anything non-essential that could slow things down

Checklist:
- [x] Audit app.js for unnecessary operations during playback
- [x] Check service worker - is it intercepting streams? **NO - OK**
- [x] Remove debug console.logs in hot paths **DONE**
- [x] Check for memory leaks / cleanup issues **OK**
- [x] Identify what's ESSENTIAL vs NICE-TO-HAVE **DONE**

### Findings:
1. **BIG ISSUE:** mpegts.js had 3 MINUTE buffer - reduced to 30 sec
2. Removed console.log from proxy (runs on every chunk)
3. Service worker correctly bypasses /api/ routes

### Changes Made:
- `lazyLoadMaxDuration`: 180 → 30 seconds
- `stashInitialSize`: default → 128KB
- `enableStashBuffer`: true → false
- Added `liveBufferLatencyChasing: true` (chase live edge)
- Added `liveBufferLatencyMaxLatency: 1.5` seconds
- Removed proxy logging

---

## Phase 2: Tune mpegts.js Settings
**Status:** PENDING

Current config:
```javascript
mpegts.createPlayer({
  type: 'mse',
  isLive: true,
  url: streamUrl,
  enableWorker: true,
  lazyLoadMaxDuration: 3 * 60,
  seekType: 'range'
})
```

Test variations:
- [ ] Reduce lazyLoadMaxDuration (less buffer = faster start)
- [ ] enableStashBuffer settings
- [ ] liveBufferLatencyChasing (catch up to live)
- [ ] autoCleanupSourceBuffer

---

## Phase 3: Test Without Proxy (Direct Connection)
**Status:** COMPLETE - PROXY REQUIRED

Hypothesis: Proxy adds latency

Test:
- [x] Try direct .ts URL - **NO CORS headers, proxy required**
- [x] Check if starshare has CORS - **NO, but they use Cloudflare**
- [x] Measure latency difference - **N/A, can't test direct**

### Finding:
Direct stream returns:
```
HTTP/2 200
content-type: video/mp2t
server: cloudflare
```
No `Access-Control-Allow-Origin` - browser blocks it. Proxy is mandatory.

### Action Taken:
Switched proxy to **Vercel Edge Runtime**:
- Direct body passthrough (no manual chunk pumping)
- Global edge network (lower latency)
- No cold starts (always warm)

---

## Phase 4: Alternative Proxy (Cloudflare Workers)
**Status:** DEPLOYED - TESTING

Hypothesis: Cloudflare edge network faster than Vercel (Starshare uses Cloudflare)

- [x] Create Cloudflare Worker for stream proxy
- [x] Deploy to: https://dash-webtv-proxy.dash-webtv.workers.dev
- [x] Update app to use Cloudflare proxy
- [ ] Compare latency/buffering vs Vercel
- [ ] Measure time-to-first-byte

### Why This Should Be Faster:
```
Before (Vercel):
Starshare (Cloudflare) → Internet → Vercel Edge → Internet → Browser

After (Cloudflare Worker):
Starshare (Cloudflare) → Cloudflare internal → Browser
```
Same network = less hops = faster

---

## Phase 5: Check for HLS Endpoints
**Status:** PENDING

Hypothesis: HLS might work better than raw MPEG-TS

- [ ] Test .m3u8 endpoints again with different parameters
- [ ] Check if provider has adaptive bitrate HLS
- [ ] Compare HLS.js vs mpegts.js performance

---

## Findings Log

| Time | Phase | Finding | Impact |
|------|-------|---------|--------|
| Nov 26, 14:30 | 1 | 3 min buffer was causing slow start | HIGH |
| Nov 26, 14:30 | 1 | Proxy console.log on every chunk | LOW |
| Nov 26, 14:30 | 1 | Service worker OK - not intercepting | NONE |
| Nov 26, 15:35 | 3 | No CORS on direct stream - proxy required | BLOCKER |
| Nov 26, 15:35 | 3 | Starshare uses Cloudflare CDN | INFO |
| Nov 26, 15:35 | 3 | Switched to Edge Runtime - should be faster | HIGH |

---

## Essential vs Fluff

### ESSENTIAL (Keep)
- mpegts.js decoder
- Video element
- Stream URL builder
- Basic error handling

### UNDER REVIEW
- Service worker during playback
- Console logging
- Loading spinners
- Player event listeners

### FLUFF (Remove)
- TBD after audit

---

## Metrics Now Being Tracked

Console will show these on every stream:
```
📊 METRIC: First byte in XXXms      (network latency)
📊 METRIC: First frame in XXXms     (total time to video)
📊 METRIC: Decode time: XXXms       (mpegts.js processing)
📊 METRIC: Buffer stall #N          (each time video stops)
📊 METRIC: Stall duration: XXXms    (how long each stall)
```

### Target Performance (2mbps connection):
| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| First frame | TBD | <3000ms | User sees video in 3 sec |
| Buffer stalls | TBD | <2/min | Max 2 stalls per minute |
| Stall duration | TBD | <500ms | Each stall under 0.5 sec |

### How to Test 2mbps:
Chrome DevTools → Network → Throttling → Add custom profile:
- Download: 2000 kbps (256 KB/s)
- Upload: 500 kbps
- Latency: 100ms

