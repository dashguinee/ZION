# Asian & Chinese IPTV Sources - African/French Content Research

**Research Date**: 2025-12-08
**Focus**: Chinese and Asian IPTV aggregators carrying African/French premium content (Canal+, beIN Sports, SuperSport, TV5Monde)

---

## Executive Summary

Chinese IPTV aggregators are a goldmine for global content including premium African and French channels. They operate as massive playlist aggregators with 8,000+ channels from worldwide sources. Key advantage: they don't discriminate by region and often include Canal+, beIN Sports, SuperSport because they aggregate everything globally.

---

## 1. PRIMARY GITHUB AGGREGATORS

### 1.1 iptv-org/iptv (MOST COMPREHENSIVE)
- **URL**: https://github.com/iptv-org/iptv
- **Channels**: 8,000+ publicly available IPTV channels worldwide
- **Format**: M3U/M3U8
- **Update**: Daily automated updates

**Key Playlists**:
```
Main (All Channels):
https://iptv-org.github.io/iptv/index.m3u

By Country:
https://iptv-org.github.io/iptv/index.country.m3u
https://iptv-org.github.io/iptv/countries/dz.m3u (Algeria)
https://iptv-org.github.io/iptv/countries/ao.m3u (Angola)
https://iptv-org.github.io/iptv/countries/fr.m3u (France)

By Category:
https://iptv-org.github.io/iptv/index.category.m3u

By Language:
https://iptv-org.github.io/iptv/index.language.m3u
```

**EPG Support**:
- EPG repository: https://github.com/iptv-org/epg
- Database: https://github.com/iptv-org/database

**Geographic Notes**:
- Includes African countries (Algeria, Angola, South Africa, etc.)
- French channels (France 24, TV5Monde, Canal+)
- Arab World (beIN Sports)

---

### 1.2 Free-TV/IPTV
- **URL**: https://github.com/Free-TV/IPTV
- **Playlist**: https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8
- **Focus**: Free-to-air channels globally
- **Format**: M3U8

**French Channels Found**:
- TV5 Monde Info
- TV5 Monde FBS (France Belgium Switzerland)
- TV5 Monde Europe
- Africanews (French)
- France 24

**African Content**:
- Multiple African country channels
- Africanews feeds

---

### 1.3 Chinese Aggregator - fanmingming/live
- **URL**: https://github.com/fanmingming/live
- **Stars**: 26,600+ (highly popular)
- **Format**: M3U with EPG support
- **Features**: IPv4/IPv6 dual-stack, auto-updated

**Web Access**:
- Main: https://live.fanmingming.com
- Mirror: https://live.fanmingming.cn (CloudFlare CDN)

**Playlists**:
```
/tv/m3u/ (TV channels)
/radio/m3u/ (Radio stations)
```

**EPG Sources**: Integrated with multiple Chinese EPG providers

**Geographic Notes**:
- Primarily Chinese content (CCTV, provincial channels)
- Limited African/French content based on search results
- May include international streams in custom forks

---

### 1.4 iptv-sources Aggregator (m3u.ibert.me)
- **URL**: http://m3u.ibert.me/
- **Type**: Auto-updating IPTV playlist aggregator
- **Sources**: Aggregates from multiple GitHub repos including:
  - fanmingming/live
  - YueChan/Live
  - YanG-1989/m3u
  - Others

**Features**:
- Daily automatic updates
- M3U file generation
- EPG integration from multiple sources
- Deployment via GitHub Pages, Docker, Node.js

**Chinese CCTV List**: http://m3u.ibert.me/list/o_s_cn_cctv.list.html

---

### 1.5 SuperSport Specific - Mano33Starz/IPTVTHREE
- **URL**: https://github.com/Mano33Starz/IPTVTHREE/blob/main/SUPERSPORT.m3u
- **Focus**: South African SuperSport channels
- **Format**: M3U

**Channels Listed**:
- SuperSport Action HD
- SuperSport Blitz HD
- SuperSport Cricket HD
- SuperSport Football HD
- SuperSport Golf HD
- SuperSport Grandstand HD
- SuperSport LaLiga HD

**Geographic Notes**: South Africa-based, premium sports content

---

### 1.6 French IPTV - ipstreet312/freeiptv
- **URL**: https://github.com/ipstreet312/freeiptv
- **Format**: M3U with "bouquet" structure
- **Since**: 2021

**French Channels**:
- BFM
- CNEWS
- France 24
- Euronews
- TV5MONDE
- RTL channels (RTL TVI, RTL CLUB, RTL PLUG, BEL RTL)

**African Content**:
- BBLACK! AFRICA (music channel)
- Radio Africa No1 (French sport)
- Radio RTL France

**File**: all.m3u (centralizes all channels)

---

## 2. CHINESE EPG PROVIDERS

### 2.1 epg.pw (FREE EPG)
- **URL**: https://epg.pw/
- **Type**: Comprehensive TV Guide/EPG provider
- **Format**: JSON, XMLTV
- **Update**: Daily automatic updates

**Features**:
- Global TV schedules
- Free live streaming of channels
- M3U test playlists (updated every 2 hours)
- International channels including beIN Sports, Al Jazeera, ESPN, NBA TV

**Test Channels**: https://epg.pw/test_channel_list.html?lang=en

**EPG Files**:
- JSON format
- XMLTV format (compatible with most IPTV apps)

---

### 2.2 epg.112114.xyz
- **URL**: https://epg.112114.xyz/
- **EPG File**: https://epg.112114.xyz/pp.xml
- **Format**: XMLTV

**Usage**: Commonly referenced in Chinese IPTV playlists as EPG source

**Example Usage**:
```m3u
#EXTM3U url-tvg="https://epg.112114.xyz/pp.xml"
```

**GitHub References**:
- https://github.com/hang888888/hang88/blob/master/epg.112114.xyz.m3u
- Used by iptv-sources aggregator

**Chinese Channels**:
- IPTV3+, IPTV5+, IPTV6+
- IPTV少儿动画 (Kids Animation)
- IPTV热播剧场 (Popular Drama)
- IPTV经典电影 (Classic Movies)

---

## 3. IPTV CAT - STREAM SEARCH ENGINE

### 3.1 Main IPTV Cat Site
- **URL**: https://iptvcat.net/ and https://iptvcat.com/
- **Type**: IPTV stream aggregator and search engine
- **Update**: Daily checks and updates
- **Format**: M3U, M3U8

**Key Features**:
- Aggregates from publicly accessible sources
- Tests streams before listing
- Search functionality by channel name, country, category

---

### 3.2 Africa Streams
**URL**: https://iptvcat.net/africa/3

**Content**: 221+ African channels
- South Africa: https://iptvcat.com/south_africa
- Multiple African countries

---

### 3.3 beIN Sports Streams
**URLs**:
- General beIN: https://iptvcat.net/s/bein_sport__1
- beIN Sports: https://iptvcat.net/s/bein_sports
- beIN Sports 1: https://iptvcat.com/s/bein_sports_1
- beIN Sports France: https://iptvcat.net/s/bein_sports/france
- Arab Countries beIN: https://iptvcat.net/arab_countries__1/s/bein_sport__1

**Geographic Coverage**: France, Arab World, International feeds

---

### 3.4 GitHub M3U Lists
- **beIN Sports M3U**: https://gist.github.com/yasiralbeatiy/a078d245888ce7eb892e04d120f1420c
- Multiple user-submitted gists with beIN streams

---

## 4. TELEGRAM CHANNELS (Search Terms)

### 4.1 IPTV M3U Telegram Groups
**Search Keywords**:
- "IPTV m3u" - 966+ groups/channels
- "@IPTV_live_m3u" - Tataplay and international channels
- "@freeiptv25" - Free Premium IPTV
- "Worldwide IPTV 2.0" - Free/paid IPTV panels

**How to Find**:
1. Search Telegram for: "IPTV m3u"
2. Search: "IPTV China Africa"
3. Search: "beIN Sports IPTV"
4. Search: "Canal+ IPTV"

**Group Aggregators**:
- https://groupda.com/telegram/group/invite/IPTV_live_m3u
- https://telegroupslink.com/iptv-m3u-telegram-group-links/
- https://telegramlite.com/telegram-groups/detail/iptv-playlist

---

### 4.2 Chinese IPTV Telegram
- 360+ Chinese Telegram groups covering various topics
- Search terms: "中国 IPTV", "Chinese IPTV"
- Many groups share m3u playlists for global content

**Warning**: Telegram IPTV sources often contain copyrighted content without authorization

---

## 5. COMMERCIAL CHINESE IPTV PROVIDERS

### 5.1 StarTimes (Major African Player)
- **Operating Since**: 2008
- **Coverage**: Africa-wide
- **Market Share**: 19 million subscribers estimated by 2028
- **Pricing**: $3-5/month (ultra-competitive)
- **Competition**: Competes with Canal+/MultiChoice

**Geographic Notes**:
- Chinese-owned
- Major competitor to Canal+ in Africa
- 89% market share with Canal+ and MultiChoice combined

---

### 5.2 KyLinTV
- **Established**: 2004
- **Launch**: First Chinese IPTV in North America (2005)
- **Content**: China, Hong Kong, Taiwan channels
- **VOD**: 30,000+ hours
- **Target**: Overseas Chinese communities
- **Website**: https://www.kylintv.com/

**Geographic Notes**: North America, Europe - may not carry African content

---

### 5.3 UnBlockTech TV Box (UBOX)
- **Device**: UBOX 12 (8-core system)
- **Channels**: 1000+ Chinese live channels
- **Model**: One-time purchase, no monthly fees
- **Website**: https://www.unblocktechtv.com/
- **Target**: Overseas Chinese communities

**Note**: Primarily Chinese content, international channels limited

---

### 5.4 Chinese IPTV from Alibaba/Made-in-China
**Forum Reports** (Techkings):
- Price: £15-20/year
- Quality: "Extremely impressive"
- EPG: Works well
- Issues: Peak time buffering, slow channel loading
- Content: Vast quantity, good for sports

**African IPTV Products**:
- https://www.made-in-china.com/products-search/hot-china-products/Africa_Iptv.html
- Manufacturers: Various Chinese suppliers
- Target: African market with Arabic/French channel packages

---

## 6. CHINESE STREAMING FORUMS

### 6.1 Techkings Forum
- **URL**: https://www.techkings.org/
- **Discussion**: Chinese IPTV subscriptions from Alibaba
- **Price Reports**: £15-20/year for comprehensive packages
- **Quality**: 4K available, EPG works, vast channel selection
- **Caveat**: Peak time buffering during sports events

---

### 6.2 RedFlagDeals Forum (Canada)
- **URL**: https://forums.redflagdeals.com/
- **Focus**: Chinese/Asian IPTV for North American users
- **Discussed Providers**: OK2, OK3, Evpad, UnblockTech
- **Content**: Primarily Chinese channels (CCTV, Hong Kong, Taiwan)

---

## 7. TV5MONDE STREAM URLS (Direct)

**TV5Monde Europe**:
```
https://ott.tv5monde.com/Content/HLS/Live/channel(europe)/variant.m3u8
```

**TV5Monde France Belgium Switzerland Monaco HD**:
```
https://viamotionhsi.netplus.ch/live/eds/tv5mondefbs/browser-HLS8/tv5mondefbs.m3u8
```

**Source**: GitHub issues on iptv-org/iptv repository

---

## 8. IPTV PLAYLIST TOOLS

### 8.1 IPTV Playlist Aggregator
- **URL**: https://github.com/hmlendea/iptv-playlist-aggregator
- **Purpose**: Merge multiple IPTV playlists
- **Features**:
  - Deduplicate channels
  - Override channel metadata
  - Custom logos, TVG IDs
  - Merge from multiple sources

---

### 8.2 IPTVnator Player
- **URL**: https://github.com/4gray/iptvnator
- **Type**: Cross-platform IPTV player
- **Features**:
  - M3U/M3U8 support
  - Xtream Code support
  - Stalker portal support
  - External player (MPV, VLC)
  - EPG support
  - 16 languages including Chinese

---

### 8.3 Tuliprox
- **URL**: https://github.com/euzu/tuliprox
- **Type**: Flexible IPTV playlist processor & proxy in Rust
- **Features**:
  - M3U processing
  - Xtream Codes support
  - HDHomeRun support
  - Plex, Emby, Jellyfin integration
  - Filtering, merging, scheduling

---

## 9. PREMIUM IPTV SERVICES (Canal+, beIN)

### 9.1 French IPTV Providers with African Content

**ManisIPTV**:
- 31,000+ channels
- Canal+ and variations
- 4K quality streams
- Price: Premium tier

**WAWINTV**:
- 31,000+ channels
- 4K quality
- Multi-screen functionality
- Competitive rates

**IPTV SAT**:
- 31,000+ international channels
- Canal+ Sport
- Canal+ Cinéma
- Premium focus

**TeleCasta IPTV**:
- Canal+, beIN Sports, RMC Sport
- Ligue 1, Champions League coverage
- Price: €7.99 entry point

**Unio TV**:
- 38,000+ international channels
- Canal+, beIN Sports, RMC Sport, Eurosport
- European football, Asian dramas, American content

---

### 9.2 Canal+ Africa

**Coverage**: 7.6 million subscribers in Africa (33% of total subscribers)
- 50+ channels on Canal+ Afrique platform
- 200+ channels, radio stations group-wide

**Competition**:
- Canal+ / MultiChoice: 32 million estimated by 2028
- StarTimes (Chinese): 19 million estimated by 2028

**Geographic Presence**: Strongest in Africa

**EPG Discussion**: https://github.com/iptv-org/epg/issues/328 (Canal+ AFRIQUE et Caraïbes)

---

## 10. KEY FINDINGS FOR DASH-WEBTV

### 10.1 Best Chinese Sources for African/French Content

**Top Priority**:
1. **iptv-org/iptv** - Comprehensive, daily updates, includes Africa/France by country
2. **Free-TV/IPTV** - TV5Monde, France 24, Africanews confirmed
3. **iptvcat.net** - Search engine for beIN Sports, SuperSport, African streams
4. **epg.pw** - EPG + test streams, includes beIN Sports

**Secondary**:
- iptv-sources aggregator (combines multiple sources)
- GitHub user playlists (ipstreet312/freeiptv, schumijo/iptv)
- 112114.xyz EPG source

---

### 10.2 Content Availability

**Confirmed Available**:
- TV5Monde (multiple feeds)
- France 24
- Africanews (French)
- beIN Sports (multiple feeds)
- SuperSport channels (South Africa)
- RTL channels
- BBLACK! AFRICA

**Premium (Harder to Find)**:
- Canal+ channels (mostly via paid services)
- Full SuperSport lineup
- RMC Sport

---

### 10.3 Format Notes

**M3U/M3U8**: Universal format, works with all players
**HLS Streams**: Most common (.m3u8 URLs)
**EPG**: XMLTV format standard, multiple Chinese providers
**IPv6 Support**: Many Chinese sources support dual-stack

---

### 10.4 Integration Strategy

**For DASH-WebTV**:

1. **Automated Scraping**:
   - Monitor iptv-org/iptv repo (raw URLs)
   - Scrape iptvcat.net search results
   - Parse epg.pw test channels

2. **Manual Curation**:
   - GitHub gists for premium channels
   - Telegram channel monitoring
   - Forum source tracking

3. **EPG Integration**:
   - epg.pw API
   - 112114.xyz XMLTV
   - iptv-org/epg utilities

4. **Quality Control**:
   - Test stream availability before adding
   - Monitor uptime
   - Remove dead links automatically
   - Prioritize 720p+ streams

---

## 11. LEGAL CONSIDERATIONS

**Important Notes**:
- Many streams aggregate copyrighted content without authorization
- Free streams of premium channels (Canal+, beIN, SuperSport) likely unauthorized
- Legal varies by jurisdiction
- Chinese aggregators don't discriminate but may violate broadcasting rights
- Use at own risk

**Legitimate Sources**:
- TV5Monde (official free streams)
- France 24 (official free streams)
- Africanews (official free streams)
- National broadcaster streams (where free-to-air)

---

## 12. RECOMMENDED NEXT STEPS

### 12.1 Immediate Actions
1. Test iptv-org/iptv Africa country playlists
2. Extract beIN Sports URLs from iptvcat.net
3. Verify TV5Monde direct stream URLs
4. Monitor Free-TV/IPTV for updates

### 12.2 Automation
1. Build scraper for iptv-org/iptv raw files
2. Create iptvcat.net search integration
3. Set up EPG sync from epg.pw
4. Implement stream health checker

### 12.3 Manual Monitoring
1. Join key Telegram channels
2. Monitor GitHub gists for premium streams
3. Check Techkings forum monthly
4. Track m3u.ibert.me updates

---

## 13. USEFUL SEARCH TERMS (For Future Research)

### Chinese (for Google/Baidu):
- 中国 IPTV Canal+
- IPTV 国际频道
- 非洲电视直播
- 法语频道 IPTV

### English:
- "Chinese IPTV aggregator github"
- "iptv china m3u africa"
- "Asian IPTV France channels"
- "Chinese IPTV playlist 2025"
- "epg.pw beIN sports"
- "112114.xyz iptv"

### Telegram:
- IPTV m3u
- beIN Sports IPTV
- Canal+ IPTV
- SuperSport IPTV
- African IPTV

---

## SOURCES

Research compiled from:

- [iptv-org/iptv GitHub](https://github.com/iptv-org/iptv)
- [Free-TV/IPTV GitHub](https://github.com/Free-TV/IPTV)
- [fanmingming/live GitHub](https://github.com/fanmingming/live)
- [iptv-sources Aggregator](http://m3u.ibert.me/)
- [epg.pw - Free EPG](https://epg.pw/)
- [112114.xyz EPG](https://epg.112114.xyz/)
- [IPTV Cat](https://iptvcat.net/)
- [Techkings Forum - Chinese IPTV](https://www.techkings.org/threads/chinese-iptv.171701/)
- [Canal+ in Africa - The Africa Report](https://www.theafricareport.com/330987/canal-in-africa-an-aggressive-strategy/)
- [Best IPTV France Providers - Guru99](https://www.guru99.com/best-iptv-france.html)
- [Best IPTV for Sports - Guru99](https://www.guru99.com/best-iptv-for-sports.html)
- [Top IPTV China Guide - Sourcify](https://www.sourcifychina.com/top-iptv-guide-in-depth/)
- [IPTV M3U Guide - Sourcify](https://www.sourcifychina.com/iptv-m3u-guide-in-depth/)
- [Telegram IPTV M3U Groups](https://telegroupslink.com/iptv-m3u-telegram-group-links/)
- [RedFlagDeals Forums](https://forums.redflagdeals.com/)
- Various GitHub repositories and gists

---

**End of Research Document**

**Compiled by**: ZION SYNAPSE
**For**: DASH-WebTV Project
**Date**: 2025-12-08
