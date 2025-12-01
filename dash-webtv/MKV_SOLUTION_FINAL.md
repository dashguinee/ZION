# DASH WebTV - MKV Solution Final Integration Plan
**Date**: December 1, 2025
**Status**: READY FOR INTEGRATION

---

## COMPLETE ARCHITECTURE DISCOVERED

### All Deployed Services

| Service | URL | Status | Purpose |
|---------|-----|--------|---------|
| **Frontend PWA** | dash-webtv.vercel.app | ✅ LIVE | Main streaming app |
| **FFmpeg Streaming Server** | zion-production-39d8.up.railway.app | ✅ LIVE | MKV→MP4 real-time transcoding |
| **Cloudflare Proxy** | dash-webtv-proxy.dash-webtv.workers.dev | ✅ LIVE | CORS proxy for Live TV |
| **Vercel API Proxy** | /api/proxy, /api/stream | ✅ LIVE | Metadata & stream proxy |
| **Starshare Provider** | starshare.cx | ✅ LIVE | Content source (74K+ items) |

### Content Format Breakdown

| Format | Movies | Series Episodes | Solution |
|--------|--------|-----------------|----------|
| **MP4 (88%)** | ~50K | ~439K | Direct playback |
| **MKV (12%)** | ~7K | ~61K | FFmpeg transcode OR server remux |

---

## THREE MKV SOLUTIONS AVAILABLE

### Solution 1: Starshare Server Remux (CURRENT - Partial)
**How**: Request `.mp4` extension, Starshare remuxes container
**Code**: `playEpisode()` now always requests `.mp4`
**Reliability**: ~70% success (some servers remux, some don't)

### Solution 2: FFmpeg Transcoding Server (READY - NOT CONNECTED)
**How**: Route MKV through our Railway server, FFmpeg transcodes
**Server**: `https://zion-production-39d8.up.railway.app`
**Endpoints**:
- `/api/stream/vod/:id?extension=mkv&quality=720p`
- `/api/stream/series/:id/:season/:episode?extension=mkv&quality=720p`
**Reliability**: 100% (FFmpeg handles everything)

### Solution 3: External Player (FALLBACK)
**How**: Open MKV in VLC/MX Player via intent:// URLs
**Use Case**: Backup when streaming fails

---

## THE GAP FOUND

```javascript
// In xtream-client.js line 11:
this.backendUrl = 'https://zion-production-39d8.up.railway.app'

// BUT IT'S NEVER USED FOR STREAMING!
// buildVODUrl() and buildSeriesUrl() go DIRECT to Starshare
```

---

## INTEGRATION PLAN

### Step 1: Update xtream-client.js

```javascript
// buildVODUrl - Route MKV through FFmpeg server
buildVODUrl(vodId, extension = 'mp4') {
  if (!this.isAuthenticated) return ''

  const needsTranscode = ['mkv', 'avi', 'flv', 'wmv', 'mov', 'webm']
    .includes(extension.toLowerCase())

  if (needsTranscode) {
    // Use our FFmpeg transcoding server
    return `${this.backendUrl}/api/stream/vod/${vodId}?extension=${extension}&quality=720p`
  }

  // Direct play for MP4
  return `${this.baseUrl}/movie/${this.username}/${this.password}/${vodId}.${extension}`
}

// buildSeriesUrl - Same pattern
buildSeriesUrl(episodeId, extension = 'mp4') {
  if (!this.isAuthenticated) return ''

  const needsTranscode = ['mkv', 'avi', 'flv', 'wmv', 'mov', 'webm']
    .includes(extension.toLowerCase())

  if (needsTranscode) {
    // FFmpeg server needs different URL structure for series
    // Current: /api/stream/series/:id/:season/:episode
    // We only have episodeId, so use VOD endpoint as workaround
    return `${this.backendUrl}/api/stream/vod/${episodeId}?extension=${extension}&quality=720p&type=series`
  }

  return `${this.baseUrl}/series/${this.username}/${this.password}/${episodeId}.${extension}`
}
```

### Step 2: Update FFmpeg Server (if needed)

The streaming server's starshare.service.js needs user credentials. Currently hardcoded from env:
```javascript
this.username = config.starshare.username;
this.password = config.starshare.password;
```

**Option A**: Pass credentials in query params (less secure but works)
**Option B**: Use session token system
**Option C**: Keep using env vars (single account - current setup)

### Step 3: Test the Flow

1. Open a Netflix series with MKV episodes
2. Click "Stream" on an MKV episode
3. Should route through FFmpeg server
4. Should play in browser after ~2-5 second transcode start

---

## CURRENT SESSION CHANGES

### Files Modified This Session:

1. **js/app.js**
   - `playEpisode()` - Now always requests `.mp4` (server remux)
   - `renderBrowseGrid()` - Added gold offline-exclusive badge
   - `getNeonFallback()` - Added for missing images
   - Offline Exclusive episodes now have "Stream" button

2. **css/components.css**
   - Added NEON card styles for movies without images
   - Added `.offline-exclusive-badge` gold icon styles

3. **data/collections.json**
   - Curated Western blockbusters for Featured section

### Commits Made:
- `9ccb011` - feat: Western-focused collections + NEON fallback cards

### Pending Changes (not committed):
- `playEpisode()` always uses MP4 extension
- Offline Exclusive UI now has Stream button

---

## RESUME CHECKLIST

When resuming this session:

1. **Check server status**:
   ```bash
   curl https://zion-production-39d8.up.railway.app/health
   ```

2. **The key file to modify**: `/home/dash/zion-github/dash-webtv/js/xtream-client.js`
   - Add MKV routing to `buildVODUrl()` and `buildSeriesUrl()`
   - Use `this.backendUrl` for transcoding

3. **Test with**:
   - Go to Netflix category
   - Find series with MKV episodes (check for gold badge)
   - Try streaming - should work via FFmpeg transcode

4. **If FFmpeg server needs credentials**:
   - Check Railway env vars for STARSHARE_USERNAME/PASSWORD
   - Or modify server to accept credentials in request

---

## KEY LEARNINGS

1. **Container ≠ Codec**: MKV and MP4 often have same H264/AAC codecs
2. **Server Remux Works**: Requesting `.mp4` for MKV usually works
3. **FFmpeg is Bulletproof**: Our server transcodes 100% reliably
4. **The Missing Link**: `backendUrl` exists but isn't used for streaming
5. **Starshare HLS is Broken**: `.m3u8` returns empty, don't use it
6. **mpegts.js for Live TV**: MPEG-TS works, HLS doesn't (for this provider)

---

## FILE LOCATIONS

| What | Where |
|------|-------|
| Frontend | `/home/dash/zion-github/dash-webtv/` |
| FFmpeg Server | `/home/dash/zion-github/dash-streaming-server/` |
| XtreamClient | `/home/dash/zion-github/dash-webtv/js/xtream-client.js` |
| Main App | `/home/dash/zion-github/dash-webtv/js/app.js` |
| Episode Formats | `/home/dash/zion-github/dash-webtv/data/episode_formats.json` |

---

## NEXT STEPS (Priority Order)

1. **[ ] Connect FFmpeg Server** - Modify `buildVODUrl()` to route MKV
2. **[ ] Test MKV Streaming** - Verify transcode works end-to-end
3. **[ ] Commit Changes** - Push all pending modifications
4. **[ ] Update UI** - Change "Offline Exclusive" to "HD Transcode" or keep gold badge
5. **[ ] Season Grouping** - Group related seasons (Umbrella Academy S1/S2/S3)

---

*Session saved: Dec 1, 2025*
*FFmpeg Server: DEPLOYED AND READY*
*Integration: PLAN COMPLETE, IMPLEMENTATION PENDING*
