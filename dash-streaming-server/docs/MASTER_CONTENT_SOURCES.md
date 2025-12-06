# DASH WebTV - MASTER CONTENT SOURCES
## Complete Research: December 5, 2025

---

## EXECUTIVE SUMMARY

**Total Potential Content**: 500,000+ items across all sources
**Target Market**: West Africa (Guinea, Sierra Leone, Senegal, Ivory Coast, Liberia)

| Category | Sources Found | Est. Content | Priority |
|----------|---------------|--------------|----------|
| Nollywood/African | 15+ | 50,000+ | HIGHEST |
| French Content | 10+ | 100,000+ | HIGH |
| Bollywood/Indian | 8+ | 100,000+ | HIGH |
| K-Drama/Asian | 10+ | 50,000+ | MEDIUM |
| Sports (Football) | 5+ | Live channels | HIGH |
| HBO/US Content | 5+ | 100,000+ | MEDIUM |

---

## PART 1: WEST AFRICAN VIEWING HABITS (Research Summary)

### What West Africans Actually Watch:

1. **LOCAL CONTENT IS KING** (70-90% of viewership)
   - Nollywood dominates - 96.5% of West African box office
   - Showmax beat Netflix by focusing on African content
   - Language matters: Yoruba, Igbo, Hausa, French, English

2. **FOOTBALL IS ESSENTIAL**
   - Premier League (free via Infront deal)
   - La Liga (StarTimes 2024-29)
   - Ligue 1 (Canal+ - huge in Francophone)
   - African Cup of Nations
   - UEFA Champions League

3. **CURRENT PAIN POINTS**
   - DSTV/Canal+ too expensive ($28-82/month)
   - Content fragmented across 5+ services
   - Piracy is 8-9x cheaper than legal options
   - Infrastructure issues (bandwidth, cable breaks)

### Competitor Pricing (What we're beating):

| Service | Price | Content |
|---------|-------|---------|
| DSTV Premium | $28-82/mo | Full package |
| Canal+ All | $46/mo | French + sports |
| Showmax | $8-15/mo | African + HBO |
| Netflix | $10-20/mo | Limited African |

**OUR TARGET**: $5-15/mo for EVERYTHING

---

## PART 2: NOLLYWOOD & AFRICAN CINEMA

### FREE Platforms:

**1. YouTube Official Channels** (BEST SOURCE)
- RuthKadiri247: 1.96M subs, 20M+ views
- IBAKATV: 500M reach globally
- YorubaPlus: 1M+ subs, daily Yoruba films
- XnollyTV: "#1 source for free Nollywood"
- NollyGreatMovies, Nollywood5star, etc.

**Integration**: YouTube Data API v3

**2. AfroLandTV** - https://www.afrolandtv.com/
- Hundreds of free African movies
- Ad-supported, completely free
- Direct streaming

**3. IbakaTV**
- 500M+ reach globally
- Full movies for streaming AND download
- YouTube channel integration

**4. Internet Archive**
- https://archive.org/details/AfricanMovies
- https://archive.org/details/nollywood_movies
- 1,000+ free public domain films

### IPTV Channels:

**Africa Magic Channels** (via IPTV):
- Africa Magic Family
- Africa Magic Showcase
- Africa Magic Yoruba/Igbo/Hausa
- Africa Magic Epic/Urban

**Sources**:
- IPTV Cat: https://iptvcat.net/africa/3
- iptv-org: https://github.com/iptv-org/iptv

---

## PART 3: FRENCH CONTENT

### Already Integrated:
- **Frembed**: 24K movies + 80K episodes
- **VidSrc**: 66K movies + 320K episodes
- **TMDB French**: 69,900+ French movies

### Additional Sources to Add:

**Live TV (M3U)**:
```
iptv-org France: https://iptv-org.github.io/iptv/countries/fr.m3u
Free-TV France: https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_france.m3u8
ipstreet312: https://raw.githubusercontent.com/ipstreet312/freeiptv/master/all.m3u
```

**French Channels Available**:
- France 2, 3, 4, 5, La Première, France Info
- BFM TV, CNEWS, France 24
- TV5 Monde, Arte, Canal+ (free content)
- TF1, M6, NRJ 12, LCP

**VOD APIs to Add**:
- AlloCiné API (French movie database)
- G2Stream (French movies/series)
- GoDrivePlayer (VidSrc alternative)

---

## PART 4: BOLLYWOOD/INDIAN CONTENT

### Primary Sources:

**1. iptv-org India**
```
Hindi: https://iptv-org.github.io/iptv/languages/hin.m3u
India: https://iptv-org.github.io/iptv/countries/in.m3u
```
- 100+ verified Indian channels

**2. IPTV Cat India**
- https://iptvcat.net/home_7
- 193 verified online Indian channels
- Daily validation

**3. Free-TV India**
```
https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8
```

**4. Indian IPTV GitHub**
- https://github.com/kananinirav/Indian-IPTV-App (500+ channels)
- https://github.com/SArun61/IPTV (Zee, Sony, JioTV)

**Channels Available**:
- Zee TV, Colors TV, Sony TV, Star Plus
- Star Sports (cricket)
- 9X Jalwa, 9X Jhakaas (Bollywood music)

---

## PART 5: K-DRAMA & ASIAN CONTENT

### Free Legal Platforms:

**1. Rakuten Viki** (TOP CHOICE)
- https://www.viki.com
- Largest K-drama library
- Subtitles: English, French, Spanish, Portuguese
- Free with ads

**2. KOCOWA**
- https://www.kocowa.com
- Official from KBS, MBC, SBS
- 20,000+ hours
- Free tier (24hr delay)

**3. Tubi TV**
- https://www.tubi.tv
- 500+ K-dramas
- 100% free, ad-supported

**4. iQIYI**
- https://www.iqiyi.com
- K-drama + C-drama + Thai

### Anime Sources:

**AniWatch API** (Self-host):
```
GitHub: https://github.com/ghoshRitesh12/aniwatch-api
Docker: ghcr.io/ghoshritesh12/aniwatch
```

**GogoAnime API**:
```
GitHub: https://github.com/riimuru/gogoanime-api
Docker: docker pull riimuru/gogoanime
```

### IPTV Asian:
```
Korea: https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_korea.m3u8
Japan: https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_japan.m3u8
```

---

## PART 6: US/HBO/HULU CONTENT

### Embed Providers (Gray Zone):
- **VidSrc**: vidsrc.to (already integrated)
- **2Embed**: 2embed.stream
- **SuperEmbed**: superembed.stream
- **HnEmbed**: hnembed.com

### Legal Free US Channels:
- Pluto TV (328 channels) - already integrated
- Tubi TV (free movies/shows)
- PBS, NBC, ABC, CBS via iptv-org

### TMDB for Discovery:
```
HBO Network ID: 49
Netflix: 213
Hulu: 453
Paramount+: 4330
```

---

## PART 7: SPORTS (FOOTBALL)

### Free Sources:

**Premier League** - FREE via Infront deal (40+ African nations)

**IPTV Sports**:
```
Sports: https://iptv-org.github.io/iptv/categories/sports.m3u
```

**Channels to Find**:
- SuperSport alternatives
- beIN Sports
- ESPN Africa
- Canal+ Sport

---

## PART 8: INTEGRATION PRIORITY

### Phase 1 (This Week):
1. ✅ French VOD (Frembed, VidSrc) - DONE
2. Add IPTV M3U endpoints for:
   - French channels
   - African channels
   - Indian channels
3. YouTube Nollywood integration

### Phase 2 (Next Week):
1. K-Drama platforms (Viki, KOCOWA)
2. Anime APIs (AniWatch, Gogoanime)
3. AlloCiné API for French metadata

### Phase 3 (Future):
1. Self-hosted anime API
2. Sports aggregation
3. Build-your-own-subscription UI

---

## PART 9: API ENDPOINTS TO CREATE

```javascript
// New endpoints for dash-streaming-server

// African Content
GET /api/free/african - All African channels
GET /api/free/nollywood - Nollywood movies (YouTube)
GET /api/free/africa-magic - Africa Magic channels

// French Content
GET /api/free/french-tv - French live channels
GET /api/french-vod/allocine/search - AlloCiné search

// Indian Content
GET /api/free/bollywood - Indian channels
GET /api/free/india - All India content

// Asian Content
GET /api/free/kdrama - Korean dramas
GET /api/free/anime - Anime content
GET /api/free/asian - All Asian channels

// Sports
GET /api/free/sports - All sports channels
GET /api/free/football - Football specific

// Mega Endpoints
GET /api/free/ultimate - Everything combined
GET /api/free/by-region/:region - Filter by region
```

---

## PART 10: M3U PLAYLIST URLS (Ready to Use)

```
# AFRICAN
https://iptv-org.github.io/iptv/regions/afr.m3u

# FRENCH
https://iptv-org.github.io/iptv/countries/fr.m3u
https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_france.m3u8

# INDIAN
https://iptv-org.github.io/iptv/countries/in.m3u
https://iptv-org.github.io/iptv/languages/hin.m3u

# KOREAN
https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_korea.m3u8

# SPORTS
https://iptv-org.github.io/iptv/categories/sports.m3u

# ALL CHANNELS
https://iptv-org.github.io/iptv/index.m3u
```

---

## BUSINESS MODEL INSIGHT

**The Truth About IPTV Panels**:
- StarShare, IPTV panels = same free sources + UI + subscription
- They charge $10-50/month for what's FREE
- DASH can offer same content at fraction of price

**"Pay For What You Watch" Model**:
| Package | Price (GNF) | Content |
|---------|-------------|---------|
| Sports Only | 20,000 | Football + sports |
| French Cinema | 15,000 | French movies/series |
| Nollywood | 15,000 | African content |
| Bollywood | 10,000 | Indian content |
| K-Drama | 10,000 | Asian dramas |
| Kids | 10,000 | Family content |
| News 24/7 | FREE | News channels |

**DASH Wallet**: 100,000 GNF minimum, pay-as-you-go

---

*Research compiled by ZION SYNAPSE - December 5, 2025*
*Total sources: 50+ platforms, APIs, and repositories*
