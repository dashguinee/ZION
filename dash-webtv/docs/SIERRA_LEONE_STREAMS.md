# Sierra Leone TV Streams - Research Report

**Research Date:** December 8, 2025
**Purpose:** DASH WebTV Sierra Leone Beachhead
**Status:** Partial Success - Limited public stream URLs available

---

## Executive Summary

Investigated 5+ sources for Sierra Leone TV stream URLs. Found **15 Sierra Leone TV channels** registered in the iptv-org database, but **most do not have publicly accessible direct stream URLs**. The channels primarily operate through:
- Official websites with embedded players (no direct URLs exposed)
- Mobile apps (AYV Media Empire app, Star TV LIVE app)
- Satellite services (DSTV, StarTimes, Free-to-air Multi TV)
- Social media live streaming (YouTube, Facebook)

---

## Identified Channels

### 1. AYV TV (Channel 33 - News)
**Owner:** African Young Voices International
**Type:** General/News
**Official Site:** https://ayvnews.com/
**Channel Page:** https://ayvnews.com/channel-33/

**Direct Stream URL:** Not publicly available
**Access Methods:**
- AYV Media Empire app (Android): https://play.google.com/store/apps/details?id=com.ayvnews.ayvmediaempire&hl=en
- DSTV Channel 399
- Free-to-air Multi TV Box Channel 101
- YouTube: https://www.youtube.com/@ayvsierraleone6042 (may have live streams)
- **CoolStreaming Embed:** https://apps.coolstreaming.us/embed.php?id=63624

**Embed Code:**
```html
<iframe src="https://apps.coolstreaming.us/embed.php?id=63624&w=700&h=290" width="700" height="290" frameborder="0" allowfullscreen></iframe>
```

**Notes:** Sierra Leone's fastest-growing TV network. First Sierra Leonean channel on world-leading satellite platform.

---

### 2. AYV TV Entertainment (Channel 34)
**Owner:** African Young Voices International
**Type:** Entertainment
**Official Site:** https://ayvnews.com/channel-34/

**Direct Stream URL:** Not publicly available
**Access Methods:**
- AYV Media Empire app (same as Channel 33)
- Embedded players on third-party sites:
  - https://tvchannels.live/ayv-entertainment/
  - https://www.squidtv.net/africa/sierra-leone/sierra-leone-001.html
  - https://icanlive.tv/live/14826/ayv-news.html

**Content:** Music programs, talk shows, movies, dramas, animated series

**IPTV Database Entry:** Found in iptv-org/database
**Quality Reported:** 720p (from iptvcat.net - AYV TV Channel 34)
**Status:** Listed as "Not 24/7"

---

### 3. SLBC TV (Sierra Leone Broadcasting Corporation)
**Owner:** Government of Sierra Leone
**Type:** National Broadcaster
**Official Site:** https://www.slbc.gov.sl/
**Live Page:** https://www.slbc.gov.sl/live/

**Direct Stream URL:** Not publicly available
**Access Methods:**
- Official SLBC website live page
- Third-party embeds:
  - https://television-live.com/4946-slbc.html
  - https://snradio.net/live-video-from-slbc-tv/ (certificate expired as of Dec 8, 2025)

**Notes:** National radio and television broadcaster. Broadcasts from Freetown headquarters. Regional FM stations in Bo, Kenema, Kailahun, Makeni, Magburaka, and Koidu.

**Leadership:** Josephine Kamara (Director-General, appointed March 2024 - first woman to lead the institution)

---

### 4. KTV Sierra Leone
**Owner:** Independent
**Type:** Entertainment/News
**Official Site:** https://ktvsl.com/

**Direct Stream URL:** Not publicly available
**Access Methods:**
- Online Radio Box: https://onlineradiobox.com/sl/ktvsl/ (radio only)
- Live Online Radio: https://liveonlineradio.net/ktv-sierra-leone
- RadioLy App: https://radioly.app/radio/sl.ktvsl/
- Listed on television-live.com

**Content:** African politics, business, global technology, entertainment, health, social media
**Focus:** Peace and development, youth issues, SGBV cases, anti-corruption

**Notes:** Primarily operates as web radio/TV platform. Mixlr page currently inactive.

---

### 5. STAR TV SL (Channel 21)
**Owner:** Media One Centre
**Type:** General
**Official Site:** https://mediaonecentre.com/startv

**Direct Stream URL:** Not publicly available
**Access Methods:**
- StarTimes platform: https://m.startimestv.com/browser/liveDetail?channelId=1881634769
- STAR TV LIVE app (Google Play): https://play.google.com/store/apps/details/STAR_TV_LIVE?id=com.streammedia.startvlive&hl=en_ZA

**Reach:** 7+ million viewers across Sierra Leone
**Notes:** One of Sierra Leone's leading media conglomerates. Operates on Channel 21.

---

### 6. SME TV Live
**Type:** Online Entertainment TV
**Official Site:** https://www.smetvlive.com/

**Direct Stream URL:** Not publicly available
**Access Methods:**
- YouTube: https://www.youtube.com/smetvlivestream
- Facebook: https://www.facebook.com/smetvlivestreaming
- Instagram: https://www.instagram.com/smetvlivestream
- TikTok: https://www.tiktok.com/@smetvlive

**Services:** 24 Hours Streaming, Studio Live Streaming
**Notes:** "Sierra Leone's Arguable First 100% Online Entertainment Television Live Streaming Service"

---

### Additional Channels (From iptv-org Database)

**7. AMAZE TV**
- Type: General
- Website: https://atvbase.live/

**8. Classic TV**
- Owner: Classic Media Empire
- Type: General

**9. Freetown Television Network (FTN)**
- Type: General

**10. Karima TV**
- Owner: DJ Snow
- Type: General

**11. Liberty Online TV**
- Type: General
- Website: https://libertyonlinetv.com

**12. Living Stone Television**
- Owner: Living Stone Evangelistic Ministries Int'l
- Type: Religious

**13. Magic TV**
- Type: General

**14. Mercy TV (Channel 29)**
- Type: Religious
- Website: https://christfaithmedia.co/mercytv/

**15. Redeemer Television**
- Owner: Redeemer Broadcasting Network
- Type: Religious

**16. Slik TV**
- Type: Entertainment
- Website: https://sliktv.com/

---

## IPTV M3U Playlist Resources

### iptv-org GitHub Repository
**Playlist URL:** https://iptv-org.github.io/iptv/countries/sl.m3u
**Status:** EMPTY (as of Dec 8, 2025)
**Expected Channels:** 13-21 channels (based on database entries)
**Note:** The m3u file exists but contains no stream URLs - only header `#EXTM3U`

### Alternative IPTV Resources
1. **IPTV Cat** - https://iptvcat.net/sierra_leone__1
   - Lists AYV TV Channel 34 (720p)
   - m3u8 URL not publicly displayed (requires site interaction)
   - Daily updated IPTV lists

2. **Free-TV/IPTV GitHub**
   - Playlist: https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8
   - May include Sierra Leone channels in worldwide list

3. **Tech Edu Byte M3U Playlists**
   - World Wide IPTV: https://www.techedubyte.com/world-wide-iptv-m3u-playlist/
   - Free IPTV 2025: https://www.techedubyte.com/iptv-m3u-2025/

---

## Technical Notes

### Why Direct URLs Are Hard to Find

1. **Embedded Players:** Most Sierra Leone TV stations use third-party embedded players that load stream URLs dynamically via JavaScript
2. **Geographic Restrictions:** Some streams may be geo-blocked or require Sierra Leone IP addresses
3. **App-Based Distribution:** Primary distribution through mobile apps rather than web streams
4. **Satellite Focus:** Major channels prioritize satellite (DSTV, StarTimes) over internet streaming
5. **Token-Based Streaming:** Many m3u8 URLs use expiring tokens for security

### How to Extract Stream URLs (For Future Research)

1. **Browser Developer Tools:**
   - Visit official channel website
   - Open DevTools (F12) → Network tab
   - Filter by "m3u8" or "m3u"
   - Play live stream and capture the URL

2. **M3U8 Sniffer Extensions:**
   - Chrome: https://chromewebstore.google.com/detail/m3u8-sniffer-tv-find-and/akkncdpkjlfanomlnpmmolafofpnpjgn
   - Automatically detects HLS streams on any page

3. **YouTube Live Streams:**
   - Many channels stream on YouTube
   - Use youtube-dl or yt-dlp to extract m3u8 URL from live streams

4. **IPTV List Aggregators:**
   - Check daily updated lists on iptvcat.net
   - Monitor iptv-org GitHub for new additions

---

## Recommended Next Steps for DASH WebTV

### Immediate Actions

1. **Test YouTube Embedding:**
   - Check if AYV, SME TV have active YouTube live streams
   - YouTube embedding is reliable and doesn't require direct URLs

2. **Contact Stations Directly:**
   - AYV Media Empire: Offer partnership for DASH WebTV inclusion
   - SLBC: Government broadcaster may provide official stream access
   - Star TV: Commercial partnership opportunity

3. **Monitor IPTV Lists:**
   - Set up daily check of iptvcat.net/sierra_leone__1
   - Watch iptv-org GitHub for updates

4. **App Stream Extraction:**
   - Download AYV Media Empire app
   - Use network monitoring tools to capture stream URLs
   - Check if app uses publicly accessible CDN

### Content Strategy

1. **Start with Available Content:**
   - Embed YouTube channels where available
   - Use third-party embeds (tvchannels.live, squidtv.net) with proper attribution

2. **Build Relationships:**
   - Position DASH WebTV as distribution platform for Sierra Leone content
   - Offer revenue sharing or advertising partnerships

3. **West Africa Expansion:**
   - Use same research methodology for Liberia, Ghana, Nigeria
   - Build comprehensive West African TV database

---

## Sources

### Search Results
- [AYV TV - SquidTV](https://www.squidtv.net/africa/sierra-leone/sierra-leone-001.html)
- [AYV Entertainment - tvchannels.LIVE](https://tvchannels.live/ayv-entertainment/)
- [SLBC Wikipedia](https://en.wikipedia.org/wiki/Sierra_Leone_Broadcasting_Corporation)
- [Sierra Leone TV Channels - tvchannels.LIVE](https://tvchannels.live/sierra-leone/)
- [IPTV Cat - Sierra Leone](https://iptvcat.net/sierra_leone__1)
- [iptv-org/iptv GitHub](https://github.com/iptv-org/iptv)
- [KTV Radio SL - Online Radio Box](https://onlineradiobox.com/sl/ktvsl/)
- [Star TV SL - StarTimes](https://m.startimestv.com/browser/liveDetail?channelId=1881634769)
- [SME TV Live](https://www.smetvlive.com/)

### Official Websites
- AYV Media Empire: https://ayvnews.com/
- SLBC: https://www.slbc.gov.sl/
- KTV Sierra Leone: https://ktvsl.com/
- Media One Centre: https://mediaonecentre.com/startv

---

## Conclusion

**Current Status:** Sierra Leone TV streaming landscape is **not openly accessible** via direct m3u8 URLs.

**Success Rate:** 0/15 channels have publicly available direct stream URLs

**Best Alternative Approaches:**
1. YouTube embedding (where available)
2. Third-party embed players (legal gray area)
3. Direct partnerships with stations
4. Mobile app stream extraction (technical approach)

**Recommendation:** Focus on **building partnerships** rather than scraping streams. Position DASH WebTV as a **distribution platform** that benefits Sierra Leone broadcasters by expanding their reach.

**Sierra Leone Beachhead Strategy:**
- Start with 2-3 key channels (AYV, SLBC, Star TV)
- Negotiate official streaming rights
- Use success stories to attract other channels
- Build momentum before expanding to Liberia, Ghana, etc.

---

**Research conducted by:** ZION SYNAPSE
**For:** DASH WebTV Project
**Date:** December 8, 2025
