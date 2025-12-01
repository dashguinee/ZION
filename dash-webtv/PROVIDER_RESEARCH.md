# DASH WebTV - Provider Infrastructure Research
**Date**: December 1, 2025
**Session**: Deep Dive into Provider Chain

---

## THE PROVIDER CHAIN (CONFIRMED)

```
CONTENT SOURCE (Netflix, Amazon, Disney, etc.)
        ↓
    OSTV.info (CDN/VOD Server Farm)
    ├── vod1.ostv.info
    ├── vod50.ostv.info
    ├── vod100.ostv.info ← Confirmed!
    └── ... (100+ servers)
        ↓
    GeoIPTV (Panel/Restream Provider)
        ↓
    STAR-NETWORK (Reseller Panel)
        ↓
    StarShare.cx (Your DNS/Brand)
        ↓
    AzizTest1 Account (Your Account)
        ↓
    DASH WebTV (Your App)
```

---

## VERIFIED FINDINGS

### Your Provider: StarShare
- **API Domain**: `starshare.cx` (behind Cloudflare)
- **Image/Assets Domain**: `starshare.live:8080` (Xtream Codes panel)
- **Alternative Domains**: `webhop.live:8080`, `starhub.pro`, `webop.live`
- **Welcome Message**: "Welcome to STAR-NETWORK"
- **Panel Software**: Xtream Codes / Xtream UI

### StarShare Identity
- Multiple domains: starshareiptv.net, starshareiptv.com, starshare-iptv.com, starsharelive.com
- Described as "Brand of GeoIPTV"
- Offers reseller panels with credit system (1 credit = 1 month)
- Claims 10,000+ channels, 39,000+ VOD, 5,000+ series
- Strong focus on South Africa/DSTV content

### Parent Provider: GeoIPTV
- Runs on Microsoft Cloud infrastructure
- Provides IPTV restream services
- Offers 10,500+ channels, 125,000+ movies, 7,000+ series
- Has servers in London, Amsterdam, Dubai, Asia
- Provides downstream restream (m3u links that allow multi-connections)

---

## HOW IPTV RESTREAM WORKS

### The Hierarchy
```
HOP0 → Original broadcast source (satellite, OTT provider)
  ↓
HOP1 → First-tier restream (very expensive, direct from source)
  ↓
HOP2 → Second-tier restream (GeoIPTV likely here)
  ↓
HOP3 → Panel providers (STAR-NETWORK)
  ↓
HOP4 → Resellers (StarShare.cx)
  ↓
HOP5 → End users
```

### Restream Technical Flow
1. **Source**: Content originates from Netflix, Amazon, etc.
2. **Capture**: First-tier providers capture/restream
3. **Distribution**: Restream providers (GeoIPTV) distribute to multiple panels
4. **Panel**: Panel providers (STAR-NETWORK) manage users, credits, branding
5. **Reseller**: Resellers (StarShare) purchase credits and sell subscriptions
6. **Consumer**: End users access via apps like DASH WebTV

### DNS Independence
Resellers get their own DNS (like starshare.cx) so:
- Their branding appears in URLs
- If upstream fails, they can switch providers
- Users don't see the actual infrastructure

---

## DATABASE ARCHITECTURE (Xtream Codes)

Based on [Xtream Codes Database Schema](https://github.com/ProTechEx/xtream-codes-decoded-v2.9/blob/master/database.sql):

```sql
-- Core Tables
streams (
  stream_id,
  target_container,  -- "mp4", "mkv", "avi"
  type,              -- 2=Movie, 5=Series
  ...
)

series (
  series_id,
  name,
  category_id,
  ...
)

series_episodes (
  episode_id,
  series_id,
  stream_id,  -- Links to streams table
  ...
)

stream_categories (
  category_id,
  category_name,
  ...
)
```

---

## API STRUCTURE

### Xtream Codes API Endpoints
Based on [Xtream Codes API](https://github.com/zaclimon/xipl/wiki/Xtream-Codes-API) and [py-xtream-codes](https://github.com/chazlarson/py-xtream-codes):

```
Base URL: https://starshare.cx/player_api.php

Authentication:
?username=XXX&password=XXX&action=user

Categories:
?action=get_live_categories
?action=get_vod_categories
?action=get_series_categories

Content Lists:
?action=get_live_streams
?action=get_vod_streams
?action=get_series

Content Details:
?action=get_vod_info&vod_id=XXX
?action=get_series_info&series_id=XXX
```

### Series Info Response (VERIFIED)
```json
{
  "episodes": {
    "1": [{
      "id": "18110",
      "container_extension": "mkv",  // <-- THE FORMAT!
      "title": "She - S01E01 - The Pickup",
      "info": {
        "duration": "00:32:52",
        "video": {...},
        "audio": {...}
      }
    }]
  }
}
```

**KEY INSIGHT**: `container_extension` is the authoritative source for episode format. Use this in the app instead of precomputed data!

---

## INFRASTRUCTURE DOMAINS FOUND

| Domain | Purpose | Count in M3U |
|--------|---------|--------------|
| starshare.cx | API/Stream delivery | 569,350 |
| starshare.live:8080 | Image/thumbnail hosting | 118,727 |
| webhop.live:8080 | Alt image hosting | 150,190 |
| image.tmdb.org | Movie posters (TMDB) | 186,676 |
| starhub.pro | Unknown (403 refs) | 403 |
| webop.live | Unknown (408 refs) | 408 |

---

## CONTENT SOURCES (Metadata)

Images are sourced from:
- TMDB (The Movie Database) - Official posters
- ZEE5/Hotstar CDN - Indian content
- YouTube thumbnails - Various
- Wikipedia - Some older content
- Custom uploads to starshare.live:8080

---

## IMPLICATIONS FOR DASH WEBTV

### 1. Format Detection
- **Do NOT rely on M3U precomputed data**
- **Use API `container_extension` field** when fetching series info
- Update `playEpisode()` to read format dynamically

### 2. Resilience
- If starshare.cx goes down, content URLs break
- Consider caching episode metadata locally
- Could implement fallback providers in future

### 3. Quality/Reliability
- You're at HOP4-5 in the chain
- Quality depends on all upstream providers
- No control over transcoding or format decisions

---

## OSTV Investigation - FOUND!

**Status**: CONFIRMED - OSTV is the actual CDN/VOD delivery layer!

### Discovery
User provided URL showing OSTV is the backend VOD server:
```
https://vod100.ostv.info/movie/AzizTest1/Test1/385215.mp4?token=...
```

### URL Comparison (Same Content, Different Layers)
| Layer | URL |
|-------|-----|
| StarShare (Panel) | `https://starshare.cx:443/movie/AzizTest1/Test1/385215.mp4` |
| OSTV (CDN) | `https://vod100.ostv.info/movie/AzizTest1/Test1/385215.mp4?token=...` |

### Key Observations
1. **Same credentials work** - AzizTest1/Test1 authenticates on both
2. **Same content IDs** - Movie 385215 is the same file
3. **Same path structure** - `/movie/user/pass/id.mp4`
4. **OSTV adds token** - Additional security layer
5. **Numbered subdomain (vod100)** - Load balancing across multiple VOD servers

### What This Reveals
```
UPDATED PROVIDER CHAIN:
━━━━━━━━━━━━━━━━━━━━━━━
CONTENT SOURCE (Netflix, Amazon, etc.)
        ↓
    OSTV.info (CDN/VOD Server Farm)  ← THE ACTUAL SERVERS!
    ├── vod1.ostv.info
    ├── vod50.ostv.info
    ├── vod100.ostv.info (confirmed)
    └── ... (likely 100+ VOD servers)
        ↓
    GeoIPTV (Panel/Restream Provider)
        ↓
    STAR-NETWORK (Reseller Panel)
        ↓
    StarShare.cx (Your DNS/Brand)
        ↓
    DASH WebTV
```

### OSTV Infrastructure Analysis
- **Domain**: ostv.info (no public website - pure infrastructure)
- **Server**: nginx
- **CDN Pattern**: `vod{N}.ostv.info` where N = server number
- **Token Auth**: Uses encrypted token for content access
- **No direct access**: Root domain returns 403 Forbidden

### Why This Matters
1. **StarShare.cx is just a DNS proxy** - requests get routed to OSTV servers
2. **OSTV is the actual storage/delivery layer** - where the MP4/MKV files live
3. **Token system** - OSTV validates each request with signed tokens
4. **Scale**: vod100 suggests 100+ VOD servers in the cluster
5. **Geolocation**: Likely servers in multiple regions for latency

---

## Sources

- [Xtream Codes Database Schema](https://github.com/ProTechEx/xtream-codes-decoded-v2.9/blob/master/database.sql)
- [Xtream Codes API Wiki](https://github.com/zaclimon/xipl/wiki/Xtream-Codes-API)
- [py-xtream-codes Implementation](https://github.com/chazlarson/py-xtream-codes)
- [StarShare IPTV](https://starshareiptv.net/)
- [GeoIPTV](https://vip.geoiptv.net/)
- [IPTV Restream Guide](https://www.wedostreaming.com/iptv-reseller/)

---

*Last updated: Dec 1, 2025 - Provider Research Complete*
