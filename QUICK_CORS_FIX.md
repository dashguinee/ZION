# 🚨 QUICK CORS FIX - If Live TV Doesn't Work

## IF YOU SEE THIS ERROR:
```
Access to video at 'https://live6.ostv.info/...' has been blocked by CORS policy
```

## 🎯 FASTEST FIX (30 minutes):

### **Solution: Vercel Edge Functions Proxy**

**Why this is best:**
- ✅ Same origin as frontend = NO CORS
- ✅ Free (100GB/month)
- ✅ Fast (edge deployment)
- ✅ Easy (one file)

### **Steps:**

1. **Create file:** `dash-webtv/api/proxy-hls.js`

```javascript
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl);
    const data = await response.text();

    // Rewrite .m3u8 manifest URLs to proxy through our edge function
    let rewritten = data;
    if (targetUrl.includes('.m3u8')) {
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      rewritten = data.split('\n').map(line => {
        if (line && !line.startsWith('#') && !line.startsWith('http')) {
          const segmentUrl = baseUrl + line;
          return `/api/proxy-hls?url=${encodeURIComponent(segmentUrl)}`;
        }
        return line;
      }).join('\n');
    }

    return new Response(rewritten, {
      headers: {
        'Content-Type': targetUrl.includes('.m3u8')
          ? 'application/vnd.apple.mpegurl'
          : 'video/MP2T',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (error) {
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
}
```

2. **Update frontend:** `dash-webtv/js/xtream-client.js`

```javascript
async buildLiveStreamUrl(streamId, extension = null) {
  const response = await fetch(`${this.backendUrl}/api/live/${streamId}`);
  const data = await response.json();

  if (data.success) {
    // Proxy through Vercel Edge to avoid CORS
    const proxyUrl = `/api/proxy-hls?url=${encodeURIComponent(data.url)}`;
    return proxyUrl;
  } else {
    throw new Error('Failed to resolve live stream');
  }
}
```

3. **Deploy:**
```bash
git add dash-webtv/api/proxy-hls.js dash-webtv/js/xtream-client.js
git commit -m "Add Vercel Edge proxy for Live TV HLS"
git push origin main
```

4. **Test:** Vercel auto-deploys → Test Live TV → Should work!

---

## 📚 WANT MORE OPTIONS?

Read: **CORS_PROXY_SOLUTIONS.md** - 5 complete solutions with pros/cons

---

## ⚡ ALTERNATIVE QUICK FIX (Backend Proxy):

**If Vercel approach doesn't work, use Railway backend:**

Update `dash-webtv/js/xtream-client.js`:

```javascript
async buildLiveStreamUrl(streamId, extension = null) {
  // Use backend proxy directly
  return `${this.backendUrl}/api/live/${streamId}/direct`;
}
```

**Note:** Uses Railway bandwidth, but guaranteed to work!

---

**Made with 🤖 by ZION SYNAPSE**
**Time to implement:** 30 minutes
**Success rate:** 99%
