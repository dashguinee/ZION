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
**Status:** PENDING

Hypothesis: Proxy adds latency

Test:
- [ ] Try direct .ts URL (will fail CORS but let's confirm)
- [ ] Check if starshare has CORS on any endpoints
- [ ] Measure latency difference

---

## Phase 4: Alternative Proxy (Cloudflare Workers)
**Status:** PENDING

Hypothesis: Cloudflare edge network faster than Vercel

- [ ] Create Cloudflare Worker for stream proxy
- [ ] Compare latency/buffering vs Vercel
- [ ] Measure time-to-first-byte

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

## Metrics to Track
- Time to first frame
- Buffer events count
- Playback smoothness
- Memory usage

