# DASH WebTV - Complete IPTV Architecture Documentation

## Last Updated: 2025-11-26

---

## 1. CONTENT INVENTORY (Full Account)

| Content Type | Count | File Extensions | Browser Compatible |
|-------------|-------|-----------------|-------------------|
| **Movies** | 58,216 | .mp4 (44,167), .mkv (13,581), .avi (456) | MP4: Yes, MKV/AVI: Need HLS transcode |
| **Series Episodes** | 500,999 | .mp4 (439,326), .mkv (60,696), .avi (668) | MP4: Yes, MKV/AVI: Need HLS transcode |
| **Live TV Channels** | 10,456 | .m3u8 (HLS) | YES - Native browser support |
| **TOTAL** | **569,671** items | | |

---

## 2. URL STRUCTURE

### Base URL
```
https://starshare.cx:443
```

### Authentication Pattern
```
/{content_type}/{username}/{password}/{stream_id}.{extension}
```

### Content Types

| Type | URL Pattern | Example |
|------|-------------|---------|
| **Movies** | `/movie/{user}/{pass}/{id}.{ext}` | `/movie/AzizTest1/Test1/385215.mp4` |
| **Series** | `/series/{user}/{pass}/{id}.{ext}` | `/series/AzizTest1/Test1/130248.mp4` |
| **Live TV** | `/live/{user}/{pass}/{id}.{ext}` | `/live/AzizTest1/Test1/620457.m3u8` |

### HLS vs MPEGTS (for Live TV)
- **HLS (.m3u8)** - Browser native support via hls.js
- **MPEGTS (.ts)** - Requires transcoding, NOT recommended for web

---

## 3. SERVER BEHAVIOR

### Direct Requests (no redirect)
- **Movies (MP4)**: HTTP 200, `content-type: video/mp4`
- **Live TV (HLS)**: HTTP 200, `content-type: application/vnd.apple.mpegurl`

### Redirect Behavior (some content)
- **Series**: HTTP 302 redirect to CDN servers (vod149.ostv.info, etc.)
- **Redirect includes**: `access-control-allow-origin: *` (CORS OK!)
- **Token-based**: URL includes `?token=...` for authorization

### CDN Servers Observed
- `vod76.ostv.info` - VOD content
- `vod149.ostv.info` - Series content
- `live6.ostv.info` - Live streams (if redirected)

---

## 4. BROWSER COMPATIBILITY

### Native Support (works in `<video>` tag)
| Format | Browser Support | Notes |
|--------|----------------|-------|
| MP4 (H.264) | All browsers | Direct playback |
| WebM | All browsers | Direct playback |
| HLS (.m3u8) | Safari native, others via hls.js | Use Video.js or hls.js |

### Requires Transcoding
| Format | Solution |
|--------|----------|
| MKV | Request `.m3u8` instead - server transcodes |
| AVI | Request `.m3u8` instead - server transcodes |
| FLV | Request `.m3u8` instead - server transcodes |

### MKV Transcoding Example
```javascript
// Original: https://starshare.cx/movie/user/pass/12345.mkv
// Browser-compatible: https://starshare.cx/movie/user/pass/12345.m3u8
// Server automatically transcodes to HLS!
```

---

## 5. CORS ANALYSIS

### What Works
| Method | CORS | Notes |
|--------|------|-------|
| `<video src="...">` | BYPASSES CORS | Native media element |
| `<video>` + hls.js | Works | hls.js handles segments |
| `fetch()` to API | Blocked | Use proxy for API calls |

### Key Insight
**Video elements bypass CORS** - This is why VLC and direct `<video>` tags work even when `fetch()` is blocked.

---

## 6. PLAYLIST FORMATS ANALYSIS

### Available Formats from Panel

| Format | Size | Best For | Has Metadata |
|--------|------|----------|--------------|
| **M3U with Options - HLS** | 157MB | **BEST** - Full metadata | Posters, Categories |
| **WebTV List - HLS** | 59MB | Simple parsing | Name + URL only |
| **Starlive v5 (.jason/JSON)** | 81MB | App integration | Name + URL only |
| M3U with Options - MPEGTS | 157MB | NOT for web | Same as HLS |
| WebTV List - MPEGTS | 59MB | NOT for web | Same as HLS |

### M3U with Options Structure (RECOMMENDED)
```
#EXTM3U
#EXTINF:-1 tvg-id="" tvg-name="Movie Name (2025)" tvg-logo="https://image.tmdb.org/t/p/w600..." group-title="NETFLIX",Movie Name (2025)
https://starshare.cx:443/movie/AzizTest1/Test1/12345.mp4
```

**Fields available:**
- `tvg-name` - Display title
- `tvg-logo` - TMDB poster URL (already included!)
- `group-title` - Category (NETFLIX, AMAZON PRIME, etc.)
- URL - Direct playable stream

### WebTV List Structure (Simple)
```
Channel name:Movie Name (2025)
URL:https://starshare.cx:443/movie/AzizTest1/Test1/12345.mp4
```

### JSON Structure (Starlive v5)
```json
{
  "iptvstreams_list": {
    "@version": 1,
    "group": {
      "name": "IPTV",
      "channel": [
        {
          "name": "Movie Name",
          "icon": "",
          "stream_url": "https://starshare.cx/...",
          "stream_type": 0
        }
      ]
    }
  }
}
```

---

## 7. CATEGORIES (Top 50 by Content Count)

| Category | Count | Type |
|----------|-------|------|
| NETFLIX | 33,153 | Series/Movies |
| AMAZON PRIME | 29,472 | Series/Movies |
| ENGLISH 1999-2020 | 16,974 | Movies |
| TURKISH | 16,625 | Series/Movies |
| ZEE KANNADA | 14,986 | Series |
| ZEE TELUGU | 14,728 | Series |
| ZEE TV | 14,365 | Series |
| STAR MAA | 13,404 | Series |
| STAR PLUS | 12,793 | Series |
| DISNEY+HOTSTAR | 12,691 | Series/Movies |
| HULU | 6,572 | Series/Movies |
| HBO MAX | 5,465 | Series/Movies |
| APPLE TV+ | 5,030 | Series/Movies |
| KIDS | 3,960 | Series/Movies |

---

## 8. XTREAM PANEL INSIGHTS (from Screenshots)

### Reseller Dashboard
- **URL**: `https://starshare.org:2096/reseller.php`
- **Account**: Dashgn (15 credits)
- **Active Accounts**: 42
- **Shows**: Expiring lines, recent activity

### User Management
- **URL**: `https://starshare.org:2096/users.php`
- **Test Accounts**:
  - AzizTest1 / Test1 (expires 2025-11-26)
  - Aziz - Test 2 / Test 2 (expires 2026-01-16)
- **Fields**: Max connections, expiry, trial status

### Bouquet Selection
- Can assign specific content packages to users
- "Select all" / "Deselect all" buttons
- Special packages:
  - "ALL VOD MOVIES + SERIES (REMOVE CAM MOVIES) (NO LIVE)"
  - "SERIES | SERIES (ALL SERIES)"
  - "MOVIES | MOVIES (VOD ALL)"

### Playlist Download Options
- **WebTV List - HLS** - For web browsers
- **WebTV List - MPEGTS** - For set-top boxes
- **Octagon Auto Script** - For Enigma2 devices
- **m3u With Options** - Full metadata
- **Starlive v5** - JSON format

### Link Types Generated
- M3U Links With Categories
- M3U Without Categories
- Enigma2 Autoscript
- **WebTV List** - `type=webtvlist`

---

## 9. IMPLEMENTATION STRATEGY

### Option A: Use Xtream Codes API (Current Approach)
```javascript
// API calls via Vercel proxy
const url = `/api/proxy?action=get_vod_streams&category_id=123`
// Returns JSON with stream info
// Then build direct URLs for playback
```

**Pros**: Dynamic, always up-to-date, organized by categories
**Cons**: Needs proxy for API calls, extra requests

### Option B: Pre-parsed M3U Database
```javascript
// Parse M3U once, store in JSON/SQLite
// Serve static JSON files by category
// Direct URLs already included
```

**Pros**: Fast, no API calls needed, works offline
**Cons**: Needs periodic refresh, larger initial load

### Option C: Hybrid Approach (RECOMMENDED)
1. **Use M3U for static data** (movies, series catalog)
2. **Use API for dynamic data** (live TV EPG, new releases)
3. **Direct URLs for playback** (no proxy needed for video)

---

## 10. VIDEO PLAYER IMPLEMENTATION

### For MP4 Content
```html
<video controls>
  <source src="https://starshare.cx/movie/user/pass/12345.mp4" type="video/mp4">
</video>
```

### For HLS Content (Live TV, Transcoded MKV)
```javascript
import Hls from 'hls.js';

const video = document.getElementById('video');
const hls = new Hls();
hls.loadSource('https://starshare.cx/live/user/pass/12345.m3u8');
hls.attachMedia(video);
```

### Using Video.js (Current Implementation)
```javascript
const player = videojs('player', {
  sources: [{
    src: streamUrl,
    type: streamUrl.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'
  }]
});
```

---

## 11. PRODUCTION CHECKLIST

- [ ] Parse M3U with Options - HLS for full catalog
- [ ] Build category index from group-title
- [ ] Extract TMDB poster URLs from tvg-logo
- [ ] Implement search across all content
- [ ] Handle MKV → m3u8 transcoding requests
- [ ] Test Live TV direct HLS playback
- [ ] Implement user authentication (dynamic credentials)
- [ ] Add favorites/watchlist functionality
- [ ] Progressive loading for large catalogs

---

## 12. TEST CREDENTIALS

**Current Test Account:**
- Username: `AzizTest1`
- Password: `Test1`
- Server: `https://starshare.cx:443`
- Expires: 2025-11-26

**Backup Test Account:**
- Username: `Aziz - Test 2`
- Password: `Test 2`
- Expires: 2026-01-16

---

## 13. KEY URLS

| Resource | URL |
|----------|-----|
| **Starshare Panel** | https://starshare.org:2096 |
| **Stream Server** | https://starshare.cx:443 |
| **DASH WebTV** | https://dash-webtv.vercel.app |
| **GitHub Repo** | github.com/dashguinee/ZION |

---

*This document contains everything needed to build and maintain the DASH WebTV streaming platform.*
