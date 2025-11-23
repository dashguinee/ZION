# DASH⚡ WebTV - Deployment Guide

## 🚀 Quick Deploy to Vercel (Recommended)

Vercel is perfect for this project because:
- ✅ Free HTTPS (required for PWA)
- ✅ Global CDN
- ✅ Instant deployments
- ✅ Auto SSL certificates
- ✅ Great performance

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy

```bash
cd /home/user/ZION/dash-webtv
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → dash-webtv (or your choice)
- **Directory?** → ./ (current directory)
- **Override settings?** → No

### Step 3: Production Deploy

```bash
vercel --prod
```

You'll get a URL like: `https://dash-webtv.vercel.app`

### Step 4: Custom Domain (Optional)

```bash
vercel domains add dash.sl
```

---

## 🌐 Alternative: Netlify

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Deploy

```bash
cd /home/user/ZION/dash-webtv
netlify deploy
```

### Step 3: Production Deploy

```bash
netlify deploy --prod
```

---

## 📦 Alternative: GitHub Pages

### Step 1: Push to GitHub

```bash
cd /home/user/ZION
git add dash-webtv
git commit -m "Add DASH WebTV - The African Super Hub"
git push origin main
```

### Step 2: Enable GitHub Pages

1. Go to repository settings
2. Navigate to "Pages"
3. Set source to `main` branch
4. Select `/dash-webtv` folder (if it's a subfolder)
5. Click Save

URL will be: `https://username.github.io/repo-name/dash-webtv/`

---

## 🖥️ Alternative: Traditional Web Hosting

### Requirements
- ✅ HTTPS enabled (mandatory for PWA)
- ✅ Support for Single Page Applications
- ✅ Correct MIME types

### Files to Upload

```
dash-webtv/
├── index.html
├── offline.html
├── manifest.json
├── service-worker.js
├── css/
├── js/
├── icons/
└── assets/
```

### Upload via FTP/SFTP

```bash
# Using rsync
rsync -avz dash-webtv/ user@yourserver.com:/var/www/html/dash/

# Or use FileZilla, Cyberduck, etc.
```

### Server Configuration

#### Apache (.htaccess)

Create `/dash-webtv/.htaccess`:

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# SPA routing - redirect all to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# MIME types
AddType application/manifest+json .json
AddType application/javascript .js
AddType text/css .css
AddType image/svg+xml .svg

# Enable CORS for API calls
Header set Access-Control-Allow-Origin "*"

# Cache static assets
<FilesMatch "\.(jpg|jpeg|png|gif|svg|css|js|ico)$">
    Header set Cache-Control "max-age=31536000, public"
</FilesMatch>
```

#### Nginx

Add to your nginx config:

```nginx
server {
    listen 443 ssl http2;
    server_name dash.sl;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/dash-webtv;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # MIME types
    types {
        application/manifest+json json;
        application/javascript js;
        text/css css;
        image/svg+xml svg;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|svg|css|js|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🔐 Post-Deployment Checklist

### 1. Test HTTPS
```bash
curl -I https://your-domain.com
```
Should return `200 OK` with HTTPS headers.

### 2. Validate PWA

Use Chrome DevTools:
1. Open site in Chrome
2. F12 → Application tab
3. Check:
   - ✅ Manifest loads correctly
   - ✅ Service Worker registered
   - ✅ Icons present
   - ✅ "Add to Home Screen" available

Or use: https://web.dev/measure/

### 3. Test API Connection

Open browser console and check:
```
✅ Connected to streaming server
📂 Loading categories...
✅ Loaded XX movie categories
```

### 4. Test Installation

**Android:**
1. Open in Chrome
2. Look for "Add to Home Screen" prompt
3. Install and verify icon appears

**iOS:**
1. Open in Safari
2. Share → Add to Home Screen
3. Verify icon appears

### 5. Test Offline Mode

1. Load the app
2. Disconnect internet
3. Refresh page
4. Should show offline page or cached content

---

## 🎨 Branding Customization

### Update Colors

Edit `/css/theme.css`:

```css
:root {
  --primary-purple: #YOUR_COLOR;
  --secondary-blue: #YOUR_COLOR;
  /* ... */
}
```

### Update Logo

Replace:
- `/icons/logo.svg` - Logo SVG
- `/icons/icon-192.png` - 192x192 PNG
- `/icons/icon-512.png` - 512x512 PNG

Generate PNGs from SVG:
```bash
# Using ImageMagick
convert -background none -size 192x192 icons/logo.svg icons/icon-192.png
convert -background none -size 512x512 icons/logo.svg icons/icon-512.png
```

Or use online tools:
- https://cloudconvert.com/svg-to-png
- https://svgtopng.com/

### Update App Name

Edit `/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "App",
  /* ... */
}
```

---

## 📊 Analytics Integration

### Google Analytics

Add to `/index.html` before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Custom Analytics

Edit `/js/pwa.js` → `trackEvent()` method:

```javascript
trackEvent(eventName, data = {}) {
  // Send to your backend
  fetch('https://your-analytics-api.com/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: eventName,
      data: data,
      timestamp: new Date().toISOString()
    })
  })
}
```

---

## 🔒 Security Hardening

### 1. Hide API Credentials

**Current:** Credentials in client-side code (for demo)

**Production:** Create backend proxy

```javascript
// Backend (Node.js/Express)
app.get('/api/vod/categories', async (req, res) => {
  // Only authenticated users
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

  const response = await axios.get(
    `http://server:port/player_api.php?username=${CREDS.username}&password=${CREDS.password}&action=get_vod_categories`
  )

  res.json(response.data)
})

// Frontend (app.js)
async getVODCategories() {
  const response = await fetch('/api/vod/categories')
  return response.json()
}
```

### 2. Add User Authentication

Integrate with existing IPTV-Base (Notion):

```javascript
// Check if user has active subscription
async function checkSubscription(userId) {
  const response = await fetch('/api/subscription/check', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ userId })
  })

  return response.json()
}
```

### 3. Content Security Policy

Add to `/index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://vjs.zencdn.net;
  style-src 'self' 'unsafe-inline' https://vjs.zencdn.net;
  img-src 'self' data: https:;
  media-src 'self' https: http:;
  connect-src 'self' https: http:;
">
```

---

## 🔧 Troubleshooting

### PWA won't install
- Ensure HTTPS is active
- Check manifest.json is valid (use https://manifest-validator.appspot.com/)
- Verify service worker is registered
- Check browser console for errors

### Videos won't play
- Test stream URL directly
- Check CORS headers on streaming server
- Verify HLS.js or Video.js loaded
- Check browser support for HLS

### Service Worker not updating
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Update CACHE_NAME in service-worker.js
- Clear cache: DevTools → Application → Clear storage

---

## 📱 WhatsApp Marketing Integration

### Share Link

```
Hey! Check out DASH - The African Super Hub 🎬📺

57,000+ Movies, 14,000+ Series, Live TV all in one place!

👉 https://dash.sl

Better than Netflix + Prime + HBO Max combined!
Only 85 Leones/month 🔥

Try it now! ⚡
```

### QR Code

Generate QR code pointing to your deployed URL:
- https://www.qr-code-generator.com/
- https://qr.io/

Print on:
- Flyers
- Business cards
- Posters
- WhatsApp status

---

## 🎯 Next Steps

1. ✅ Deploy to Vercel/Netlify
2. ✅ Test installation on Android/iOS
3. ✅ Generate app icons (192x192, 512x512)
4. ✅ Create backend proxy for API
5. ✅ Integrate with IPTV-Base (Notion)
6. ✅ Add user authentication
7. ✅ Setup analytics
8. ✅ Create marketing materials
9. ✅ Launch WhatsApp campaign

---

**Built with ❤️ by ZION for DASH**
*Let's conquer Sierra Leone! 🚀⚡*
