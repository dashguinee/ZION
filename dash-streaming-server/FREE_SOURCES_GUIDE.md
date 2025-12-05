# Free IPTV Sources Guide

## Overview

This document lists all free, legal streaming sources integrated into DASH WebTV.

## Integrated Sources

### 1. iptv-org (GitHub)

**URL**: https://github.com/iptv-org/iptv
**Status**: INTEGRATED
**Channels**: 8,000+ globally

Community-maintained collection of publicly available IPTV channels.

**Endpoints in DASH Backend**:
- `/api/free/channels` - All DASH priority channels
- `/api/free/guinea` - Guinea channels
- `/api/free/sports` - Sports channels
- `/api/free/french` - French language
- `/api/free/west-africa` - West African region

**M3U Sources Used**:
```
https://iptv-org.github.io/iptv/countries/gn.m3u  (Guinea)
https://iptv-org.github.io/iptv/categories/sports.m3u
https://iptv-org.github.io/iptv/languages/fra.m3u
```

### 2. Africa 24 Sport (Direct)

**URL**: https://africa24.vedge.infomaniak.com/livecast/ik:africa24sport/manifest.m3u8
**Status**: INTEGRATED
**Type**: HLS
**Legal**: Yes - Official broadcaster free tier

Pan-African sports news and highlights.

### 3. AfroSport Nigeria (Direct)

**URL**: https://newproxy3.vidivu.tv/vidivu_afrosport/index.m3u8
**Status**: INTEGRATED
**Type**: HLS
**Legal**: Yes - Official broadcaster

Nigerian sports coverage.

## Not Yet Integrated (Research)

### FIFA+ (Official FIFA Streaming)

**URL**: https://www.fifa.com/fifaplus
**Status**: NOT INTEGRATED - No public API
**Content**:
- Live matches from 230+ competitions
- 100+ Football Associations
- African leagues (Gambia, Sierra Leone, Mali, etc.)
- FIFA World Cup archives
- Documentaries

**Why Not Integrated**:
FIFA+ is a web-only streaming service without a public API.
Would require web scraping which may violate ToS.

**Alternative**: Users can watch FIFA+ directly at fifa.com/fifaplus

### France 24 (Direct)

**URL**: Available via iptv-org
**Status**: Available in French channels

### DW (Deutsche Welle)

**URL**: Available via iptv-org
**Status**: Available in news channels

## Guinea-Specific Channels

From iptv-org, found these Guinea channels:

| Channel | URL | Quality |
|---------|-----|---------|
| ATV | guineetvdirect.online:3320/live/atvguineelive.m3u8 | 400p |
| Espace TV | edge11.vedge.infomaniak.com/livecast/ik:espacetv/manifest.m3u8 | 1080p |
| Fasso TV Kankan | dvrfl06.bozztv.com/astv-fassotv/index.m3u8 | SD |
| Kaback TV | guineetvdirect.online:3842/live/kabacktvlive.m3u8 | 720p |
| Kalac TV | edge13.vedge.infomaniak.com/livecast/ik:kalactv/chunklist.m3u8 | 1080p |
| RTG 1 | 69.64.57.208/rtg/playlist.m3u8 | SD |

## Sports Channels (African Focus)

From iptv-org sports category:

| Channel | Description | Legal |
|---------|-------------|-------|
| Africa 24 Sport | Pan-African sports news | Yes |
| AfroSport Nigeria | Nigerian sports | Yes |
| CBS Sports Golazo | Football/soccer focus | Yes |
| beIN Sports XTRA | Free sports tier | Yes |

## How to Add New Sources

1. **Find M3U source** from iptv-org or direct broadcaster
2. **Test stream URL** using `/api/free/test?url=...`
3. **Add to free-iptv.service.js** in `officialSports` or parsing logic
4. **Deploy** to Railway

## Legal Considerations

All integrated sources are:
- Official broadcaster free tiers
- Community-curated legal streams (iptv-org)
- Public service broadcasters

We do NOT integrate:
- Pirated streams
- Geo-blocked bypass streams
- Paid content without license

---
*Last Updated: December 2025*
