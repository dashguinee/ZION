# DASH Streaming Architecture - Complete Documentation

**Created**: December 5, 2025
**Author**: ZION SYNAPSE for DASH
**Version**: 2.2.0

---

## Executive Summary

DASH WebTV now has access to **38,000+ free channels** from multiple sources, organized into a **tiered access system** that gives you full control over what users see based on their subscription level.

### The Numbers

| Source | Channels | Update Frequency |
|--------|----------|------------------|
| iptv-org API (channels) | 38,512 | Daily |
| iptv-org API (streams) | 13,019 | Daily |
| Scraper Zilla | 20,537 | **Hourly** |
| MEGA Combined | 19,167 | On-demand |
| Premium VOD (Starshare) | 74,000+ | Provider managed |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER DEVICES                                   │
│              (Browser, Smart TV, Mobile App)                            │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DASH WEBTV FRONTEND                              │
│                    https://dash-webtv.vercel.app                        │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Home      │  │  Live TV    │  │   Movies    │  │   Series    │   │
│  │             │  │  (Tiered)   │  │   (VOD)     │  │   (VOD)     │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     DASH STREAMING SERVER                               │
│              https://zion-production-39d8.up.railway.app                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      API ROUTES                                  │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  /api/secure/*     - Premium VOD (hidden provider)              │   │
│  │  /api/curated/*    - Tiered free channels (controlled)         │   │
│  │  /api/free/*       - Raw free channels (full access)           │   │
│  │  /api/stream/*     - FFmpeg transcoding                        │   │
│  │  /api/hls/*        - HLS streaming                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      SERVICES                                    │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  curated-channels.service.js  - Tier management & curation     │   │
│  │  free-iptv.service.js         - iptv-org + Scraper Zilla       │   │
│  │  cache.service.js             - Redis caching                  │   │
│  │  hls.service.js               - HLS segment management         │   │
│  │  bandwidth-optimizer.js       - Bandwidth optimization         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────┬───────────────────────────┘
                        │                     │
            ┌───────────┴───────────┐         │
            ▼                       ▼         ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────────┐
│   FREE SOURCES    │   │  PREMIUM SOURCE   │   │       REDIS           │
│                   │   │                   │   │     (Caching)         │
│  • iptv-org API   │   │  • Starshare.cx   │   │                       │
│  • Scraper Zilla  │   │  • 74K+ VOD       │   │  • Channel lists      │
│  • Direct HLS     │   │  • Live channels  │   │  • API responses      │
│                   │   │                   │   │  • Session data       │
└───────────────────┘   └───────────────────┘   └───────────────────────┘
```

---

## Tier System

### Tier Configurations

```javascript
BASIC: {
  name: 'Basic',
  maxChannels: 50,
  categories: ['news', 'guinea'],
  includeVOD: false,
  quality: ['sd', 'hd'],
  description: 'Free tier - Guinea + News channels'
}

STANDARD: {
  name: 'Standard',
  maxChannels: 200,
  categories: ['news', 'sports', 'entertainment', 'guinea', 'west-africa', 'french'],
  includeVOD: true,
  vodLimit: 100,
  quality: ['sd', 'hd'],
  description: 'Standard subscription - West Africa + Sports'
}

PREMIUM: {
  name: 'Premium',
  maxChannels: null,  // Unlimited
  categories: 'all',
  includeVOD: true,
  vodLimit: null,
  quality: ['sd', 'hd', '4k'],
  description: 'Premium - Full access to all content'
}
```

### Current Channel Distribution

| Tier | Total | Sports | News | Entertainment | Movies | Guinea | French |
|------|-------|--------|------|---------------|--------|--------|--------|
| BASIC | 50 | 1 | 45 | 1 | 0 | 3 | 3 |
| STANDARD | 200 | 13 | 23 | 16 | 1 | 3 | 15 |
| PREMIUM | 19,167 | 1,559 | 1,078 | 881 | 980 | 3 | 51 |

---

## API Endpoints Reference

### Curated Channels (Tiered Access)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/curated/tiers` | GET | Get all tier configurations |
| `/api/curated/stats` | GET | Get per-tier statistics |
| `/api/curated/basic` | GET | Get BASIC tier channels (50) |
| `/api/curated/standard` | GET | Get STANDARD tier channels (200) |
| `/api/curated/premium` | GET | Get PREMIUM tier channels (19K+) |
| `/api/curated/tier/:name` | GET | Get channels by tier name |
| `/api/curated/category/:name?tier=X` | GET | Get category filtered by tier |
| `/api/curated/search?q=X&tier=Y` | GET | Search within tier |
| `/api/curated/block` | POST | Block a channel (admin) |
| `/api/curated/unblock` | POST | Unblock a channel (admin) |

### Free Channels (Raw Sources)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/free/channels` | GET | DASH priority channels |
| `/api/free/mega` | GET | ALL channels combined (19K+) |
| `/api/free/all-sports` | GET | All sports from all sources (310) |
| `/api/free/guinea` | GET | Guinea-specific channels |
| `/api/free/sports` | GET | African sports channels |
| `/api/free/french` | GET | French language channels |
| `/api/free/west-africa` | GET | West African channels |
| `/api/free/country/:code` | GET | Channels by country code |
| `/api/free/category/:name` | GET | Channels by category |
| `/api/free/api/channels` | GET | Full iptv-org channel database (38K) |
| `/api/free/api/streams` | GET | Full iptv-org streams (13K) |
| `/api/free/api/country/:code` | GET | Country channels via API |
| `/api/free/api/category/:name` | GET | Category channels via API |
| `/api/free/zilla/combined` | GET | Scraper Zilla all channels (20K) |
| `/api/free/zilla/sports` | GET | Scraper Zilla sports |
| `/api/free/zilla/movies` | GET | Scraper Zilla movies |
| `/api/free/zilla/anime` | GET | Scraper Zilla anime |
| `/api/free/stats` | GET | Source statistics |
| `/api/free/test?url=X` | GET | Test if stream URL works |

### Secure VOD (Premium Content)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/secure/categories/:type` | GET | Get categories (movie/series/live) |
| `/api/secure/content/:type` | GET | Get content list |
| `/api/secure/info/:type/:id` | GET | Get content details |
| `/api/secure/play/movie/:id` | GET | Get movie stream URL |
| `/api/secure/play/episode/:id` | GET | Get episode stream URL |
| `/api/secure/play/live/:id` | GET | Get live stream URL |
| `/api/secure/patterns` | GET | Get URL patterns for frontend |

---

## Data Sources

### 1. iptv-org (Primary Free Source)

**Repository**: https://github.com/iptv-org/iptv
**API**: https://iptv-org.github.io/api/

| Endpoint | Content |
|----------|---------|
| `/api/channels.json` | 38,512 channel metadata |
| `/api/streams.json` | 13,019 stream URLs |
| `/api/categories.json` | Channel categories |
| `/api/countries.json` | Country data |
| `/api/languages.json` | Language data |
| `/api/guides.json` | EPG guide mappings |

**Update Frequency**: Daily (community maintained)
**Legal Status**: Community-curated public streams

### 2. IPTV Scraper Zilla (Auto-Updating)

**Repository**: https://github.com/abusaeeidx/IPTV-Scraper-Zilla
**Direct M3U**: https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/combined-playlist.m3u

| Playlist | Content |
|----------|---------|
| `combined-playlist.m3u` | 20,537 channels |
| `sports.m3u` | Sports channels |
| `movies.m3u` | Movie channels |
| `anime.m3u` | Anime channels |

**Update Frequency**: **Hourly** (GitHub Actions)
**Legal Status**: Aggregated public streams

### 3. Starshare (Premium VOD)

**Provider**: starshare.cx (hidden from frontend)
**Content**: 74,000+ movies, series, live channels
**Access**: Via `/api/secure/*` endpoints only
**Legal Status**: Licensed provider (subscription required)

---

## Security Architecture

### Provider URL Protection

```
BEFORE (Exposed):
Frontend JS → Contains "starshare.cx" → Anyone can see provider

AFTER (Hidden):
Frontend JS → Calls /api/secure/patterns → Backend returns patterns
Backend → Uses XTREAM_PROVIDER_URL env var → Provider never exposed
```

### Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `XTREAM_PROVIDER_URL` | Vercel | Provider base URL |
| `STARSHARE_USERNAME` | Railway | Provider username |
| `STARSHARE_PASSWORD` | Railway | Provider password |
| `ADMIN_API_KEY` | Railway | Admin operations |
| `REDIS_URL` | Railway | Redis connection |

### Files Protected (Not in Git)

- `data/movies.json` (22MB) - Local only
- `data/series.json` (8MB) - Local only
- `data/live.json` (2MB) - Local only
- `*.md` documentation - Local only
- Provider credentials - Env vars only

---

## Caching Strategy

### Redis Cache Keys

| Key Pattern | TTL | Content |
|-------------|-----|---------|
| `iptv:api:channels` | 1 hour | Full channel database |
| `iptv:api:streams` | 1 hour | Full streams database |
| `iptv:zilla:combined` | 1 hour | Scraper Zilla channels |
| `iptv:country:XX` | 1 hour | Country-specific M3U |
| `iptv:category:XX` | 1 hour | Category M3U |
| `curated:TIER:options` | 30 min | Curated tier lists |
| `iptv:mega-list` | 30 min | Combined mega list |

### Cache Flow

```
Request → Check Redis → If cached, return
                      → If not, fetch source → Parse → Cache → Return
```

---

## Frontend Integration Guide

### Loading Channels by User Tier

```javascript
// In your frontend app.js
async loadChannelsForUser() {
  // Determine user tier from subscription
  const userTier = this.user?.subscription?.tier || 'BASIC';

  // Fetch appropriate channel list
  const backendUrl = 'https://zion-production-39d8.up.railway.app';
  const response = await fetch(`${backendUrl}/api/curated/${userTier.toLowerCase()}`);
  const data = await response.json();

  // data contains:
  // - tier: "Basic" | "Standard" | "Premium"
  // - description: tier description
  // - totalChannels: number
  // - categories: { sports: [], news: [], ... }
  // - all: [] full channel list

  this.channels = data.all;
  this.channelsByCategory = data.categories;
}
```

### Displaying Tier-Locked Content

```javascript
// Show upgrade prompt for premium content
if (userTier === 'BASIC' && channel.tier === 'PREMIUM') {
  showUpgradePrompt('Upgrade to Premium for this channel');
  return;
}

// Play channel
playChannel(channel.url);
```

### Free Channel Indicator

```css
/* Green blinking dot for free channels */
.free-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00ff88;
  animation: free-pulse 2s ease-in-out infinite;
}

@keyframes free-pulse {
  0%, 100% { background: #00ff88; opacity: 1; }
  50% { background: #ffffff; opacity: 0.9; }
}
```

---

## Future: Self-Hosted Panel (XC_VM / FastoCloud)

### Why Self-Host?

1. **Independence**: No reliance on external providers
2. **Control**: Full control over content and users
3. **Margins**: Keep 100% of subscription revenue
4. **Resilience**: Can't be shut down by provider

### Hardware Requirements (Your Dell XPS 17)

| Spec | Your System | XC_VM Minimum |
|------|-------------|---------------|
| CPU | i7/i9 | 6+ cores ✅ |
| RAM | 32GB | 16-32GB ✅ |
| GPU | 6GB | Optional ✅ |
| Storage | NVMe | 480GB+ SSD ✅ |
| Network | Gigabit | 1 Gbps ✅ |

**Verdict**: Your Dell XPS 17 can run XC_VM for testing/development!

### XC_VM Features

- User management with reseller hierarchy
- EPG (Electronic Program Guide) support
- Live stream transcoding
- VOD management
- Load balancing
- No licensing fees (AGPL-3.0)

### FastoCloud Features

- Docker deployment
- GPU/CPU transcoding
- Adaptive HLS streams
- REST API
- Admin panel
- Cross-platform

### Installation Path (Future)

```bash
# XC_VM on your machine (for testing)
git clone https://github.com/Vateron-Media/XC_VM
cd XC_VM
pip3 install -r requirements.txt
python3 installer.py

# FastoCloud via Docker
docker pull fastogt/fastocloud
docker run -d fastogt/fastocloud
```

---

## Deployment Information

### Current Deployments

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://dash-webtv.vercel.app |
| Backend | Railway | https://zion-production-39d8.up.railway.app |
| Redis | Railway | Internal connection |

### Git Repositories

| Repo | Path | Purpose |
|------|------|---------|
| dash-webtv | `/home/dash/zion-github/dash-webtv` | Frontend |
| dash-streaming-server | `/home/dash/zion-github/dash-streaming-server` | Backend |
| ZION (mono) | `/home/dash/zion-github` | Parent repo |

### Recent Commits

| Commit | Description | Date |
|--------|-------------|------|
| `b44e742` | Add curated channels with tiered access | Dec 5, 2025 |
| `80cfa8a` | Add iptv-org API + Scraper Zilla integration | Dec 5, 2025 |
| `0d00701` | Free channels UI integration | Dec 5, 2025 |
| `e5e7d68` | Add free IPTV backend integration | Dec 5, 2025 |
| `0b1fb17` | Security hardening - remove provider exposure | Dec 5, 2025 |

---

## Monitoring & Maintenance

### Health Checks

```bash
# Backend health
curl https://zion-production-39d8.up.railway.app/health

# Curated stats
curl https://zion-production-39d8.up.railway.app/api/curated/stats

# Free channel stats
curl https://zion-production-39d8.up.railway.app/api/free/stats
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Channels not loading | Check Redis connection, clear cache |
| Scraper Zilla empty | GitHub might be rate-limiting, wait 1 hour |
| Provider streams down | Check provider status, use free alternatives |
| High latency | Check Railway logs, optimize queries |

### Cache Clearing

```bash
# Clear all curated caches (via Redis CLI)
redis-cli KEYS "curated:*" | xargs redis-cli DEL

# Clear iptv caches
redis-cli KEYS "iptv:*" | xargs redis-cli DEL
```

---

## Pricing Strategy (Recommendation)

Based on Guinea market and content tiers:

| Tier | Price (GNF) | Price (USD) | Content |
|------|-------------|-------------|---------|
| BASIC | Free | Free | 50 channels (trial) |
| STANDARD | 40,000/month | ~$4 | 200 channels + Basic VOD |
| PREMIUM | 80,000/month | ~$8 | All channels + Full VOD |
| ANNUAL | 600,000/year | ~$60 | Premium + 2 months free |

---

## Contact & Support

- **Repository Issues**: https://github.com/dashguinee/ZION/issues
- **Backend Logs**: Railway dashboard
- **Frontend Logs**: Vercel dashboard

---

*Document generated by ZION SYNAPSE*
*Last Updated: December 5, 2025*
