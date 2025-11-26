# DASH WebTV - Optimization Plan

**Goal:** Smooth playback on 2mbps connections
**Date:** November 26, 2025

---

## Research Findings

### 1. Are We Using the Right Format?

**Current:** MPEG-TS (.ts) with mpegts.js
**Better Option:** HLS (.m3u8) with hls.js

| Factor | MPEG-TS (current) | HLS (recommended) |
|--------|-------------------|-------------------|
| Adaptive Bitrate | NO - fixed bitrate | YES - auto-adjusts quality |
| Low Bandwidth | Poor - buffers constantly | Good - drops quality smoothly |
| Browser Support | Needs JS decoder (CPU heavy) | Native in Safari, JS elsewhere |
| Latency | Low (~1 sec) | Higher (~3-10 sec) |
| Library Downloads | 9,438/week (mpegts.js) | 1,685,084/week (hls.js) |

**Verdict:** For 2mbps target, **HLS is better** because it adapts quality automatically.

Sources:
- [MPEGTS vs HLS - VideoSDK](https://www.videosdk.live/developer-hub/hls/mpegts-vs-hls)
- [HLS vs MPEG-TS - Xtream AI Docs](https://xtreamai.net/docs/hls-vs-mpegts.html)
- [npm trends comparison](https://npmtrends.com/hls.js-vs-mpegts.js-vs-videojs-contrib-hls)

---

### 2. Does Starshare Support HLS?

**Test Results:**
```
GET /live/user/pass/streamid.ts   → Works (MPEG-TS stream)
GET /live/user/pass/streamid.m3u8 → Returns content-length: 0
```

**Finding:** Starshare's HLS endpoint returns empty content. The MPEG-TS stream works.

**This is a server-side limitation.** We can't use HLS adaptive bitrate unless:
1. Starshare enables proper HLS output
2. We transcode server-side (expensive, adds latency)
3. We find a different endpoint format

---

### 3. Why Does It Buffer on Fast Internet?

The bottleneck path:
```
Starshare Server (fast)
    ↓
Cloudflare Worker Proxy (adds ~50-100ms per request)
    ↓
Browser downloads chunks
    ↓
mpegts.js decodes in JavaScript (CPU intensive)
    ↓
Video element renders
```

**Issues identified:**
1. **Proxy overhead** - Every byte goes through our worker
2. **JS decoding** - mpegts.js uses CPU, not hardware decoding
3. **No adaptive bitrate** - Can't drop quality when bandwidth dips

---

### 4. Options for 2mbps Optimization

#### Option A: Optimize Current Stack (MPEG-TS)
- Tune mpegts.js buffer settings further
- Increase lazyLoad buffer for low bandwidth
- Add bandwidth detection, show lower quality warning
- **Pros:** Works now, no major changes
- **Cons:** Still no adaptive bitrate, will buffer on slow networks

#### Option B: Find Working HLS Endpoint
- Test alternative Xtream endpoints (some providers have HLS on different ports)
- Try `output=m3u8` parameter variations
- **Pros:** Would enable adaptive bitrate
- **Cons:** May not exist for this provider

#### Option C: Server-Side Transcoding
- Set up FFmpeg on a server to convert TS → HLS with multiple qualities
- Stream through our own HLS server
- **Pros:** Full control, true adaptive bitrate
- **Cons:** Expensive, complex, adds latency, server costs

#### Option D: Accept Limitations + Optimize UX
- Keep MPEG-TS but optimize for "good enough"
- Add quality indicators to UI
- Let users choose SD channels on slow connections
- Pre-buffer more aggressively
- **Pros:** Realistic, achievable
- **Cons:** Won't match native app quality

---

## Recommended Approach

### Phase 1: Optimize What We Have (Quick Wins)
1. **Tune mpegts.js for low bandwidth:**
   - Increase buffer for stability over latency
   - `lazyLoadMaxDuration: 60` (1 min buffer)
   - `liveBufferLatencyChasing: false` (don't chase live edge)

2. **Add bandwidth detection:**
   - Measure download speed on first load
   - Warn users if bandwidth < 2mbps
   - Suggest SD channels

3. **UI improvements:**
   - Show buffering progress percentage
   - Display current bitrate/quality
   - Add "Low bandwidth mode" toggle

### Phase 2: Investigate HLS Options
1. Test all possible HLS endpoint variations
2. Check if provider has multi-bitrate HLS
3. Research if transcoding proxy is viable

### Phase 3: Measure & Iterate
1. Collect real metrics from users
2. Identify worst-performing scenarios
3. Targeted fixes based on data

---

## Target Metrics

| Metric | Current | Target (2mbps) |
|--------|---------|----------------|
| Time to first frame | TBD | < 5 sec |
| Buffer stalls per minute | TBD | < 3 |
| Stall duration | TBD | < 1 sec |
| Playback smoothness | Choppy | Watchable |

---

## Key Insight

**The fundamental limitation is: Starshare doesn't provide adaptive bitrate HLS.**

Without adaptive streaming, we can't automatically adjust quality for slow connections. We can only:
1. Optimize the single-bitrate stream we get
2. Help users choose appropriate channels for their bandwidth
3. Buffer more aggressively (trading latency for smoothness)

Native IPTV apps have the same limitation - they just have better native decoders and direct network access.

---

## Next Steps

1. [ ] Test mpegts.js with increased buffer settings
2. [ ] Add bandwidth detection on app load
3. [ ] Create "Low bandwidth mode" that increases buffering
4. [ ] Test all HLS endpoint variations on Starshare
5. [ ] Measure metrics on 2mbps throttled connection
6. [ ] Document which channels work well on low bandwidth
