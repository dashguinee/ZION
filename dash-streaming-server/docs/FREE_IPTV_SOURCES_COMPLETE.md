# FREE IPTV SOURCES - Complete Documentation

> **Why This Exists**: This documents the FREE, LEGAL, and OPEN SOURCE tools that power 81,000+ channels in DASH WebTV. These are the same sources that paid IPTV panels like StarShare repackage and sell.

---

## THE BIG PICTURE

```
FREE PUBLIC SOURCES (What we use)
         |
         v
+------------------+     +------------------+     +------------------+
|   iptv-org       |     |  Scraper Zilla   |     |    PlutoTV       |
|   9,000+ ch      |     |  20,000+ ch      |     |    328 ch        |
|   CC0 License    |     |  MIT License     |     |    100% Legal    |
+------------------+     +------------------+     +------------------+
         |                       |                       |
         v                       v                       v
+------------------------------------------------------------------+
|                    DASH WebTV Backend                             |
|              /api/free/* endpoints                                |
|                 81,922+ channels                                  |
+------------------------------------------------------------------+
         |
         v
+------------------------------------------------------------------+
|                    DASH WebTV Frontend                            |
|              Customer sees: "DASH Premium+"                       |
|              Doesn't know about underlying sources                |
+------------------------------------------------------------------+
```

**The Truth About IPTV Panels**: Services like StarShare do the EXACT same thing - they aggregate these free sources, add a login system, and charge $10-50/month. The "premium" channels that keep going down? Those are the pirated ones they actually crack.

---

## SOURCE 1: IPTV-ORG (The Motherlode)

### What Is It?
The largest community-maintained collection of publicly available IPTV channels. Run by volunteers on GitHub.

### Key Facts
| Attribute | Value |
|-----------|-------|
| **Channels** | 9,000+ live streams |
| **License** | CC0 (Public Domain) - Use however you want |
| **Updates** | Community-driven, multiple times daily |
| **Legal Status** | Aggregates publicly broadcast streams |
| **GitHub** | https://github.com/iptv-org/iptv |
| **Contributors** | 369+ people |

### Why Is It Open Source?
- **CC0 License** = Public Domain = No restrictions
- Community believes public broadcasts should be accessible
- Contributors from 100+ countries
- Non-profit, educational purpose

### Main Playlists
```
# ALL channels (massive file)
https://iptv-org.github.io/iptv/index.m3u

# By Category
https://iptv-org.github.io/iptv/categories/sports.m3u
https://iptv-org.github.io/iptv/categories/news.m3u
https://iptv-org.github.io/iptv/categories/movies.m3u
https://iptv-org.github.io/iptv/categories/music.m3u
https://iptv-org.github.io/iptv/categories/entertainment.m3u
https://iptv-org.github.io/iptv/categories/kids.m3u

# By Region
https://iptv-org.github.io/iptv/regions/afr.m3u  (Africa)
https://iptv-org.github.io/iptv/regions/eur.m3u  (Europe)
https://iptv-org.github.io/iptv/regions/amr.m3u  (Americas)
https://iptv-org.github.io/iptv/regions/asi.m3u  (Asia)

# By Country
https://iptv-org.github.io/iptv/countries/gn.m3u  (Guinea)
https://iptv-org.github.io/iptv/countries/sn.m3u  (Senegal)
https://iptv-org.github.io/iptv/countries/fr.m3u  (France)
https://iptv-org.github.io/iptv/countries/us.m3u  (USA)
```

### Our Integration
```javascript
// In free-iptv.service.js
this.iptvOrgApi = 'https://iptv-org.github.io/api';
// Endpoints: /channels.json, /countries.json, /categories.json, /streams.json
```

---

## SOURCE 2: IPTV SCRAPER ZILLA (The Bot Crawler)

### What Is It?
**THIS IS THE CRAWLER YOU ASKED ABOUT.**

An automated bot that scrapes IPTV channel links from across the internet and generates M3U playlists. Runs every HOUR via GitHub Actions.

### Key Facts
| Attribute | Value |
|-----------|-------|
| **Channels** | 20,000+ (varies as sources change) |
| **License** | MIT License - Free to use, modify, distribute |
| **Updates** | **EVERY HOUR** via GitHub Actions |
| **Legal Status** | Educational purposes (MIT disclaimer) |
| **GitHub** | https://github.com/abusaeeidx/IPTV-Scraper-Zilla |
| **Creator** | abusaeeidx |

### How The Bot Works
```
1. GitHub Actions triggers every hour
2. Bot visits known IPTV sources (websites, APIs, other repos)
3. Extracts M3U/M3U8 stream URLs
4. Validates streams are working
5. Generates organized playlists
6. Commits to GitHub repo
7. Available instantly via raw.githubusercontent.com
```

### Available Playlists (All Auto-Updated Hourly)
```
# MASTER LIST - All channels combined
https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/combined-playlist.m3u

# By Category
https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/sports.m3u
https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/movies.m3u
https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/anime.m3u

# By Source (streaming services it scrapes FROM)
https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/PlutoTV-All.m3u
https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/Roku-All.m3u
https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/SamsungTVPlus-All.m3u
https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/CricHD.m3u
https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/SportsWebcast.m3u

# By Region
https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/JapanTV.m3u8
https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/BD.m3u
```

### Why Is It Open Source?
- MIT License = Do whatever you want
- Creator states: "For educational purposes only"
- "The developer does not host or distribute any media content"
- Just aggregates publicly available links

### Our Integration
```javascript
// In free-iptv.service.js
this.scraperZilla = {
  combined: 'https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/combined-playlist.m3u',
  sports: 'https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/sports.m3u',
  movies: 'https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/movies.m3u',
  anime: 'https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/anime.m3u'
}

// API endpoints
GET /api/free/zilla/combined   // All 20K+ channels
GET /api/free/zilla/sports     // Sports only
GET /api/free/zilla/movies     // Movies only
GET /api/free/zilla/anime      // Anime only
```

### Can We Run It Ourselves?
**YES.** It's open source. You could:
1. Fork the repo
2. Modify the scraping sources
3. Run your own GitHub Actions
4. Have your own hourly-updated playlists

But honestly, just using their raw URLs is easier and free.

---

## SOURCE 3: PLUTO TV (Legal Corporate Streaming)

### What Is It?
A FREE, AD-SUPPORTED streaming service owned by **Paramount Global**. 100% legal. No piracy.

### Key Facts
| Attribute | Value |
|-----------|-------|
| **Channels** | 250+ unique live channels |
| **On-Demand** | 20,000+ hours of content |
| **Price** | FREE (ad-supported) |
| **Owner** | Paramount Global (CBS, MTV, Nickelodeon) |
| **Legal Status** | 100% LEGAL - Licensed content |
| **Available In** | US, UK, Germany, France, Canada, Latin America |

### How It Works
- No account required (can create one for extra features)
- Watch in browser or app
- Ads play like regular TV (every 10-15 min)
- Content from: Comedy Central, AMC, Nickelodeon, MTV, Paramount Studios
- Shows: Cheers, Frasier, Star Trek, Paramount movies

### Why Is It Free?
Paramount makes money from ads. They'd rather have you watch free with ads than pirate without ads.

### Our Integration
PlutoTV streams are included in Scraper Zilla's playlists:
```
https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/PlutoTV-All.m3u
```

We serve 328 PlutoTV channels via:
```
GET /api/free/plutotv
```

### Sources
- [What is Pluto TV? - Tom's Guide](https://www.tomsguide.com/news/pluto-tv)
- [Pluto TV Wikipedia](https://en.wikipedia.org/wiki/Pluto_TV)
- [Is Pluto TV Free? - Trusted Reviews](https://www.trustedreviews.com/explainer/what-is-pluto-tv)

---

## SOURCE 4: FREE-TV (Curated Quality)

### What Is It?
A curated collection focused on QUALITY over quantity. Hand-picked working streams.

### Key Facts
| Attribute | Value |
|-----------|-------|
| **Channels** | 1,851 (quality-focused) |
| **Philosophy** | "Less channels = better quality" |
| **Updates** | Community pull requests |
| **GitHub** | https://github.com/Free-TV/IPTV |
| **Coverage** | 60+ countries |

### Playlists
```
# Main playlist
https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8

# By region in their repo structure
```

### Our Integration
```
GET /api/free/freetv
```

---

## SOURCE 5: M3U/M3U8 FORMAT (The Standard)

### What Is M3U?
M3U (MP3 URL or Moving Picture Experts Group Audio Layer 3 Uniform Resource Locator) is a playlist file format. M3U8 is the UTF-8 encoded version.

### Format Example
```m3u
#EXTM3U
#EXTINF:-1 tvg-id="CNN.us" tvg-logo="https://logo.url" group-title="News",CNN
https://stream.url/cnn/playlist.m3u8
#EXTINF:-1 tvg-id="BBC.uk" tvg-logo="https://logo.url" group-title="News",BBC
https://stream.url/bbc/playlist.m3u8
```

### Key Fields
- `#EXTINF:-1` - Duration (-1 = live stream)
- `tvg-id` - EPG ID for program guide
- `tvg-logo` - Channel logo URL
- `group-title` - Category grouping
- Last line - Actual stream URL (HLS/MPEG-TS)

### Stream Types
| Extension | Type | Use |
|-----------|------|-----|
| `.m3u8` | HLS playlist | Modern, adaptive bitrate |
| `.ts` | MPEG Transport Stream | Raw video stream |
| `.mp4` | Direct file | VOD content |

---

## WHY IS ALL THIS OPEN SOURCE?

### The Philosophy
1. **Public broadcasts should be public** - Many channels already broadcast free over-the-air
2. **Community effort** - 1000s of contributors maintaining working links
3. **Educational** - Learning how streaming works
4. **Against paywalls** - Belief that basic TV shouldn't cost money

### The Legal Reality
- **iptv-org**: CC0 (public domain) - Zero restrictions
- **Scraper Zilla**: MIT License - "Educational purposes"
- **PlutoTV**: 100% legal, owned by Paramount
- **Free-TV**: Open source, community curated

### The Gray Area
Some streams in these playlists ARE pirated (sports events, premium channels). The projects disclaim responsibility:
> "We do not host any content. We just aggregate publicly available links."

This is the same defense torrent sites use. Legal? Technically aggregating links is legal in most places. Using pirated streams? That's on the user.

---

## OUR ENDPOINTS SUMMARY

| Endpoint | Source | Channels | Update Frequency |
|----------|--------|----------|------------------|
| `/api/free/ultimate` | ALL COMBINED | 81,922+ | On request |
| `/api/free/channels` | DASH curated | ~100 | Manual |
| `/api/free/guinea` | iptv-org | 6 | Daily |
| `/api/free/sports` | iptv-org | 500+ | Daily |
| `/api/free/movies/top` | iptv-org | 4,000+ | Daily |
| `/api/free/zilla/combined` | Scraper Zilla | 20,000+ | Hourly |
| `/api/free/zilla/sports` | Scraper Zilla | 2,000+ | Hourly |
| `/api/free/plutotv` | PlutoTV | 328 | Daily |
| `/api/free/freetv` | Free-TV | 1,851 | Weekly |

---

## BUSINESS IMPLICATIONS

### What StarShare Actually Does
1. Aggregates these same free sources
2. Adds some cracked premium channels (Canal+, BeIN, DSTV)
3. Creates nice UI
4. Adds username/password system
5. Charges $10-50/month

### What DASH Can Do
1. Use free sources for base content (81K channels)
2. Add StarShare for premium VOD/Series
3. Own the customer relationship
4. Own the billing
5. When StarShare channels go down, free sources stay up

### The Insight
> "The panels are basically just routing those free APIs that we just found and they create their own panels."

**You're 100% correct.** That's exactly the business model.

---

## FILES IN OUR CODEBASE

```
dash-streaming-server/
├── src/
│   ├── services/
│   │   ├── free-iptv.service.js      # Main service (1300+ lines)
│   │   └── curated-channels.service.js
│   └── routes/
│       └── free-channels.js          # API endpoints
├── docs/
│   └── FREE_IPTV_SOURCES_COMPLETE.md # THIS FILE
└── DASH_STREAMING_ARCHITECTURE.md    # System overview
```

---

*Last Updated: December 5, 2025*
*Documented by: ZION SYNAPSE*
