# DASH WebTV - Status Report

**Generated:** November 27, 2025
**Deep Audit Complete**

---

## Current Architecture Summary

```
User Login → Store credentials → Build URLs with credentials

LIVE TV:
  Starshare (.ts) → Cloudflare Worker Proxy → mpegts.js → Video Element

MOVIES/SERIES:
  Starshare (direct URL) → Browser native player
```

---

## What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| Login | ✅ Working | Simple credential storage, no API validation |
| Live TV Playback | ✅ Working* | *Still buffering, see issues below |
| Movie Playback (MP4) | ✅ Working | Direct URLs to Starshare |
| Series Playback (MP4) | ✅ Working | Direct URLs to Starshare |
| Categories/Browse | ✅ Working | Vercel proxy for API calls |
| PWA Install | ✅ Working | Service worker + manifest |

---

## Known Issues

### 1. Live TV Buffering (HIGH PRIORITY)

**Symptom:** Streams buffer/stall even on fast internet

**Root Cause Analysis:**
- `MediaSource onSourceEnded` was appearing - proxy closing connection
- Cloudflare Worker updated with TransformStream fix (deployed Nov 26)
- **Status:** Fix deployed, needs testing

**Technical Stack:**
```
mpegts.js config:
- lazyLoadMaxDuration: 30 seconds
- liveBufferLatencyChasing: true
- liveBufferLatencyMaxLatency: 1.5 seconds
- enableStashBuffer: false
```

**What we've tried:**
1. Vercel proxy → Connection closing issues
2. Cloudflare Worker → Same issue, but same network as Starshare
3. TransformStream fix → Just deployed, untested

### 2. MKV/AVI Content Not Playing (MEDIUM PRIORITY)

**Current Status:** NOT FIXED in main branch

**The Problem:**
- ~23% of movies are MKV format (13,581 files)
- ~12% of series episodes are MKV format (60,696 files)
- Browsers can't play MKV natively
- Current code requests `.mp4` extension - unreliable

**The Solution (exists but not merged):**
- Commit `bae6ccf` has the fix
- Changes `.mp4` → `.m3u8` for MKV/AVI
- Server transcodes to HLS on-the-fly
- This is a standard Xtream Codes feature

**Why it's not in main:**
- Commit exists in git but is orphaned
- History diverged after this commit
- Need to cherry-pick the fix

**Files affected:** `js/app.js` - playContent() and playEpisode()

### 3. Series Episode URL Structure

**Current code in `xtream-client.js:170`:**
```javascript
buildSeriesUrl(episodeId, extension = 'mp4') {
  return `${this.baseUrl}/series/${this.username}/${this.password}/${episodeId}.${extension}`
}
```

**Expected by Xtream API:**
Some providers use different structures. Need to verify working format.

---

## Files Overview

| File | Purpose | Status |
|------|---------|--------|
| `js/app.js` | Main application logic | OK |
| `js/xtream-client.js` | API client for Starshare | OK |
| `cloudflare-worker.js` | Stream proxy for Live TV | Updated (TransformStream) |
| `api/proxy.js` | API metadata proxy (Vercel) | OK |
| `api/stream.js` | Vercel Edge stream proxy (unused) | Legacy |
| `service-worker.js` | PWA caching | OK |

---

## Recommended Next Steps

### Immediate (Test First)

1. **Test Cloudflare Worker Fix**
   - Clear browser cache
   - Open Live TV channel
   - Monitor console for `MediaSource onSourceEnded`
   - Measure buffer stalls

2. **If Still Buffering:**
   - Increase buffer: `lazyLoadMaxDuration: 60` (1 min)
   - Disable live edge chasing: `liveBufferLatencyChasing: false`

### Short Term

3. **Apply MKV Fix**
   Option A: Cherry-pick commit
   ```bash
   git cherry-pick bae6ccf
   ```

   Option B: Manual fix in app.js
   - In `playContent()`: Change MKV/AVI handling to request `.m3u8`
   - In `playEpisode()`: Same change

4. **Add Bandwidth Detection**
   - Measure download speed on first load
   - Warn users if < 2mbps
   - Suggest SD channels

### Future Considerations

5. **Low Bandwidth Mode**
   - Toggle to increase buffer (sacrifice latency for smoothness)
   - Target: Watchable on 2mbps

6. **HLS Investigation**
   - Starshare HLS endpoint returns empty (confirmed)
   - Server-side transcoding is expensive
   - Current MPEG-TS approach is best available option

---

## Performance Targets

| Metric | Current | Target (Fast) | Target (2mbps) |
|--------|---------|---------------|----------------|
| First frame | ~2000ms | < 2000ms | < 5000ms |
| Buffer stalls | TBD | < 1/min | < 3/min |
| Stall duration | TBD | < 500ms | < 1000ms |

---

## Quick Reference

**Test Live TV:**
```javascript
// In browser console
dashApp.playContent('CHANNEL_ID', 'live')
```

**Clear Cache:**
```javascript
caches.keys().then(k => k.forEach(c => caches.delete(c))); location.reload();
```

**Enable Debug Mode:**
```javascript
window.DASH_DEBUG = true
```

**Deploy Cloudflare Worker:**
```bash
cd /home/dash/zion-github/dash-webtv
npx wrangler deploy
```

---

## Summary

The app is functional but has two main issues:
1. **Live TV buffering** - TransformStream fix deployed, needs testing
2. **MKV content** - Fix exists in git, needs to be merged

Both are solvable with the work already done.
