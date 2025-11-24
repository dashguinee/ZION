# DASH Streaming Server 🎬

**Universal video format support for DASH WebTV** - Powered by FFmpeg, Redis, and Node.js

This server solves the MKV/AVI/FLV playback problem in browsers by providing real-time transcoding to MP4 or HLS adaptive streaming.

## 🚀 Features

- **Universal Format Support**: MKV, AVI, FLV, MP4, WebM - all work seamlessly
- **Adaptive Bitrate Streaming**: HLS support with automatic quality switching
- **Manual Quality Selection**: Choose from 360p, 480p, 720p, 1080p
- **Live TV Support**: Handles redirect-based token authentication
- **Smart Caching**: Redis-powered caching for faster repeat playback
- **Multi-User**: Single server serves unlimited users with shared credentials
- **Production Ready**: Built for Railway deployment with automatic scaling

## 🏗️ Architecture

```
Users → Backend Server (FFmpeg + Redis) → Starshare.cx
        ↓
        - Transcode MKV/AVI/FLV → MP4/HLS
        - Cache segments for faster playback
        - Resolve Live TV tokens
        - Serve multiple quality levels
```

## 📋 Requirements

- **Node.js**: 18+
- **FFmpeg**: 4.0+ (installed automatically on Railway)
- **Redis**: For caching (Railway provides this)
- **Starshare Account**: Credentials configured in `.env`

## 🛠️ Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your Starshare credentials:

```env
STARSHARE_USERNAME=AzizTest1
STARSHARE_PASSWORD=Test1
REDIS_URL=redis://localhost:6379
```

### 3. Start Redis (Docker)

```bash
docker run -d -p 6379:6379 redis:alpine
```

### 4. Run Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:3000`

## 📡 API Endpoints

### Movies (VOD)

```
GET /api/stream/vod/:id?quality=720p&format=mp4

Query Parameters:
- quality: 360p, 480p, 720p, 1080p (default: 720p)
- format: mp4, hls (default: mp4)
- extension: Original file extension (default: mp4)

Example:
GET /api/stream/vod/12345?quality=1080p&format=mp4
```

### Series

```
GET /api/stream/series/:id/:season/:episode?quality=720p&format=mp4

Parameters:
- id: Series ID
- season: Season number
- episode: Episode number
- quality: 360p, 480p, 720p, 1080p (default: 720p)
- format: mp4, hls (default: mp4)

Example:
GET /api/stream/series/67890/1/5?quality=720p&format=mp4
```

### Live TV

```
GET /api/live/:streamId

Returns JSON with resolved streaming URL:
{
  "success": true,
  "streamId": "8",
  "url": "https://streaming-server.com/path/with/token",
  "cached": false,
  "timestamp": 1701234567890,
  "expiresIn": 300
}

Direct Proxy:
GET /api/live/:streamId/direct
```

### HLS Playlists

```
GET /api/hls/:streamId/master.m3u8
GET /api/hls/:streamId/playlist_0.m3u8
GET /api/hls/:streamId/segment_001.ts
```

### Health Check

```
GET /health

Response:
{
  "status": "ok",
  "service": "DASH Streaming Server",
  "version": "1.0.0",
  "redis": true,
  "timestamp": "2025-11-24T..."
}
```

## 🚢 Railway Deployment

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init
```

### 2. Add Redis

In Railway dashboard:
1. Click "New" → "Database" → "Redis"
2. Railway automatically sets `REDIS_URL` environment variable

### 3. Configure Environment

In Railway dashboard, add these variables:

```
NODE_ENV=production
PORT=3000
STARSHARE_BASE_URL=https://starshare.cx
STARSHARE_USERNAME=AzizTest1
STARSHARE_PASSWORD=Test1
LOG_LEVEL=info
```

### 4. Deploy

```bash
# Deploy to Railway
railway up

# Or connect to GitHub
railway link
git push
```

### 5. Get Your URL

Railway provides a public URL like:
```
https://dash-streaming-server.railway.app
```

## 💰 Cost Estimate

**Railway Hobby Plan**: $5/month
- 512MB RAM
- 1 vCPU
- Redis included
- **Perfect for DASH WebTV!**

**Railway Pro Plan**: $20/month (if needed for scaling)
- 8GB RAM
- 8 vCPU
- Can handle 100+ concurrent streams

## 🔧 Frontend Integration

Update your `dash-webtv` frontend to use the backend:

```javascript
// In js/xtream-client.js

// Movies - Use backend for MKV/AVI/FLV
buildStreamUrl(streamId, extension = 'mp4') {
  const backendUrl = 'https://dash-streaming-server.railway.app';

  // Check if needs transcoding
  if (['mkv', 'avi', 'flv'].includes(extension.toLowerCase())) {
    return `${backendUrl}/api/stream/vod/${streamId}?extension=${extension}&quality=720p`;
  }

  // Direct play for MP4
  return `${this.streamBaseUrl}/movie/${this.streamUsername}/${this.streamPassword}/${streamId}.${extension}`;
}

// Series
buildSeriesUrl(seriesId, season, episode, extension = 'mp4') {
  const backendUrl = 'https://dash-streaming-server.railway.app';

  if (['mkv', 'avi', 'flv'].includes(extension.toLowerCase())) {
    return `${backendUrl}/api/stream/series/${seriesId}/${season}/${episode}?extension=${extension}&quality=720p`;
  }

  return `${this.streamBaseUrl}/series/${this.streamUsername}/${this.streamPassword}/${seriesId}/${season}/${episode}.${extension}`;
}

// Live TV - Always use backend for redirect resolution
async buildLiveStreamUrl(streamId) {
  const backendUrl = 'https://dash-streaming-server.railway.app';

  const response = await fetch(`${backendUrl}/api/live/${streamId}`);
  const data = await response.json();

  return data.url;
}
```

## 🎯 Quality Selection UI

Add quality selector to your player:

```html
<select id="quality-selector">
  <option value="360p">360p</option>
  <option value="480p">480p</option>
  <option value="720p" selected>720p (HD)</option>
  <option value="1080p">1080p (Full HD)</option>
</select>
```

## 📊 Monitoring

Check server health:

```bash
curl https://dash-streaming-server.railway.app/health
```

View logs in Railway dashboard or CLI:

```bash
railway logs
```

## 🐛 Troubleshooting

### FFmpeg not found

Railway automatically installs FFmpeg. If running locally:

```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows (via Chocolatey)
choco install ffmpeg
```

### Redis connection failed

Check `REDIS_URL` environment variable:

```bash
echo $REDIS_URL
```

Railway format: `redis://default:password@host:port`

### Transcoding too slow

Increase Railway plan or reduce quality:

```env
MAX_QUALITY=720p
DEFAULT_QUALITY=480p
```

### HLS segments not caching

Check Redis connection and storage space:

```bash
railway run redis-cli INFO memory
```

## 📝 License

MIT License - Built with ❤️ by ZION SYNAPSE for DASH WebTV

## 🙏 Credits

- **FFmpeg**: Universal media codec
- **Redis**: Lightning-fast caching
- **Express**: Web framework
- **Railway**: Deployment platform
- **Starshare.cx**: IPTV provider

---

**Made with 🧠 by ZION SYNAPSE** - Better than the native app!
