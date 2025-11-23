# DASH⚡ WebTV

**"The African Super Hub"** - Sierra Leone's First Progressive Web App Streaming Platform

## 🎯 Overview

DASH WebTV is a modern, installable web application that provides access to:
- **57,000+ Movies** (including latest releases)
- **14,324 Series** (Netflix, Prime, HBO Max, and more)
- **Live TV Channels** (Sports, Movies, Kids, and more)

**Key Feature**: Installs like a real app on mobile devices (iOS & Android) without needing the App Store or Google Play!

## ✨ Features

### User Experience
- 🎨 **Cosmic Purple Theme** - Beautiful, futuristic design
- 📱 **Progressive Web App** - Installable on any device
- ⚡ **Fast Loading** - Optimized performance
- 🎬 **Catalog Browsing** - Browse before trial
- 📺 **Video Player** - HLS/M3U8 streaming support
- ❤️ **Favorites** - Save your favorite content
- 🔍 **Search** - Find content quickly
- 📂 **Categories** - Filter by genre, platform, etc.

### Technical Features
- 🌐 **Offline Support** - Service Worker caching
- 📲 **Add to Home Screen** - Native app experience
- 🎯 **Xtream Codes Integration** - Complete API support
- 🎥 **Video.js Player** - Professional video playback
- 💾 **LocalStorage** - Save preferences and history
- 🔄 **Auto Updates** - Service worker updates

## 🏗️ Architecture

```
dash-webtv/
├── index.html              # Main entry point
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for offline support
├── css/
│   ├── theme.css          # Cosmic purple design system
│   └── components.css     # UI components
├── js/
│   ├── app.js             # Main application logic
│   ├── xtream-client.js   # Xtream Codes API client
│   └── pwa.js             # PWA installation logic
├── icons/
│   ├── icon-192.png       # App icon (192x192)
│   └── icon-512.png       # App icon (512x512)
└── assets/
    └── placeholder.jpg    # Fallback poster image
```

## 🚀 Quick Start

### 1. Local Development

```bash
# Navigate to the project directory
cd dash-webtv

# Start a local server (Python)
python3 -m http.server 8000

# Or use Node.js http-server
npx http-server -p 8000

# Open in browser
open http://localhost:8000
```

### 2. Configuration

Edit `/js/app.js` to update your Xtream Codes credentials:

```javascript
this.client = new XtreamClient({
  baseUrl: 'http://your-server.com:port',
  username: 'your-username',
  password: 'your-password'
})
```

## 🌐 Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd dash-webtv
vercel

# Production deployment
vercel --prod
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd dash-webtv
netlify deploy

# Production deployment
netlify deploy --prod
```

### Option 3: GitHub Pages

```bash
# Push to GitHub
git add dash-webtv
git commit -m "Add DASH WebTV"
git push origin main

# Enable GitHub Pages in repository settings
# Set source to main branch / root (or /dash-webtv if subfolder)
```

### Option 4: Traditional Hosting

Upload all files to your web hosting via FTP/SFTP. Ensure:
- HTTPS is enabled (required for PWA)
- All files are accessible
- MIME types are configured correctly

## 📱 Installation Guide (for Users)

### Android
1. Open DASH WebTV in Chrome
2. Tap menu (⋮) → "Add to Home screen"
3. Tap "Add"
4. DASH appears on your home screen!

### iOS
1. Open DASH WebTV in Safari
2. Tap Share button (⬆️)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. DASH appears on your home screen!

### Desktop
- Look for install icon in browser address bar
- Or: Browser menu → "Install DASH"

## 🎨 Design System

### Colors
- **Primary**: Purple (`#9D4EDD`, `#7B2CBF`)
- **Secondary**: Blue (`#00F5FF`)
- **Background**: Black (`#0A0A0A`, `#1A1A1A`)
- **Accent**: Gold (`#FFD700`)

### Typography
- Font: System fonts (Apple, Segoe UI, Roboto)
- Headings: Bold, gradient text
- Body: Regular, light gray

### Components
- **Cards**: Glass-morphism with purple glow
- **Buttons**: Gradient backgrounds, hover effects
- **Badges**: Platform indicators (Netflix, Prime, HBO)
- **Modal**: Full-screen overlay with details

## 🔌 API Integration

### Xtream Codes Endpoints Used

```javascript
// Categories
GET player_api.php?username=X&password=X&action=get_vod_categories
GET player_api.php?username=X&password=X&action=get_series_categories
GET player_api.php?username=X&password=X&action=get_live_categories

// Streams
GET player_api.php?username=X&password=X&action=get_vod_streams&category_id=X
GET player_api.php?username=X&password=X&action=get_series&category_id=X
GET player_api.php?username=X&password=X&action=get_live_streams&category_id=X

// Details
GET player_api.php?username=X&password=X&action=get_vod_info&vod_id=X
GET player_api.php?username=X&password=X&action=get_series_info&series_id=X

// Playback
http://server:port/movie/username/password/stream_id.ext
http://server:port/series/username/password/series_id/season/episode.ext
http://server:port/live/username/password/stream_id.ext
```

## 🔒 Security Considerations

### Current Implementation
- API credentials in client-side code (for demo/catalog browsing)
- Direct streaming URLs

### Production Recommendations
1. **Backend Proxy**: Create a server-side proxy for API calls
2. **Authentication**: Implement user authentication
3. **Token-based Access**: Use temporary tokens instead of static credentials
4. **Rate Limiting**: Prevent API abuse
5. **HTTPS Only**: Enforce secure connections

### Example Backend Proxy (Node.js)

```javascript
// server.js
const express = require('express')
const axios = require('axios')
const app = express()

app.get('/api/categories/:type', async (req, res) => {
  const { type } = req.params
  const url = `http://server:port/player_api.php?username=X&password=X&action=get_${type}_categories`

  const response = await axios.get(url)
  res.json(response.data)
})

app.listen(3000)
```

## 📊 Analytics & Tracking

Currently tracks locally:
- First visit / returning visitor
- Page visibility
- PWA installation
- Content interactions

Events stored in `localStorage`. To integrate with analytics:

```javascript
// In pwa.js trackEvent()
// Send to your analytics endpoint
fetch('/api/analytics', {
  method: 'POST',
  body: JSON.stringify({ event: eventName, data })
})
```

## 🔄 Updates & Maintenance

### Updating Content
Content is fetched live from Xtream Codes API. No manual updates needed.

### Updating the App
1. Make changes to code
2. Update `CACHE_NAME` in `service-worker.js` (e.g., `v1` → `v2`)
3. Deploy
4. Users see update notification and can refresh

### Cache Management
Clear app cache:
```javascript
// In browser console
caches.keys().then(keys => keys.forEach(key => caches.delete(key)))
```

## 🐛 Troubleshooting

### App won't install
- Ensure HTTPS is enabled
- Check manifest.json is valid
- Verify service worker registered successfully
- Try different browser

### Video won't play
- Check stream URL is correct
- Verify HLS/M3U8 format support
- Test stream URL directly in VLC/browser
- Check CORS headers on streaming server

### Categories not loading
- Check API credentials
- Verify server is accessible
- Check browser console for errors
- Test API endpoint directly

### Offline mode not working
- Verify service worker is registered
- Check cache contains required files
- Ensure service worker isn't disabled

## 📈 Performance Optimization

### Current Optimizations
- Lazy loading images
- Service worker caching
- Minimal JavaScript libraries
- CSS-only animations
- LocalStorage for state

### Future Improvements
- Image compression/WebP
- Code splitting
- Virtual scrolling for large lists
- Prefetch popular content
- CDN for static assets

## 🎯 Marketing Strategy

### Phase 1: Catalog Preview (Current)
- Show full catalog
- "Get Free Trial" CTA
- No playback yet
- WhatsApp integration

### Phase 2: Trial System
- Link to IPTV-Base (Notion)
- Track trial requests
- Automated provisioning
- WhatsApp credentials delivery

### Phase 3: Full Platform
- User authentication
- Subscription management
- Payment integration
- Renewal reminders

## 🌍 Sierra Leone Market

### Pricing
- **DASH Light**: 85 Leones/month
- Free 24-hour trial
- Multiple subscription tiers

### Value Proposition
- Better than Netflix + Prime + HBO combined
- Local payment methods
- WhatsApp support
- Mobile-first design
- Works on any device

## 📞 Support

For issues or questions:
- **Email**: support@dash.sl
- **WhatsApp**: +232 XX XXX XXXX
- **GitHub Issues**: [Report here]

## 📝 License

Proprietary - DASH Entertainment Services

---

**Built with ❤️ by ZION for DASH**
*Sierra Leone's First PWA Streaming Platform* ⚡

## 🔗 Related Documentation

- [Xtream Codes API](https://github.com/engenex/xtream-codes-api-v2)
- [Progressive Web Apps](https://web.dev/progressive-web-apps/)
- [Video.js Documentation](https://videojs.com/getting-started/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Sources:**
- [Xtream Codes API V2](https://github.com/engenex/xtream-codes-api-v2)
- [Xtream Codes API Documentation](https://github.com/zaclimon/xipl/wiki/Xtream-Codes-API)
- [Xtream UI API](https://xtream-ui.org/api-xtreamui-xtreamcode/)
