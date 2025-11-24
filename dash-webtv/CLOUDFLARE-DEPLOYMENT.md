# 🚀 Cloudflare Workers Deployment Guide

## THE NUCLEAR OPTION - Bypassing IP Blocks with Cloudflare

This guide will deploy a Cloudflare Worker that proxies your HLS streams through Cloudflare's distributed network, bypassing Railway's IP block issues.

---

## Why Cloudflare Workers?

✅ **Distributed IP network** - Cloudflare has thousands of IPs worldwide
✅ **Rarely blocked** - Most services whitelist Cloudflare
✅ **Free tier** - 100,000 requests/day (more than enough)
✅ **HLS manifest rewriting** - Automatically rewrites all URLs
✅ **Fast deployment** - 15 minutes total

---

## Prerequisites

1. **Cloudflare Account** (free)
   - Sign up at https://dash.cloudflare.com/sign-up

2. **Node.js installed**
   - Check: `node --version` (should be v16+)

---

## Step 1: Install Wrangler CLI

Wrangler is Cloudflare's command-line tool for Workers.

```bash
npm install -g wrangler
```

Verify installation:
```bash
wrangler --version
```

---

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser for authentication. Click "Allow" to grant access.

---

## Step 3: Deploy the Worker

Navigate to your project directory:
```bash
cd /home/dash/zion-github/dash-webtv
```

Deploy the worker:
```bash
wrangler deploy
```

You'll see output like:
```
✨ Uploaded dash-webtv-proxy (1.23 sec)
✨ Published dash-webtv-proxy (0.34 sec)
  https://dash-webtv-proxy.YOUR-SUBDOMAIN.workers.dev
```

**📝 COPY THIS URL!** You'll need it in the next step.

---

## Step 4: Update Frontend Configuration

Open `js/xtream-client.js` and update line 13 with your Worker URL:

```javascript
// OLD (line 13):
this.cloudflareWorkerUrl = 'https://dash-webtv-proxy.YOUR-SUBDOMAIN.workers.dev'

// NEW (replace with YOUR actual URL):
this.cloudflareWorkerUrl = 'https://dash-webtv-proxy.dash-abc123.workers.dev'
```

**⚠️ IMPORTANT:** Use the exact URL from Step 3!

---

## Step 5: Deploy Updated Frontend

If using **Vercel**:
```bash
vercel --prod
```

If using **Netlify**:
```bash
netlify deploy --prod
```

If using **GitHub Pages** or manual hosting:
```bash
# Just commit and push the updated file
git add js/xtream-client.js
git commit -m "Connect to Cloudflare Worker proxy"
git push
```

---

## Step 6: Test the Live Stream

1. Open your web app
2. Go to **Live TV** section
3. Click any channel
4. Check browser console (F12) for logs:

Expected logs:
```
🔴 Building Live TV URL for stream: 12345
📡 Direct stream URL: https://starshare.cx/live/AzizTest1/Test1/12345.m3u8
🌐 Cloudflare Worker URL: https://dash-webtv-proxy...
```

---

## Troubleshooting

### Issue: Worker URL not found (404)
**Solution:** Double-check you copied the exact URL from `wrangler deploy` output.

### Issue: CORS errors in browser console
**Solution:** Worker includes CORS headers. Clear browser cache and try again.

### Issue: "Rate limit exceeded"
**Solution:** You hit the free tier limit (100k requests/day). Either:
- Wait 24 hours for reset
- Upgrade to paid plan ($5/month for 10M requests)

### Issue: Stream still not loading
**Solution:** Check if ostv.info is blocking Cloudflare too:
1. Open browser console (F12)
2. Look for the proxied URL in Network tab
3. Check the response status code
4. If 403/blocked, ostv.info might be blocking Cloudflare IPs (rare)

---

## How It Works

### Architecture Flow:

```
User Browser
    ↓
Frontend (xtream-client.js)
    ↓ Constructs: starshare.cx/live/user/pass/12345.m3u8
    ↓
Cloudflare Worker
    ↓ Fetches from ostv.info
    ↓ Rewrites manifest URLs
    ↓ Returns modified manifest
    ↓
User Browser
    ↓ Requests video segments
    ↓
Cloudflare Worker
    ↓ Proxies segments
    ↓
User Browser (plays video!)
```

### Key Features:

1. **Manifest Rewriting**: Worker detects .m3u8 files and rewrites all URLs to route through itself
2. **Segment Proxying**: All video segments (.ts files) are proxied through Cloudflare
3. **CORS Headers**: Worker adds proper CORS headers so browser can access content
4. **User-Agent Spoofing**: Worker sends proper User-Agent to avoid detection

---

## Monitoring & Limits

### Check Usage:
```bash
wrangler tail
```

This shows real-time logs of requests hitting your worker.

### Free Tier Limits:
- **100,000 requests/day**
- **10ms CPU time per request**
- **Unlimited bandwidth**

For a typical stream:
- 1 manifest request
- ~300 segment requests per hour
- ~7,200 segments per day
- **Can support ~13 concurrent users** within free tier

---

## Cost Estimation

### Free Tier (Current):
- **Cost:** $0/month
- **Requests:** 100,000/day
- **Users:** ~13 concurrent

### Paid Plan ($5/month):
- **Cost:** $5/month
- **Requests:** 10,000,000/month
- **Users:** ~4,600 concurrent

---

## Next Steps

If Cloudflare Workers solves your issue:
1. ✅ You can remove the Railway backend (no longer needed for live streams)
2. ✅ All live stream traffic now goes through Cloudflare
3. ✅ VOD and Series continue to work as before (direct connection)

If it doesn't work:
- ostv.info might be using advanced detection
- Consider using residential proxies (more expensive)
- Or contact ostv.info to whitelist your IPs

---

## Files Changed

| File | Change | Purpose |
|------|--------|---------|
| `cloudflare-worker.js` | Created | Worker code with HLS rewriting |
| `wrangler.toml` | Created | Cloudflare configuration |
| `js/xtream-client.js` | Modified | Routes live streams through worker |

---

## Support

If you encounter issues:
1. Check Cloudflare dashboard for errors
2. Run `wrangler tail` to see live logs
3. Check browser console for frontend errors

---

**🎯 This should solve your IP blocking issues!**
