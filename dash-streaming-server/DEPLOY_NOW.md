# 🚀 DEPLOY NOW - Quick Start Guide

**Execute these commands to go LIVE in 15 minutes!**

---

## ✅ STEP 1: Create GitHub Repository (2 minutes)

### Option A: Via GitHub Website (Easiest)
1. Go to https://github.com/new
2. Repository name: `dash-streaming-server`
3. Description: `DASH WebTV Streaming Server - Universal format support with FFmpeg`
4. Visibility: **Public** (or Private if you prefer)
5. **Do NOT** initialize with README (we already have one)
6. Click "Create repository"

### Option B: Via Command Line (If you have GitHub access)
```bash
# Skip this if you used Option A above
curl -u dashguinee https://api.github.com/user/repos \
  -d '{"name":"dash-streaming-server","description":"DASH WebTV Streaming Server","private":false}'
```

---

## ✅ STEP 2: Push Code to GitHub (1 minute)

```bash
cd /home/dash/zion-github/dash-streaming-server

# Add GitHub remote (replace dashguinee with your username if different)
git remote add origin git@github.com:dashguinee/dash-streaming-server.git

# Push to GitHub
git push -u origin master

# Verify
git remote -v
```

**Expected Output:**
```
Counting objects: 20, done.
Writing objects: 100%
To github.com:dashguinee/dash-streaming-server.git
 * [new branch]      master -> master
```

---

## ✅ STEP 3: Deploy to Railway (5 minutes)

### 3.1 Sign Up / Login to Railway
1. Go to https://railway.app
2. Sign in with GitHub
3. Authorize Railway access

### 3.2 Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Search for `dash-streaming-server`
4. Click on it to deploy

**Railway will automatically:**
- Detect Node.js project
- Install dependencies
- Install FFmpeg (via Dockerfile)
- Deploy the server

### 3.3 Add Redis Database
1. In your Railway project, click **"New"**
2. Select **"Database"**
3. Choose **"Redis"**
4. Railway automatically sets `REDIS_URL` environment variable

### 3.4 Set Environment Variables
1. Click on your service (dash-streaming-server)
2. Go to **"Variables"** tab
3. Add these variables:

```env
NODE_ENV=production
STARSHARE_BASE_URL=https://starshare.cx
STARSHARE_USERNAME=AzizTest1
STARSHARE_PASSWORD=Test1
FFMPEG_THREADS=4
MAX_QUALITY=1080p
DEFAULT_QUALITY=720p
SEGMENT_CACHE_TTL=2592000
METADATA_CACHE_TTL=86400
LIVE_TOKEN_TTL=300
HLS_PLAYLIST_TTL=3600
LOG_LEVEL=info
```

**Note:** `PORT` and `REDIS_URL` are automatically set by Railway - don't add them manually!

### 3.5 Generate Public Domain
1. Go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. You'll get a URL like: `https://dash-streaming-server-production.up.railway.app`

**Copy this URL - you'll need it for frontend integration!**

---

## ✅ STEP 4: Test Endpoints (3 minutes)

Wait for deployment to complete (Railway shows "Deployed ✅"), then test:

### 4.1 Health Check
```bash
# Replace with your actual Railway URL
export BACKEND_URL="https://dash-streaming-server-production.up.railway.app"

curl $BACKEND_URL/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "DASH Streaming Server",
  "version": "1.0.0",
  "redis": true,
  "timestamp": "2025-11-24T..."
}
```

### 4.2 Test Live TV Redirect Resolution
```bash
curl $BACKEND_URL/api/live/8
```

**Expected Response:**
```json
{
  "success": true,
  "streamId": "8",
  "url": "https://live6.ostv.info/.../8?token=...",
  "cached": false,
  "timestamp": 1700000000000,
  "expiresIn": 300
}
```

### 4.3 Test Bandwidth Stats
```bash
curl $BACKEND_URL/api/stats/bandwidth
```

**Expected Response:**
```json
{
  "success": true,
  "totalTrackedContent": 0,
  "topContent": [],
  "cachingStrategy": {
    "segmentTTL": "2592000s (30 days)",
    ...
  }
}
```

**✅ If all tests pass, your backend is LIVE!**

---

## ✅ STEP 5: Integrate Frontend (4 minutes)

### 5.1 Update Vercel Environment Variable
```bash
cd /home/dash/zion-github/dash-webtv

# Set backend URL in Vercel
vercel env add VITE_BACKEND_URL production

# When prompted, enter your Railway URL:
# https://dash-streaming-server-production.up.railway.app
```

### 5.2 Update Frontend Code

Edit `js/xtream-client.js` to use backend for MKV and Live TV:

```javascript
// Around line 50-60
buildStreamUrl(streamId, extension = 'mp4') {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // For MKV files, use backend transcoding
  if (['mkv', 'avi', 'flv'].includes(extension.toLowerCase())) {
    return `${backendUrl}/api/stream/vod/${streamId}?extension=${extension}&quality=720p`;
  }

  // For MP4, direct play from Starshare
  return `${this.streamBaseUrl}/movie/${this.streamUsername}/${this.streamPassword}/${streamId}.${extension}`;
}

// Around line 70-80
async buildLiveStreamUrl(streamId) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Use backend to resolve Live TV redirect
  const response = await fetch(`${backendUrl}/api/live/${streamId}`);
  const data = await response.json();

  if (data.success) {
    return data.url;
  } else {
    throw new Error('Failed to resolve live stream');
  }
}
```

### 5.3 Redeploy Frontend
```bash
git add .
git commit -m "🔗 Integrate backend streaming server

- Use backend for MKV/AVI/FLV transcoding
- Use backend for Live TV redirect resolution
- Enable quality selection
- Backend URL: Railway deployment"

git push

# Vercel auto-deploys on push
```

---

## ✅ STEP 6: End-to-End Testing (5 minutes)

### Test Live TV Quality Selection (MAIN FEATURE!)
1. Go to https://dash-webtv.vercel.app
2. Click **"Live TV"**
3. Click any channel (e.g., Sky Sports)
4. **Verify:** Player has quality selector (⚙️ Settings)
5. **Test:** Switch between 360p, 480p, 720p
6. **Verify:** Smooth playback at each quality

### Test MKV Movie Playback
1. Click **"Movies"**
2. Find "Kabir Singh" (MKV format)
3. Click "Play Now"
4. **Verify:** Movie starts playing (transcoding happens)
5. **Verify:** Quality selector available
6. **Test:** Switch quality mid-playback

### Test MP4 Movie (Direct Play)
1. Find "Mulan" (MP4 format)
2. Click "Play Now"
3. **Verify:** Instant playback (no backend delay)
4. **Verify:** Direct stream from Starshare

---

## ✅ STEP 7: Monitor & Optimize

### Check Railway Metrics
1. Go to Railway dashboard
2. Click your project
3. View **"Metrics"** tab
4. Monitor:
   - CPU usage
   - Memory usage
   - Network (bandwidth)

### Check Bandwidth Stats
```bash
curl $BACKEND_URL/api/stats/bandwidth
```

**Target Metrics:**
- Cache hit rate: >60%
- Bandwidth: <100GB/month (free tier)
- Response time: <3s

---

## 🎉 YOU'RE LIVE!

**Congratulations! Your streaming server is now:**
- ✅ Transcoding MKV/AVI/FLV to HLS
- ✅ Providing Live TV quality selection (360p/480p/720p)
- ✅ Resolving Live TV redirects/tokens
- ✅ Caching aggressively for cost savings
- ✅ Serving unlimited users

---

## 📞 NEXT STEPS

### Announce to Users
```
🎉 DASH WebTV Update!

NEW FEATURES:
✅ ALL video formats now work (MKV, AVI, FLV, MP4)
✅ Live TV quality selection (360p for slow internet!)
✅ Faster playback with smart caching
✅ Better streaming quality

Try it now: https://dash-webtv.vercel.app

🚀 Better than any IPTV app!
```

### Monitor First Week
- Check Railway bandwidth daily
- Monitor user feedback
- Fix any issues quickly
- Optimize caching if needed

### Future Enhancements
- Add Chromecast support
- Add download for offline viewing
- Add watch history
- Add favorites/bookmarks

---

## 🆘 TROUBLESHOOTING

### "FFmpeg not found" Error
- Railway should auto-install FFmpeg from Dockerfile
- Check Railway build logs
- Verify Dockerfile exists in repo

### "Redis connection failed"
- Verify Redis service is running in Railway
- Check `REDIS_URL` is set automatically
- Don't manually set `REDIS_URL` (Railway does it)

### "No redirect location found" (Live TV)
- Token might have expired
- Try `/api/live/:id/refresh` endpoint
- Check Starshare credentials are correct

### High Bandwidth Usage
- Check cache hit rate (`/api/stats/bandwidth`)
- Increase `SEGMENT_CACHE_TTL` to 30 days
- Enable Cloudflare CDN for additional caching

---

**Need Help?** Check logs:
```bash
railway logs --tail
```

---

**Built with 🧠 by ZION SYNAPSE**
**Time to LIVE: ~30 minutes** ⚡
