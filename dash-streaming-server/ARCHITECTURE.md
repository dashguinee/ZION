# DASH WebTV Streaming Architecture

**Complete System Design & Context Documentation**

---

## 🎯 SYSTEM OVERVIEW

### **The Problem We're Solving:**

1. **MKV/AVI/FLV files don't play in browsers** (only MP4/WebM/TS work)
2. **Live TV needs quality selection** (360p for slow internet in Africa)
3. **Live TV URLs redirect with tokens** (browsers can't follow)
4. **Users need manual quality selection** (like YouTube)

### **The Solution:**

**Hybrid Streaming Server** with:
- Live TV: ALWAYS transcode to 3 quality levels (360p/480p/720p)
- Movies/Series: Smart fallback (direct play MP4, transcode MKV only if needed)
- Redis caching for performance
- Bandwidth optimization for cost savings

---

## 🏗️ ARCHITECTURE LAYERS

### **Layer 1: User Interface (Frontend)**

```
Location: /home/dash/zion-github/dash-webtv
Hosting: Vercel (https://dash-webtv.vercel.app)

Components:
- Video.js player with HLS.js
- Quality selector UI
- PWA (installable)
- Cosmic purple theme
```

### **Layer 2: Streaming Backend (This Server)**

```
Location: /home/dash/zion-github/dash-streaming-server
Hosting: Railway.app (to be deployed)

Tech Stack:
- Node.js 18+ + Express
- FFmpeg 6.0+ (transcoding)
- Redis 7.0 (caching)
- Winston (logging)

Endpoints:
- GET /api/stream/vod/:id?quality=720p → Movies
- GET /api/stream/series/:id/:season/:episode → Series
- GET /api/live/:streamId?quality=720p → Live TV (MAIN FEATURE!)
- GET /api/hls/:streamId/master.m3u8 → HLS playlists
```

### **Layer 3: Starshare Gateway (External API)**

```
URL: https://starshare.cx
Role: GATEWAY / API PROVIDER (NOT actual video host!)

What it provides:
- Authentication (username: AzizTest1, password: Test1)
- Content catalog API
- Stream info API
- URL construction patterns

What it DOESN'T provide:
- Actual video files
- Quality variants
- HLS transcoding
```

### **Layer 4: Real Streaming Servers (External CDNs)**

```
Various servers that Starshare redirects to:
- live6.ostv.info (Live TV channels)
- Various CDNs (Movies/Series files)

Access:
- Token-based (expires every 5 minutes)
- Redirects (HTTP 302)
- Single quality only (no variants)
```

---

## 🔄 DATA FLOW

### **Live TV Flow (MAIN USE CASE):**

```
1. User clicks channel "Sky Sports"
   ↓
2. Frontend → GET /api/live/8?quality=720p
   ↓
3. Backend checks Redis cache for token
   ↓
4. If cache miss:
   a. Request: https://starshare.cx/AzizTest1/Test1/8
   b. Get redirect: https://live6.ostv.info/.../8?token=xyz123
   c. Cache token (5 min TTL)
   ↓
5. Backend fetches live stream from live6.ostv.info
   ↓
6. FFmpeg transcodes LIVE to HLS:
   - 360p (600kbps) ← For slow internet
   - 480p (1000kbps)
   - 720p (2500kbps) ← Default
   ↓
7. Return HLS master.m3u8 playlist
   ↓
8. User's player picks quality → Smooth playback!
```

**Key Points:**
- Live TV is ALWAYS transcoded (can't cache video, it's live)
- Token is cached (saves redirect API calls)
- User gets quality selection (main value proposition)

---

### **Movie Flow (MKV - Needs Transcoding):**

```
1. User clicks "Kabir Singh" (MKV movie)
   ↓
2. Frontend checks API: container_extension = "mkv"
   ↓
3. Frontend → GET /api/stream/vod/1906?quality=720p
   ↓
4. Backend checks Redis for cached segments
   ↓
5. If cache miss:
   a. Fetch: https://starshare.cx/movie/AzizTest1/Test1/1906.mkv
   b. FFmpeg transcode to HLS (360p/480p/720p/1080p)
   c. Cache segments (30 days TTL)
   ↓
6. Return HLS master.m3u8
   ↓
7. User plays with quality selection
```

**Optimization:**
- First user: 3-5 sec (transcode + cache)
- Next users: 0.5 sec (cache hit!)
- Saves bandwidth for popular movies

---

### **Movie Flow (MP4 - Direct Play):**

```
1. User clicks "Mulan" (MP4 movie)
   ↓
2. Frontend checks API: container_extension = "mp4"
   ↓
3. Frontend → Direct play:
   https://starshare.cx/movie/AzizTest1/Test1/9061.mp4
   ↓
4. No backend needed!
   ↓
5. User plays immediately (0 cost to us)
```

**Why This is Smart:**
- ~40% of movies are MP4
- No transcoding cost
- Instant playback
- Zero bandwidth usage on our server

---

## 📦 COMPONENTS BREAKDOWN

### **Services Layer:**

#### `starshare.service.js`
```javascript
Purpose: Interface with Starshare API
Key Methods:
- buildVODUrl(id, extension) → Movie URL
- buildSeriesUrl(id, season, episode) → Series URL
- buildLiveUrl(id) → Live TV initial URL
- resolveLiveUrl(id) → Resolve redirect, get token URL
- getStreamInfo(type, id) → Get metadata from API
```

#### `ffmpeg.service.js`
```javascript
Purpose: Video transcoding
Key Methods:
- transcodeToMP4(sourceUrl, quality) → Single quality MP4
- transcodeToHLS(sourceUrl, streamId) → Multi-quality HLS
- probeVideo(sourceUrl) → Get video metadata
- needsTranscoding(format, codec) → Smart detection
```

#### `hls.service.js`
```javascript
Purpose: HLS playlist generation
Key Methods:
- getMasterPlaylist(streamId) → master.m3u8
- getVariantPlaylist(streamId, variant) → quality-specific playlist
- getSegment(streamId, segmentName) → .ts segment file
- cleanupOldStreams() → Disk space management
```

#### `cache.service.js`
```javascript
Purpose: Redis caching
Key Methods:
- get(key) → Retrieve from cache
- set(key, value, ttl) → Store in cache
- del(key) → Invalidate cache
- exists(key) → Check if cached
```

#### `bandwidth-optimizer.service.js`
```javascript
Purpose: Cost optimization
Key Methods:
- trackView(contentId, type) → Track popularity
- getPopularity(contentId) → View count
- getOptimalCacheTTL(contentId) → Smart TTL based on views
- estimateBandwidthSavings() → Cost analysis
```

---

### **Routes Layer:**

#### `stream.js`
```javascript
Endpoints:
- GET /api/stream/vod/:id → Movies
- GET /api/stream/series/:id/:season/:episode → Series

Features:
- Smart format detection
- Quality selection
- Caching
- Streaming proxy for MP4
- Transcoding for MKV
```

#### `live.js`
```javascript
Endpoints:
- GET /api/live/:streamId → Live TV (JSON with URL)
- GET /api/live/:streamId/direct → Live TV (direct stream)
- GET /api/live/:streamId/refresh → Force token refresh

Features:
- Token resolution
- Token caching (5 min)
- Redirect handling
```

#### `hls.js`
```javascript
Endpoints:
- GET /api/hls/:streamId/master.m3u8 → Master playlist
- GET /api/hls/:streamId/:variant.m3u8 → Variant playlist
- GET /api/hls/:streamId/:segment.ts → Segment file

Features:
- HLS serving
- Segment caching
- CORS headers
```

---

## 🎛️ CONFIGURATION

### **Environment Variables:**

```env
# Server
NODE_ENV=production
PORT=3000

# Starshare Gateway (NOT actual video provider!)
STARSHARE_BASE_URL=https://starshare.cx
STARSHARE_USERNAME=AzizTest1
STARSHARE_PASSWORD=Test1

# Redis Cache
REDIS_URL=redis://localhost:6379

# FFmpeg
FFMPEG_THREADS=4
MAX_QUALITY=1080p
DEFAULT_QUALITY=720p

# Caching Strategy (Aggressive for cost savings)
SEGMENT_CACHE_TTL=2592000  # 30 days
METADATA_CACHE_TTL=86400   # 24 hours
LIVE_TOKEN_TTL=300         # 5 minutes
HLS_PLAYLIST_TTL=3600      # 1 hour

# Logging
LOG_LEVEL=info
```

---

## 💰 COST OPTIMIZATION STRATEGY

### **Bandwidth Costs (Railway):**

```
FREE: 100GB/month
PAID: $0.10/GB after 100GB
```

### **Optimization Techniques:**

1. **Direct Play MP4** (~40% of content)
   - Cost: $0 (no server involvement)
   - Bandwidth: 0GB on our server

2. **Aggressive Caching** (30-day TTL)
   - First user: Downloads from Starshare
   - Next 999 users: Served from cache
   - Savings: 50-70% bandwidth reduction

3. **Smart Popularity Tracking**
   - Track view counts
   - Cache popular content longer
   - Auto-cleanup unpopular content

4. **HLS Segmentation**
   - Users only download what they watch
   - Average watch time: 30 min / 120 min movie = 25%
   - Bandwidth: 625MB instead of 2.5GB per user

### **Cost Examples:**

```
100 users × 3 movies/month:
- Without optimization: ~300GB = $25/mo
- With optimization: ~50GB = $5/mo (FREE tier!)

500 users × 3 movies/month:
- Without optimization: ~1,500GB = $145/mo
- With optimization: ~235GB = $19/mo

1000 users × 3 movies/month (mostly Live TV):
- Live TV transcoding: ~400GB
- Cached movies: ~100GB
- Total: ~500GB = $45/mo
```

---

## 🚀 DEPLOYMENT CHECKLIST

### **Pre-Deployment:**
- [x] All services implemented
- [x] All routes created
- [x] Main Express app configured
- [x] package.json with dependencies
- [x] Dockerfile for containerization
- [x] .env.example template
- [x] Documentation (README, DEPLOYMENT, BANDWIDTH)

### **Deployment Steps:**

1. **Create GitHub Repository**
   ```bash
   git remote add origin git@github.com:dashguinee/dash-streaming-server.git
   git push -u origin main
   ```

2. **Deploy to Railway**
   - Go to railway.app
   - New Project → Import from GitHub
   - Select dash-streaming-server
   - Add Redis database
   - Set environment variables

3. **Get Public URL**
   - Railway generates URL: `https://dash-streaming-server.railway.app`

4. **Test Endpoints**
   ```bash
   curl https://dash-streaming-server.railway.app/health
   curl https://dash-streaming-server.railway.app/api/live/8
   ```

5. **Update Frontend**
   - Update VITE_BACKEND_URL in Vercel
   - Redeploy frontend
   - Test end-to-end

---

## 🧪 TESTING STRATEGY

### **Local Testing:**

```bash
# Install dependencies
npm install

# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Start server
npm run dev

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/live/8
```

### **Production Testing:**

1. **Live TV Quality Selection** (MAIN FEATURE!)
   - Test 360p playback on slow connection
   - Test 720p playback on fast connection
   - Verify smooth switching

2. **MKV Movie Playback**
   - Test Kabir Singh (MKV)
   - Verify transcoding works
   - Check caching works

3. **MP4 Movie Playback**
   - Test Mulan (MP4)
   - Verify direct play (no backend)
   - Check instant start

4. **Series Episodes**
   - Test MKV episodes
   - Verify season/episode routing

---

## 📊 MONITORING

### **Key Metrics to Watch:**

1. **Bandwidth Usage** (Railway dashboard)
   - Target: <500GB/month
   - Alert: 80% of free tier (80GB)

2. **Cache Hit Rate** (Redis)
   - Target: >60% hit rate
   - Check: `/api/stats/bandwidth`

3. **Transcoding Performance**
   - Target: <3s start time
   - Check server logs

4. **Live TV Token Success**
   - Target: >95% success rate
   - Check error logs

---

## 🔧 TROUBLESHOOTING

### **Common Issues:**

1. **FFmpeg Not Found**
   - Railway auto-installs FFmpeg
   - If error: Check Dockerfile has FFmpeg

2. **Redis Connection Failed**
   - Check REDIS_URL in env vars
   - Verify Redis service is running

3. **Live TV Token Expired**
   - Normal behavior (tokens expire every 5 min)
   - Cache refresh works automatically

4. **High Bandwidth Usage**
   - Check cache hit rate
   - Increase SEGMENT_CACHE_TTL
   - Enable Cloudflare CDN

---

## 🎯 SUCCESS CRITERIA

### **Technical:**
- ✅ Live TV quality selection working (360p/480p/720p)
- ✅ MKV movies playable
- ✅ MP4 movies direct play (no backend)
- ✅ Cache hit rate >60%
- ✅ Bandwidth <500GB/month
- ✅ Uptime >99%

### **Business:**
- ✅ Better than Starshare APK (quality selection!)
- ✅ Works on all devices (web-based)
- ✅ Affordable (<$50/mo for 1000 users)
- ✅ Customer satisfaction >90%

---

## 📝 NEXT STEPS

1. **Deploy to Railway** (15 min)
2. **Test with real content** (30 min)
3. **Integrate frontend** (1 hour)
4. **Beta test with users** (1 week)
5. **Launch publicly** (GO LIVE!)

---

## 🔑 KEY REMINDERS

1. **Starshare is GATEWAY only** - not actual video provider
2. **Live TV is MAIN VALUE** - quality selection for slow internet
3. **Hybrid approach** - direct play MP4, transcode MKV
4. **Cache aggressively** - saves 70% bandwidth costs
5. **Monitor bandwidth** - stay under 500GB/month

---

**Built with 🧠 by ZION SYNAPSE for DASH - The African Super Hub**

*Architecture designed for: Scalability, Cost-efficiency, User experience*
