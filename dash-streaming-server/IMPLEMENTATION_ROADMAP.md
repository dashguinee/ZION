# DASH Streaming - Implementation Roadmap

**Created**: December 5, 2025
**Status**: IN PROGRESS

---

## What We've Built (COMPLETED)

### Phase 1: Security Hardening ✅
- [x] Hide provider URL from frontend JavaScript
- [x] Move provider URL to backend environment variable
- [x] Remove 51MB of data files from git
- [x] Create comprehensive .gitignore
- [x] Document revert procedures

### Phase 2: Free IPTV Integration ✅
- [x] Create free-iptv.service.js
- [x] Integrate iptv-org M3U playlists
- [x] Add West African channel support (Guinea, Senegal, etc.)
- [x] Add French language channel support
- [x] Add African sports channels
- [x] Create /api/free/* endpoints

### Phase 3: Advanced Sources ✅
- [x] Integrate iptv-org JSON API (38K channels)
- [x] Integrate IPTV Scraper Zilla (20K channels, hourly updates)
- [x] Create MEGA combined endpoint (19K deduplicated)
- [x] Create all-sports super endpoint (310 channels)
- [x] Add /api/free/api/* endpoints
- [x] Add /api/free/zilla/* endpoints

### Phase 4: Tiered Access Control ✅
- [x] Create curated-channels.service.js
- [x] Define BASIC/STANDARD/PREMIUM tiers
- [x] Implement channel scoring algorithm
- [x] Implement category filtering
- [x] Create /api/curated/* endpoints
- [x] Add blocklist functionality

---

## What Needs To Be Done (REMAINING)

### Phase 5: Frontend Integration 🔄
- [ ] Update Live TV page to use curated endpoints
- [ ] Add tier detection based on user subscription
- [ ] Implement upgrade prompts for locked content
- [ ] Add FREE category tab in Live TV
- [ ] Improve channel grid with category tabs
- [ ] Add search functionality
- [ ] Test all tiers work correctly

### Phase 6: User Authentication Integration
- [ ] Connect tier system to Notion subscription database
- [ ] Map customer subscription status to tier
- [ ] Implement tier validation on each request
- [ ] Add subscription status caching
- [ ] Handle expired subscriptions (downgrade to BASIC)

### Phase 7: Admin Dashboard
- [ ] Create admin panel for channel management
- [ ] Add channel blocking/unblocking UI
- [ ] Add tier configuration UI
- [ ] Add analytics dashboard (views, popular channels)
- [ ] Add user management integration

### Phase 8: Self-Hosted Panel (FUTURE)
- [ ] Set up XC_VM on local machine for testing
- [ ] Configure user management
- [ ] Import free channel sources
- [ ] Test transcoding capabilities
- [ ] Plan production deployment

---

## Open Source Tools Discovered

### For Immediate Use

| Tool | Purpose | Status |
|------|---------|--------|
| [iptv-org/api](https://github.com/iptv-org/api) | 38K channel database | INTEGRATED ✅ |
| [Scraper Zilla](https://github.com/abusaeeidx/IPTV-Scraper-Zilla) | 20K channels, hourly updates | INTEGRATED ✅ |
| [iptv-org/iptv](https://github.com/iptv-org/iptv) | M3U playlists by country/category | INTEGRATED ✅ |

### For Future Implementation

| Tool | Purpose | Status |
|------|---------|--------|
| [XC_VM](https://github.com/Vateron-Media/XC_VM) | Full Xtream Codes panel replacement | RESEARCHED |
| [FastoCloud](https://github.com/fastogt/fastocloud) | IPTV middleware with Docker | RESEARCHED |
| [ZedTV](https://github.com/r00tmebaby/ZedTV-IPTV-Player-Recorder-Scraper) | Xtream portal connector | RESEARCHED |
| [iptv_daily_update](https://github.com/zacnicholson/iptv_daily_update) | Auto free trial scraper | RESEARCHED |
| [IPTVChecker](https://github.com/NewsGuyTor/IPTVChecker) | Stream status checker | RESEARCHED |
| [m3u4u](https://m3u4u.com/) | Playlist editor online | NOTED |
| [Threadfin](https://github.com/Threadfin/Threadfin) | M3U proxy for Plex/Jellyfin | NOTED |

---

## Decision Points (Need Your Input)

### 1. Tier Pricing
Current suggestion:
- BASIC: Free (50 channels)
- STANDARD: 40,000 GNF/month (200 channels)
- PREMIUM: 80,000 GNF/month (19K+ channels + VOD)

**Question**: Does this pricing make sense for Guinea market?

### 2. Content Categories
Current categories prioritized:
- Sports (football focus)
- News (France24, Africa24)
- Entertainment
- Movies
- Guinea local
- French language

**Question**: Any categories to add/remove?

### 3. Self-Hosted Panel Timeline
Options:
- A) Set up XC_VM now on your Dell XPS for testing
- B) Wait until paid subscriber base grows
- C) Use cloud VPS instead of local machine

**Question**: Which approach?

### 4. Free Tier Strategy
Options:
- A) 50 channels forever free (lead generation)
- B) 7-day trial of STANDARD, then BASIC
- C) Limited hours per day on free tier

**Question**: Best approach for Guinea market?

---

## Technical Debt

### Should Fix Soon
- [ ] Add rate limiting to API endpoints
- [ ] Add request logging/analytics
- [ ] Implement proper error handling for stream failures
- [ ] Add stream health monitoring

### Nice To Have
- [ ] EPG (TV Guide) integration
- [ ] Channel favorites/watchlist
- [ ] Continue watching feature
- [ ] Multi-language UI support

---

## Files Created This Session

| File | Purpose |
|------|---------|
| `src/services/free-iptv.service.js` | Free channel aggregation |
| `src/services/curated-channels.service.js` | Tier management |
| `src/routes/free-channels.js` | Free channel API |
| `src/routes/curated-channels.js` | Curated channel API |
| `FREE_SOURCES_GUIDE.md` | Free source documentation |
| `DASH_STREAMING_ARCHITECTURE.md` | Full architecture doc |
| `IMPLEMENTATION_ROADMAP.md` | This file |

---

## Quick Reference Commands

### Test Endpoints
```bash
# Tiers
curl https://zion-production-39d8.up.railway.app/api/curated/tiers

# Stats
curl https://zion-production-39d8.up.railway.app/api/curated/stats

# Basic tier
curl https://zion-production-39d8.up.railway.app/api/curated/basic

# MEGA list
curl https://zion-production-39d8.up.railway.app/api/free/mega

# Search
curl "https://zion-production-39d8.up.railway.app/api/curated/search?q=sport&tier=PREMIUM"
```

### Deploy
```bash
# Backend (Railway auto-deploys on push)
cd /home/dash/zion-github/dash-streaming-server
git add -A && git commit -m "message" && git push

# Frontend (Vercel auto-deploys on push)
cd /home/dash/zion-github/dash-webtv
git add -A && git commit -m "message" && git push
```

---

*Last Updated: December 5, 2025*
