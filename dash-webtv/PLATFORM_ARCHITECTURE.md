# DASH WebTV - Complete Platform Architecture
**Last Updated**: December 1, 2025
**Author**: ZION SYNAPSE + DASH
**Purpose**: Complete reference for any future AI instance working on this project

---

## OVERVIEW

DASH WebTV is a Netflix-style streaming PWA that plays content from Xtream Codes IPTV providers. It handles 74,000+ pieces of content including movies, series, and live TV.

**Live URL**: https://dash-webtv.vercel.app

---

## CONTENT BREAKDOWN

| Type | Count | Format Distribution |
|------|-------|---------------------|
| Movies | 57,828 | 88% MP4, 12% MKV |
| Series | 14,000+ | 87% MP4 episodes, 13% MKV |
| Series Episodes | 500,022 | 439,326 MP4, 60,696 MKV |
| Live TV | 215 channels | MPEG-TS streams |

**Key Insight**: MKV files usually contain the SAME codecs as MP4 (H264 video, AAC audio). The difference is just the container wrapper. Browsers can't read MKV containers, but can play the same content in MP4 containers.

---

## ALL DEPLOYED SERVICES

### 1. Frontend PWA (Vercel)
- **URL**: https://dash-webtv.vercel.app
- **Source**: `/home/dash/zion-github/dash-webtv/`
- **Stack**: Vanilla JS, CSS, HTML (no framework)
- **Key Files**:
  - `js/app.js` - Main application logic (~2800 lines)
  - `js/xtream-client.js` - API client for Xtream Codes
  - `js/pwa.js` - PWA install handling
  - `css/components.css` - All styling
  - `index.html` - Single page app shell

### 2. FFmpeg Streaming Server (Railway)
- **URL**: https://zion-production-39d8.up.railway.app
- **Source**: `/home/dash/zion-github/dash-streaming-server/`
- **Stack**: Node.js + Express + FFmpeg + Redis
- **Purpose**: Real-time MKV→MP4 transcoding
- **Endpoints**:
  ```
  GET /health - Health check
  GET /api/stream/vod/:id?extension=mkv&quality=720p - Movie transcoding
  GET /api/stream/series/:id/:season/:episode?extension=mkv - Series transcoding
  GET /api/live/:streamId - Live TV token resolution
  GET /api/hls/:streamId/master.m3u8 - HLS adaptive streaming
  ```
- **Status**: DEPLOYED AND RUNNING but NOT CONNECTED to frontend!

### 3. Cloudflare Worker Proxy
- **URL**: https://dash-webtv-proxy.dash-webtv.workers.dev
- **Source**: `/home/dash/zion-github/dash-webtv/cloudflare-worker.js`
- **Purpose**: CORS proxy for Live TV MPEG-TS streams
- **Why Needed**: Live streams have no CORS headers, browsers block them

### 4. Vercel API Routes
- **URLs**: `/api/proxy`, `/api/stream`
- **Source**: `/home/dash/zion-github/dash-webtv/api/`
- **Purpose**:
  - `/api/proxy` - Proxy metadata API calls to Starshare
  - `/api/stream` - Fallback stream proxy if Cloudflare fails

### 5. Content Provider (Starshare)
- **URL**: https://starshare.cx
- **Type**: Xtream Codes IPTV provider
- **Auth**: Username/password in URL path
- **URL Patterns**:
  ```
  Movies:  /movie/{user}/{pass}/{id}.{ext}
  Series:  /series/{user}/{pass}/{episodeId}.{ext}
  Live TV: /live/{user}/{pass}/{channelId}.ts
  API:     /player_api.php?username={user}&password={pass}&action={action}
  ```

---

## PLAYBACK ARCHITECTURE

### Movies & Series (MP4)
```
User clicks Play
  → app.js: playContent() or playEpisode()
  → xtream-client.js: buildVODUrl() or buildSeriesUrl()
  → Direct URL: https://starshare.cx/movie/{user}/{pass}/{id}.mp4
  → Browser plays natively via <video> element
```

### Movies & Series (MKV) - CURRENT (Partial Solution)
```
User clicks Play
  → app.js: playContent() or playEpisode()
  → Always request .mp4 extension (server remux)
  → URL: https://starshare.cx/movie/{user}/{pass}/{id}.mp4
  → Starshare MAY remux MKV→MP4 (works ~70% of time)
```

### Movies & Series (MKV) - IDEAL (FFmpeg Server)
```
User clicks Play
  → Detect MKV format
  → Route to FFmpeg server: https://zion-production-39d8.up.railway.app/api/stream/vod/{id}?extension=mkv
  → FFmpeg transcodes MKV→MP4 in real-time
  → Browser plays transcoded stream (100% reliable)
```

### Live TV (iOS/Safari)
```
User clicks Play
  → xtream-client.js: buildLiveStreamUrl()
  → Detect native HLS support (Safari/iOS)
  → Direct HLS URL: https://starshare.cx/live/{user}/{pass}/{id}.m3u8
  → Browser plays natively (no proxy needed)
```

### Live TV (Android/Windows/Linux)
```
User clicks Play
  → xtream-client.js: buildLiveStreamUrl()
  → No native HLS, need MPEG-TS
  → Proxy URL: https://dash-webtv-proxy.workers.dev/?url={encoded_ts_url}
  → Cloudflare adds CORS headers
  → mpegts.js library decodes MPEG-TS in browser
  → Transmuxed to MP4 fragments for MediaSource API
```

---

## MKV SOLUTIONS - COMPLETE HISTORY

### Attempt 1: Request .mp4 Extension (Partial)
- **Commit**: `881b01a`
- **Result**: Some worked, some didn't

### Attempt 2: Block MKV Entirely
- **Commit**: `7fbaf59`
- **Result**: Too aggressive, bad UX

### Attempt 3: HLS Transcode (.m3u8)
- **Commits**: `bae6ccf`, `472ed0a`, `e18639a`
- **Result**: FAILED - Starshare returns empty .m3u8 files

### Attempt 4: Server Remux (Current)
- **Commit**: `d3bbfbd`
- **How**: Request .mp4, Starshare remuxes container
- **Result**: ~70% success rate

### Attempt 5: FFmpeg Transcoding Server
- **Commit**: `efe8fe2`
- **How**: Our own server with FFmpeg
- **Result**: 100% reliable but NOT CONNECTED to frontend!

### Attempt 6: External Player Fallback
- **Commit**: `0dace90`
- **How**: Open in VLC/MX Player via intent:// URLs
- **Result**: Works but not in-browser

---

## THE CRITICAL GAP

In `xtream-client.js`:
```javascript
// Line 11 - THIS EXISTS:
this.backendUrl = 'https://zion-production-39d8.up.railway.app'

// BUT IT'S NEVER USED IN:
buildVODUrl()      // Goes direct to Starshare
buildSeriesUrl()   // Goes direct to Starshare
```

**The FFmpeg server is deployed and running but the frontend doesn't route any traffic to it!**

---

## KEY FILES REFERENCE

### /js/app.js - Main Application

**Important Methods**:
| Method | Line | Purpose |
|--------|------|---------|
| `init()` | ~87 | App initialization |
| `renderHomePage()` | ~400 | Netflix-style home with collections |
| `renderBrowseGrid()` | ~1134 | Movie/series card grid |
| `showDetails()` | ~1330 | Modal with play options |
| `playContent()` | ~1518 | Play movies |
| `playEpisode()` | ~1563 | Play series episodes |
| `playLiveChannel()` | ~1548 | Play live TV |
| `showVideoPlayer()` | ~2088 | Video player with mpegts.js/HLS.js |
| `renderDownloadsPage()` | ~1870 | Download library UI |

**Key State**:
```javascript
this.state = {
  currentPage: 'home',
  isAuthenticated: false,
  categories: { vod: [], series: [], live: [] },
  content: { movies: [], series: [], liveTV: [] },
  favorites: [],
  watchHistory: []
}
```

### /js/xtream-client.js - API Client

**Important Methods**:
| Method | Purpose |
|--------|---------|
| `setCredentials()` | Store user/pass after login |
| `buildPlayerApiUrl()` | Build API URLs for metadata |
| `buildVODUrl()` | Build movie stream URL |
| `buildSeriesUrl()` | Build episode stream URL |
| `buildLiveStreamUrl()` | Build live TV URL (with proxy logic) |
| `hasNativeHLS()` | Detect Safari/iOS for native HLS |

**Proxy System**:
```javascript
this.proxyList = [
  { name: 'Cloudflare', url: 'https://dash-webtv-proxy.dash-webtv.workers.dev', param: 'url' },
  { name: 'Vercel Edge', url: '/api/stream', param: 'url' }
]
```

### /data/ - Pre-cached Content Data

| File | Purpose |
|------|---------|
| `movies.json` | All 57K movies with metadata |
| `series.json` | All 14K series with metadata |
| `live.json` | All live TV channels |
| `collections.json` | Curated collections for home page |
| `episode_formats.json` | MKV vs MP4 for 500K episodes |
| `category_formats.json` | Format breakdown by category |
| `vod_categories.json` | Movie categories |
| `series_categories.json` | Series categories |

---

## LIVE TV SPECIFIC LEARNINGS

### mpegts.js Configuration (CRITICAL)
```javascript
{
  type: 'mse',
  isLive: true,
  enableWorker: true,
  enableStashBuffer: true,
  stashInitialSize: 2 * 1024 * 1024,  // 2MB
  lazyLoad: false,  // CRITICAL! true causes stream loops
  lazyLoadMaxDuration: 30,
  liveBufferLatencyChasing: true,
  liveBufferLatencyMaxLatency: 60,
  liveSyncMaxLatency: 90,
  liveSyncPlaybackRate: 1.01,
  deferLoadAfterSourceOpen: false
}
```

**THE LAZYLOAD BUG**: `lazyLoad: true` aborts HTTP connections when buffered enough. For LIVE streams, this kills the continuous data flow and causes looping!

### Why MPEG-TS not HLS?
- HLS (.m3u8) from Starshare returns `content-length: 0` (empty!)
- MPEG-TS (.ts) returns actual video data
- mpegts.js transmuxes MPEG-TS to MP4 fragments in browser

---

## OFFLINE EXCLUSIVE FEATURE

**The Business Flip**: MKV content that can't stream is marketed as "Offline Exclusive" with unlimited downloads.

| Badge | Color | Meaning | Reality |
|-------|-------|---------|---------|
| `OFFLINE EXCLUSIVE` | Gold | Premium download content | Can't stream MKV |
| `STREAM FIRST` | Green | Stream + limited download | Normal MP4 |

**Current Implementation**:
- Gold badge on MKV episodes
- "Stream" button tries server remux
- "Download" button saves to device
- Download Library tracks all downloads

---

## ENVIRONMENT & DEPLOYMENT

### Local Development
```bash
cd /home/dash/zion-github/dash-webtv
npx serve -l 3006
```

### Vercel Deployment
- Auto-deploys from GitHub main branch
- Environment: Production
- Domain: dash-webtv.vercel.app

### Railway (FFmpeg Server)
- URL: zion-production-39d8.up.railway.app
- Needs env vars: STARSHARE_USERNAME, STARSHARE_PASSWORD, REDIS_URL
- Has Redis for caching

---

## COMMON ISSUES & SOLUTIONS

### Issue: MKV won't play
**Solution**: Request .mp4 extension (server remux) OR route through FFmpeg server

### Issue: Live TV loops/repeats
**Solution**: Set `lazyLoad: false` in mpegts.js config

### Issue: Live TV won't load (CORS)
**Solution**: Use Cloudflare proxy for MPEG-TS streams

### Issue: No poster images
**Solution**: NEON gradient cards with title/year as fallback

### Issue: HLS returns empty
**Solution**: Don't use .m3u8 for this provider, use .ts with mpegts.js

---

## NEXT STEPS FOR FUTURE INSTANCES

1. **Connect FFmpeg Server**: Modify `xtream-client.js` to route MKV through `this.backendUrl`

2. **Test End-to-End**: Verify FFmpeg transcoding works for both movies and series

3. **Season Grouping**: Group related seasons (e.g., Umbrella Academy S1/S2/S3/S4)

4. **Remove Duplicates**: Filter out Hindi/Malayalam versions from Western collections

5. **Quality Selection**: Add UI to choose 360p/480p/720p/1080p from FFmpeg server

---

## GIT HISTORY (Key Commits)

| Commit | Description |
|--------|-------------|
| `d614d9f` | MKV server remux + FFmpeg integration plan |
| `9ccb011` | Western-focused collections + NEON fallback cards |
| `2f2297c` | Offline Exclusive download system + Download Library |
| `d3bbfbd` | Fix series/MKV - always request MP4 (server remuxes) |
| `a502ae3` | lazyLoad bug fix for live streaming |
| `6442a42` | PERFECTION MODE - streaming optimization |
| `2faa060` | BREAKTHROUGH - mpegts.js for Live TV |
| `efe8fe2` | Add DASH Streaming Server (FFmpeg) |

---

*This document should give any future instance complete context to continue development.*
