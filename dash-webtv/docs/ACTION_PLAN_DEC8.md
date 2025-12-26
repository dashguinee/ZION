# ACTION PLAN - December 8, 2025
## Next Session Implementation Guide
### Context Saved Before Auto-Compact

---

## EXECUTIVE SUMMARY

23 research agents deployed, 20 reports generated, 368KB of intel collected. Key finding: **60+ West African channels ready for immediate integration** with direct m3u8 URLs. Sierra Leone needs embed/partnership approach. Premium content (Canal+/SuperSport) requires official partnerships.

---

## PHASE 1: IMMEDIATE INTEGRATION (First Priority)

### Guinea Channels (6 Direct m3u8) - ADD FIRST
```javascript
const GUINEA_CHANNELS = [
  {
    id: 'espace-tv',
    name: 'Espace TV',
    country: 'Guinea',
    url: 'https://edge11.vedge.infomaniak.com/livecast/ik:espacetv/manifest.m3u8',
    quality: '1080p',
    stable: true
  },
  {
    id: 'kalac-tv',
    name: 'Kalac TV',
    country: 'Guinea',
    url: 'https://edge13.vedge.infomaniak.com/livecast/ik:kalactv/chunklist_w280736538.m3u8',
    quality: '1080p',
    stable: true
  },
  {
    id: 'rtg-1',
    name: 'RTG 1',
    country: 'Guinea',
    url: 'http://69.64.57.208/rtg/playlist.m3u8',
    quality: '480p',
    stable: true,
    needsProxy: true  // HTTP needs HTTPS proxy
  },
  {
    id: 'kaback-tv',
    name: 'Kaback TV',
    country: 'Guinea',
    url: 'https://guineetvdirect.online:3842/live/kabacktvlive.m3u8',
    quality: '720p',
    stable: false  // Test first
  },
  {
    id: 'fasso-tv',
    name: 'Fasso TV Kankan',
    country: 'Guinea',
    url: 'https://dvrfl06.bozztv.com/astv-fassotv/index.m3u8',
    quality: '720p',
    stable: false
  },
  {
    id: 'atv-guinea',
    name: 'ATV Guinea',
    country: 'Guinea',
    url: 'https://guineetvdirect.online:3320/live/atvguineelive.m3u8',
    quality: '400p',
    stable: false,
    note: 'Not 24/7'
  }
];
```

### Senegal Channels (4 Direct m3u8)
```javascript
const SENEGAL_CHANNELS = [
  {
    id: 'rts-1',
    name: 'RTS 1',
    country: 'Senegal',
    url: 'http://69.64.57.208/rts1/playlist.m3u8',
    quality: '720p',
    needsProxy: true
  },
  {
    id: '2stv',
    name: '2STV',
    country: 'Senegal',
    url: 'http://69.64.57.208/2stv/playlist.m3u8',
    quality: '720p',
    needsProxy: true
  },
  {
    id: 'tfm',
    name: 'TFM',
    country: 'Senegal',
    url: 'http://69.64.57.208/tfm/playlist.m3u8',
    quality: '720p',
    needsProxy: true
  },
  {
    id: 'walf-tv',
    name: 'Walf TV',
    country: 'Senegal',
    url: 'http://69.64.57.208/walftv/playlist.m3u8',
    quality: '720p',
    needsProxy: true
  }
];
```

### Ivory Coast Channels (3 Direct m3u8)
```javascript
const IVORY_COAST_CHANNELS = [
  {
    id: 'rti-1',
    name: 'RTI 1',
    country: 'Ivory Coast',
    url: 'http://69.64.57.208:8080/rti1/playlist.m3u8',
    quality: '1080p',
    needsProxy: true
  },
  {
    id: 'rti-2',
    name: 'RTI 2',
    country: 'Ivory Coast',
    url: 'http://69.64.57.208:8080/rti2/playlist.m3u8',
    quality: '720p',
    needsProxy: true
  },
  {
    id: 'a-plus-ivoire',
    name: 'A+ Ivoire',
    country: 'Ivory Coast',
    url: 'http://69.64.57.208/atv/playlist.m3u8',
    quality: '720p',
    needsProxy: true,
    note: 'Canal+ owned'
  }
];
```

### International French (2 Direct m3u8)
```javascript
const FRENCH_INTERNATIONAL = [
  {
    id: 'tv5monde',
    name: 'TV5Monde',
    country: 'International',
    url: 'https://ott.tv5monde.com/Content/HLS/Live/channel(fbs)/variant.m3u8',
    quality: '1080p',
    note: 'May be geo-blocked'
  },
  {
    id: 'france24-fr',
    name: 'France 24',
    country: 'International',
    url: 'https://viamotionhsi.netplus.ch/live/eds/france24/browser-HLS8/france24.m3u8',
    quality: '720p'
  }
];
```

---

## PHASE 2: SIERRA LEONE (Embed Approach)

Sierra Leone has 15 channels but 0 direct m3u8 URLs. Use embeds:

```javascript
const SIERRA_LEONE_EMBEDS = [
  {
    id: 'ayv-channel-33',
    name: 'AYV Channel 33',
    country: 'Sierra Leone',
    embedUrl: 'https://apps.coolstreaming.us/embed.php?id=63624',
    type: 'embed'
  },
  {
    id: 'ayv-youtube',
    name: 'AYV Media',
    country: 'Sierra Leone',
    youtubeChannel: 'https://www.youtube.com/@ayvsierraleone6042',
    type: 'youtube',
    note: 'Check for live streams'
  }
];
```

**Partnership targets for direct access:**
- AYV Media Empire: ayvnews.com
- SLBC (Government): slbc.gov.sl
- Star TV: mediaonecentre.com/startv

---

## PHASE 3: BULK PLAYLIST INTEGRATION

Add iptv-org playlists for expansion:

```javascript
const IPTV_ORG_PLAYLISTS = {
  // Priority Markets
  guinea: 'https://iptv-org.github.io/iptv/countries/gn.m3u',
  senegal: 'https://iptv-org.github.io/iptv/countries/sn.m3u',
  ivoryCoast: 'https://iptv-org.github.io/iptv/countries/ci.m3u',

  // English Corridor
  ghana: 'https://iptv-org.github.io/iptv/countries/gh.m3u',
  nigeria: 'https://iptv-org.github.io/iptv/countries/ng.m3u',
  liberia: 'https://iptv-org.github.io/iptv/countries/lr.m3u',

  // French Corridor
  cameroon: 'https://iptv-org.github.io/iptv/countries/cm.m3u',
  drc: 'https://iptv-org.github.io/iptv/countries/cd.m3u',
  mali: 'https://iptv-org.github.io/iptv/countries/ml.m3u',

  // Maghreb
  morocco: 'https://iptv-org.github.io/iptv/countries/ma.m3u',
  algeria: 'https://iptv-org.github.io/iptv/countries/dz.m3u',

  // Collections
  africa: 'https://iptv-org.github.io/iptv/regions/africa.m3u',
  french: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/fr.m3u',
  sports: 'https://iptv-org.github.io/iptv/categories/sport.m3u'
};
```

---

## PHASE 4: UI UPDATES

### New Category Tabs
```javascript
const AFRICA_CATEGORIES = [
  { id: 'guinea', name: '🇬🇳 Guinea', priority: 1 },
  { id: 'sierra-leone', name: '🇸🇱 Sierra Leone', priority: 2 },
  { id: 'senegal', name: '🇸🇳 Senegal', priority: 3 },
  { id: 'ivory-coast', name: '🇨🇮 Côte d\'Ivoire', priority: 4 },
  { id: 'west-africa', name: '🌍 West Africa', priority: 5 },
  { id: 'francophone', name: '🇫🇷 Francophone', priority: 6 }
];
```

---

## TECHNICAL NOTES

### HTTP Streams Need Proxy
Many streams use HTTP (not HTTPS). Proxy through Railway:
```javascript
const proxyStream = (url) => {
  if (url.startsWith('http://')) {
    return `https://zion-production-39d8.up.railway.app/api/proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};
```

### Stream Health Monitoring
```javascript
const checkStreamHealth = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    return response.ok;
  } catch {
    return false;
  }
};
```

---

## TELEGRAM INTELLIGENCE (For Manual Checking)

Check these channels for fresh playlists:
```
@amazingfreeiptvcodes   - DSTV + beIN Sports
@dailym3ufanatic        - Tested & curated
@ifixnet                - Sports daily
@dailyiptvm3u           - Worldwide
```

---

## PARTNERSHIP ROADMAP

### Week 1-2: Reach Out
1. **AVO TV** (www.avo.tv) - 120+ free channels, API access
2. **RTG Guinea** - Official stream partnership
3. **RTS Senegal** - Distribution deal

### Month 1-2: Premium Path
1. **Canal+ Developer Hub** (developers.canal-plus.com)
   - Catalog API available
   - RxPlayer open-source on GitHub
   - Partnership timing favorable (MultiChoice acquisition)

2. **StarTimes** - Guinea market reseller program

---

## FILES REFERENCE

| Document | Path |
|----------|------|
| This Action Plan | `/docs/ACTION_PLAN_DEC8.md` |
| Master Sources | `/docs/MASTER_SOURCES_CONSOLIDATED.md` |
| Strategy | `/docs/NORTH_STAR_AFRICA_CONQUEST.md` |
| Implementation Report | `/docs/IMPLEMENTATION_REPORT.md` |
| Canal+ Research | `/docs/CANAL_PLUS_RESEARCH_REPORT.md` |
| Sierra Leone | `/docs/SIERRA_LEONE_STREAMS.md` |
| Country Reports | `/docs/RESEARCH_*.md` (20 files) |

---

## QUICK START NEXT SESSION

```bash
# 1. Load context
cat /home/dash/zion-github/dash-webtv/docs/ACTION_PLAN_DEC8.md

# 2. Test Guinea streams
curl -I "https://edge11.vedge.infomaniak.com/livecast/ik:espacetv/manifest.m3u8"

# 3. Start implementation
cd /home/dash/zion-github/dash-webtv
# Add channels to backend, create category tabs
```

---

## SUMMARY

| Ready | Count | Priority |
|-------|-------|----------|
| Guinea m3u8 | 6 | IMMEDIATE |
| Senegal m3u8 | 4 | IMMEDIATE |
| Ivory Coast m3u8 | 3 | IMMEDIATE |
| International French | 2 | IMMEDIATE |
| Sierra Leone embeds | 2 | WEEK 1 |
| iptv-org playlists | 1,300+ | WEEK 2 |

**TOTAL READY: 15 direct streams + 2 embeds + 1,300 via playlists**

---

## STRATEGY REMINDER

**Two-Corridor Attack:**
- **English**: Sierra Leone → Liberia → Ghana → Lagos (200M)
- **French**: Guinea → Senegal → Ivory Coast → DRC (100M)
- **Final**: South Africa (MultiChoice home)

**Goal**: Free African people from Canal+/MultiChoice oligopoly before merger closes.

**Speed is the weapon.**

---

*Prepared: December 8, 2025*
*Status: Ready for implementation*
*Next session: Execute Phase 1 (15 direct streams)*
