# Railway Deployment Guide 🚀

Step-by-step guide to deploy DASH Streaming Server to Railway.

## Prerequisites

- GitHub account (for automatic deployments)
- Railway account (sign up at railway.app)
- Starshare credentials

## Step 1: Push to GitHub

```bash
cd /home/dash/zion-github/dash-streaming-server

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "🚀 Initial commit - DASH Streaming Server with FFmpeg + Redis"

# Create GitHub repo and push
gh repo create dash-streaming-server --public --source=. --remote=origin --push
```

## Step 2: Deploy to Railway

### Option A: Deploy via Railway Dashboard (Recommended)

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `dash-streaming-server`
5. Railway will automatically detect Node.js and deploy

### Option B: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

## Step 3: Add Redis Database

1. In Railway dashboard, click your project
2. Click "New" → "Database" → "Redis"
3. Railway automatically sets `REDIS_URL` environment variable
4. No configuration needed!

## Step 4: Configure Environment Variables

In Railway dashboard, go to your service → "Variables" tab:

Add these variables:

```env
NODE_ENV=production
PORT=3000
STARSHARE_BASE_URL=https://starshare.cx
STARSHARE_USERNAME=AzizTest1
STARSHARE_PASSWORD=Test1
FFMPEG_THREADS=4
MAX_QUALITY=1080p
DEFAULT_QUALITY=720p
CACHE_TTL=86400
LIVE_TOKEN_TTL=300
LOG_LEVEL=info
```

**Note**: `REDIS_URL` is automatically set by Railway when you add the Redis database.

## Step 5: Generate Public Domain

1. In Railway dashboard, go to your service
2. Click "Settings" tab
3. Scroll to "Networking"
4. Click "Generate Domain"
5. You'll get a URL like: `https://dash-streaming-server-production.up.railway.app`

## Step 6: Test Deployment

```bash
# Check health
curl https://your-railway-url.railway.app/health

# Should return:
{
  "status": "ok",
  "service": "DASH Streaming Server",
  "version": "1.0.0",
  "redis": true,
  "timestamp": "2025-11-24T..."
}
```

## Step 7: Update Frontend

Update your `dash-webtv` Vercel deployment to use the new backend:

```bash
cd /home/dash/zion-github/dash-webtv

# Update environment variable in Vercel
vercel env add VITE_BACKEND_URL production
# Enter: https://your-railway-url.railway.app

# Redeploy
vercel --prod
```

## 📊 Monitoring

### View Logs

Railway Dashboard:
1. Click your service
2. Go to "Deployments" tab
3. Click latest deployment
4. View real-time logs

CLI:
```bash
railway logs
```

### Check Metrics

Railway Dashboard:
1. Click your service
2. Go to "Metrics" tab
3. View CPU, Memory, Network usage

### Set Up Alerts (Optional)

1. Go to Project Settings
2. Click "Webhooks"
3. Add Discord/Slack webhook for deployment alerts

## 🔧 Troubleshooting

### Deployment Failed

Check build logs in Railway dashboard:
- Missing dependencies? Check `package.json`
- FFmpeg not found? Railway should install automatically
- Redis connection failed? Check if Redis service is running

### Server Crashes After Deployment

```bash
# View logs
railway logs --tail

# Common issues:
# 1. Port not set - Railway sets PORT automatically
# 2. Redis URL wrong - Should be auto-configured
# 3. FFmpeg missing - Contact Railway support
```

### Transcoding Too Slow

Upgrade Railway plan:
1. Go to Project Settings
2. Click "Plan"
3. Upgrade to Pro ($20/mo) for more CPU/RAM

Or reduce quality:
```env
MAX_QUALITY=720p
DEFAULT_QUALITY=480p
```

### Redis Out of Memory

Check cache usage:
```bash
railway run redis-cli INFO memory
```

Reduce cache TTL:
```env
CACHE_TTL=43200  # 12 hours instead of 24
```

## 💰 Cost Management

### Hobby Plan ($5/mo)

Perfect for:
- Development/Testing
- Personal use
- Low traffic (<1000 users)

Limits:
- 512MB RAM
- 1 vCPU
- Shared resources

### Pro Plan ($20/mo)

Better for:
- Production use
- Multiple concurrent streams
- High traffic (1000+ users)

Benefits:
- 8GB RAM
- 8 vCPU
- Dedicated resources
- Priority support

### Cost Optimization Tips

1. **Enable caching** - Reduces CPU usage for repeat views
2. **Set quality limits** - Lower MAX_QUALITY saves CPU
3. **Auto-cleanup** - Server automatically deletes old HLS files
4. **Monitor usage** - Check metrics weekly in Railway dashboard

## 🚀 Auto-Deployment

Railway automatically redeploys when you push to GitHub:

```bash
cd /home/dash/zion-github/dash-streaming-server

# Make changes
vim src/config.js

# Commit and push
git add .
git commit -m "Update configuration"
git push

# Railway automatically deploys! 🎉
```

## 📝 Custom Domain (Optional)

1. In Railway dashboard, go to service → "Settings"
2. Scroll to "Networking"
3. Click "Custom Domain"
4. Add your domain (e.g., `stream.dashwebtv.com`)
5. Update DNS records at your domain provider:
   ```
   CNAME stream.dashwebtv.com -> your-railway-url.railway.app
   ```

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] Redis database added
- [ ] Environment variables configured
- [ ] Public domain generated
- [ ] Health check passes
- [ ] Frontend updated with backend URL
- [ ] Test movie playback (MKV)
- [ ] Test series playback
- [ ] Test Live TV
- [ ] Monitor logs for errors

## 🎯 Next Steps

1. Deploy backend to Railway ✅
2. Update frontend with backend URL
3. Test all formats (MKV, AVI, FLV, MP4)
4. Add quality selector UI
5. Implement HLS adaptive streaming
6. Add analytics/monitoring
7. Go LIVE! 🎉

---

**Need help?** Check Railway docs: https://docs.railway.app
