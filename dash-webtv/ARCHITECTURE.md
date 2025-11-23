# DASH⚡ WebTV - Architecture

**"The African Super Hub"** - Sierra Leone's First PWA Streaming Platform

## Vision

Transform web streaming into an installable mobile app experience using Progressive Web App (PWA) technology. No APK, no App Store, just pure web magic that becomes a real app on users' phones.

## Core Value Proposition

**57,000+ movies** + **14,324 series** + **Live TV** = Better than Netflix + Prime + HBO combined
- DASH Light: 85 Leones/month
- Installable like a native app
- DASH branded experience (not StarShare)
- Show catalog BEFORE trial (reduces friction)

## Technical Stack

### Frontend
- **Pure HTML/CSS/JavaScript** (no framework bloat for fast loading)
- **HLS.js** or **Video.js** for HLS/M3U8 playback
- **CSS Grid + Flexbox** for responsive layout
- **LocalStorage** for favorites/watch history
- **Service Worker** for offline capability + caching

### API Integration
- **Xtream Codes API** (player_api.php endpoints)
- Base URL: `http://starshare.cx:80`
- Authentication: URL parameters (username/password)
- JSON responses for all data

### PWA Components
- **manifest.json** - App metadata, icons, colors, display mode
- **service-worker.js** - Caching strategy, offline support
- **Icons** - Multiple sizes for different devices (192x192, 512x512)

## Design System

### Theme: "Cosmic Purple"
- **Primary**: Neon Purple (`#9D4EDD`, `#7B2CBF`)
- **Secondary**: Electric Blue (`#00F5FF`, `#00D9FF`)
- **Background**: Deep Black (`#0A0A0A`, `#1A1A1A`)
- **Accent**: Gold/Yellow for highlights (`#FFD700`)
- **Cards**: Dark glass-morphism with purple glow
- **Gradients**: Purple → Blue cosmic flows

### UI Inspiration
- Netflix card grid layout
- Spotify's dark mode aesthetics
- Apple TV's smooth transitions
- Your finance tracker's mobile-first design

## App Structure

### Pages/Views

#### 1. **Home** 🏠
- Hero banner with featured content
- Categories: Movies, Series, Live TV, Kids
- Continue Watching row
- Popular content rows
- Search bar (sticky top)

#### 2. **Movies** 🎬
- Category filters (Action, Comedy, Drama, etc.)
- Grid view with posters
- Sort by: Latest, Popular, A-Z
- Infinite scroll
- Quick info on hover/tap

#### 3. **Series** 📺
- Same layout as Movies
- Netflix, Prime, HBO Max badges
- Season/episode count indicators
- Continue watching episodes

#### 4. **Live TV** 📡
- EPG (Electronic Program Guide) timeline
- Channel categories (UK Movies, Kids, Sports, DSTV)
- "Now Playing" indicators
- Channel logos + names
- Quick zap functionality

#### 5. **Player** ▶️
- Full-screen video player
- Controls: Play/Pause, Volume, Quality, Fullscreen
- Next Episode (for series)
- Back button
- Minimal UI (auto-hide controls)

#### 6. **Account** 👤
- Subscription status
- Expiration date
- Renewal options
- Favorites list
- Watch history
- Settings (language, quality preference)

### Navigation

**Mobile (Bottom Nav):**
```
[ 🏠 Home ] [ 🎬 Movies ] [ 📺 Series ] [ 📡 Live TV ] [ 👤 Account ]
```

**Desktop (Sidebar):**
```
DASH⚡ Logo
-----------
🏠 Home
🎬 Movies
📺 Series
📡 Live TV
🔍 Search
👤 Account
```

## API Architecture

### Xtream Codes Client (`xtream-client.js`)

```javascript
class XtreamClient {
  constructor(baseUrl, username, password) {
    this.baseUrl = baseUrl
    this.username = username
    this.password = password
  }

  // Core Methods
  async getVODCategories()
  async getSeriesCategories()
  async getLiveCategories()
  async getVODStreams(categoryId = null)
  async getSeries(categoryId = null)
  async getLiveStreams(categoryId = null)
  async getSeriesInfo(seriesId)
  async getVODInfo(vodId)
  async getShortEPG(streamId, limit = 10)

  // Helper Methods
  buildStreamUrl(streamId, extension = 'ts')
  buildVODUrl(vodId, extension = 'mp4')
  buildSeriesUrl(seriesId, season, episode)
}
```

### Data Flow

1. **App Initialization**
   - Load categories (Movies, Series, Live TV)
   - Cache in LocalStorage
   - Render homepage

2. **Category Browse**
   - User selects "Movies"
   - Fetch VOD streams for category
   - Render grid with posters

3. **Content Selection**
   - User taps movie poster
   - Fetch detailed info (getVODInfo)
   - Show modal with description, play button

4. **Playback**
   - Build stream URL
   - Load into Video.js/HLS.js player
   - Track watch position in LocalStorage

## PWA Implementation

### manifest.json
```json
{
  "name": "DASH - The African Super Hub",
  "short_name": "DASH",
  "description": "57,000+ Movies, 14,000+ Series, Live TV",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0A0A0A",
  "theme_color": "#9D4EDD",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker Strategy
- **Cache First**: UI assets (CSS, JS, fonts, icons)
- **Network First**: API calls (always fresh data)
- **Offline Fallback**: Cached homepage when offline

### Install Prompt
- Detect if app is installable
- Show custom "Add to Home Screen" banner
- iOS: Show manual instructions (Safari share → Add to Home Screen)
- Android: Native install prompt

## File Structure

```
dash-webtv/
├── index.html                 # Main app entry
├── manifest.json              # PWA manifest
├── service-worker.js          # Service worker
├── css/
│   ├── main.css              # Global styles
│   ├── theme.css             # Cosmic purple theme
│   └── components.css        # UI components
├── js/
│   ├── app.js                # Main app logic
│   ├── xtream-client.js      # Xtream API client
│   ├── router.js             # SPA routing
│   ├── player.js             # Video player controller
│   └── pwa.js                # PWA install logic
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── logo.svg              # DASH⚡ logo
├── assets/
│   └── placeholder.jpg       # Fallback poster image
└── README.md                 # Project documentation
```

## Deployment Strategy

### Phase 1: Marketing Preview
- Deploy to **dash-tv.vercel.app** (or similar)
- Show in WhatsApp: "See what you'll get 👀"
- Full catalog browsing (no playback yet)
- "Get Free Trial" CTA button

### Phase 2: Full Launch
- Add authentication layer
- Integrate with IPTV-Base (Notion)
- Enable playback for paid users
- Track usage analytics

### Phase 3: PWA Distribution
- QR code for easy access
- WhatsApp message: "Install DASH on your phone 📱"
- Step-by-step guide with screenshots
- Video tutorial for installation

## Integration with Existing Systems

### IPTV-Base (Notion)
- Track who installed the app
- Link app usage to subscriptions
- Monitor popular content
- Renewal reminders via WhatsApp

### WhatsApp Funnel
**Before:**
"Try IPTV free for 24h" → User unsure what they're getting

**After:**
1. "Check out DASH WebTV → [link]"
2. User browses 57,000 movies
3. "Wow! Get me a trial"
4. Higher conversion rate

## Success Metrics

- **Installation Rate**: % of visitors who add to home screen
- **Catalog Engagement**: Time spent browsing before trial request
- **Conversion Rate**: Catalog viewers → Trial → Paid
- **Retention**: Daily active users (DAU)
- **Content Popularity**: Most viewed categories/titles

## Future Enhancements

- **Referral System**: Share and earn credits
- **Offline Downloads**: Cache movies for offline viewing
- **Multiple Profiles**: Kids mode, different watch histories
- **Chromecast Support**: Cast to TV
- **Smart TV Version**: Native TV apps
- **Payment Integration**: In-app subscription renewal

---

**Built by ZION for DASH Entertainment**
**Sierra Leone Market - 2025**

*"From Web to App in One Tap"* ⚡
