# Kodi Addon Ecosystem Research for African IPTV Sources

**Research Date:** December 8, 2025
**Purpose:** Identify Kodi addons, repositories, and M3U sources containing African/Francophone IPTV content
**Status:** RESEARCH ONLY - No code implementation

---

## Executive Summary

The Kodi ecosystem has limited dedicated African IPTV addons, but several viable pathways exist:

1. **PVR IPTV Simple Client** with public M3U playlists (iptv-org GitHub)
2. **Catch-up TV & More** addon (official, includes African countries)
3. **vStream** addon (French-language content, unofficial)
4. **Arawak TV** addon (African & Caribbean channels)
5. **MyCanal** addon (Canal+ francophone content, limited free access)

**Key Finding:** Most African IPTV content comes via M3U playlists loaded into Kodi's PVR IPTV Simple Client rather than dedicated addons with hardcoded sources.

---

## 1. Official Kodi IPTV Infrastructure

### 1.1 PVR IPTV Simple Client

**Status:** Official Kodi addon
**Repository:** https://github.com/kodi-pvr/pvr.iptvsimple
**Type:** PVR client for IPTV streams

**Capabilities:**
- M3U and M3U8 playlist support
- XMLTV EPG (Electronic Program Guide) support
- Gzip and XZ compression support
- Multiple M3U/XML file pairs (Kodi 20+ Nexus)
- Catchup/archive streams if supported by provider
- Streams from Kodi video addons

**How It Works:**
1. Install PVR IPTV Simple Client from Kodi addon repository
2. Configure with M3U playlist URL
3. Add XMLTV EPG source (optional)
4. Channels appear in Kodi's TV section

**Configuration:**
- Settings → Add-ons → My Add-ons → PVR clients → PVR IPTV Simple Client
- Select "M3U Play List URL"
- Enter playlist URL (e.g., `https://iptv-org.github.io/iptv/index.m3u`)
- Restart Kodi

**References:**
- Official Wiki: https://kodi.wiki/view/Add-on:PVR_IPTV_Simple_Client
- Kodi Addons: https://kodi.tv/addons/omega/pvr.iptvsimple/

---

## 2. Public M3U Playlist Sources

### 2.1 iptv-org GitHub Repository

**Repository:** https://github.com/iptv-org/iptv
**Status:** Public, actively maintained
**Type:** Collection of publicly available IPTV channels worldwide

**Master Playlist:**
```
https://iptv-org.github.io/iptv/index.m3u
```

**African Country-Specific Playlists:**

| Country | ISO Code | Playlist URL | Channels |
|---------|----------|--------------|----------|
| Central African Republic | cf | `https://iptv-org.github.io/iptv/countries/cf.m3u` | 18 |
| Chad | td | `https://iptv-org.github.io/iptv/countries/td.m3u` | 19 |
| Somalia | so | `https://iptv-org.github.io/iptv/countries/so.m3u` | - |
| South Africa | za | `https://iptv-org.github.io/iptv/countries/za.m3u` | - |
| Sudan | sd | `https://iptv-org.github.io/iptv/countries/sd.m3u` | - |
| Guinea | gn | `https://iptv-org.github.io/iptv/countries/gn.m3u` | - |

**Popular African Channels Available:**
- **South Africa:** SABC, e.tv, SuperSport
- **Zimbabwe:** ZBC
- **Zambia:** ZNBC
- **Angola:** TPA 1 & 2 (Portuguese)
- **International News:** Al Jazeera Arabic, BBC Africa, France 24, AfricaNews

**How to Use:**
1. Copy country-specific M3U URL
2. Add to PVR IPTV Simple Client configuration
3. Channels appear in Kodi TV section

**Safety Note:** Public repository, legal content, maintained by community

**References:**
- Main Repository: https://github.com/iptv-org/iptv
- Guide: https://www.techedubyte.com/github-iptv-8000-channels/
- Free IPTV Africa: https://hd.tousecurity.com/free-iptv-africa-m3u-playlists-06-05-2025/

### 2.2 IPTV Cat

**Website:** https://iptvcat.net/africa/3
**Status:** Free, daily updates
**Type:** Aggregated M3U lists

**Features:**
- Free IPTV channels for Africa
- M3U and M3U8 lists
- Checked and updated daily
- Country-specific lists (e.g., Guinea: https://iptvcat.net/guinea)

**Quality:** Variable - user-submitted content

---

## 3. Kodi Addons for African/Francophone Content

### 3.1 Catch-up TV & More (Official)

**Status:** Official Kodi addon
**Repository:** Kodi Official Repository
**GitHub:** https://github.com/Catch-up-TV-and-More/plugin.video.catchuptvandmore
**Website:** https://catch-up-tv-and-more.github.io/

**Type:** Live TV & Catch-up/Replay service
**License:** Legal & Official

**Features:**
- Live TV from multiple countries (North America, Europe, Africa)
- Catch-up TV (replay broadcasts)
- Websites section
- Favorites
- Free - no registration required

**African Coverage:**
- Countries spread across continents including Africa
- Select country → see list of available TV channels
- Live streaming capability

**Installation:**
1. Kodi → Add-ons → Install from repository
2. Kodi Add-on repository → Video Add-ons
3. Catch-up TV & More → Install

**Compatibility:** Kodi 17 Krypton and higher

**Channel List:** https://catch-up-tv-and-more.github.io/channels/

**References:**
- Official Kodi: https://kodi.tv/addons/omega/plugin.video.catchuptvandmore/
- Kodi Wiki: https://kodi.wiki/view/Add-on:Catch-up_TV_&_More
- Installation Guide: https://www.firesticktricks.com/catch-up-tv-and-more.html

### 3.2 vStream (French Content - Unofficial)

**Status:** Unofficial/Third-party
**Repository:** https://github.com/Kodi-vStream/venom-xbmc-addons
**Type:** French streaming addon

**Features:**
- 100% French language interface
- Movies (films VF and subtitled)
- TV Series (séries)
- Anime/Manga
- Documentaries
- Sports
- Live TV replays
- Trakt account sync
- Download capability (some sources)
- No Debrid service required

**Content Type:**
- Primarily French/francophone content
- Not specifically tailored for francophone Africa
- Useful for French-speaking African markets

**Community:**
- "les alKODIQues" - first francophone Kodi community
- Source: https://kodi-vstream.github.io/

**Installation:**
1. Add source: https://kodi-vstream.github.io/
2. Install repository from zip
3. Install vStream addon from repository

**Legal Note:** Streaming certain content may be illegal. Use VPN recommended.

**References:**
- GitHub: https://github.com/Kodi-vStream/venom-xbmc-addons
- Guide: https://www.kodi-guide.com/vstream-kodi-addon/
- Best Addons: https://www.opportunites-digitales.com/meilleur-addon-kodi

### 3.3 Arawak TV (African & Caribbean)

**Status:** Third-party/Unofficial
**Type:** IPTV addon for African & Caribbean channels

**Features:**
- Live TV channels from African countries
- Caribbean channels
- SD and HD quality streams
- Free

**Installation:**
1. Kodi → System → File Manager
2. Add source named "teamx"
3. Install repository
4. Install Arawak TV from repository

**Target Audience:** African and Caribbean diaspora

**References:**
- Installation Guide: https://bestforkodi.com/guide-install-arawak-tv-kodi-addon-repo/
- How-to: https://tvboxbee.org/how-to-install-arawak-tv-addon-on-kodi/

### 3.4 France.tv (Official French Channels)

**Status:** Official Kodi addon
**Repository:** Kodi Official Repository
**Type:** France Télévisions live & catch-up

**Features:**
- Live streaming of France Télévisions channels
- Catch-up TV (replay)
- Free content
- Official and legal

**Channels:**
- France 2, France 3, France 5, France 4
- France Ô (overseas territories - relevant for francophone Africa)
- France 24 (international news)
- Franceinfo

**Installation:**
1. Kodi → Add-ons → Install from repository
2. Kodi Add-on repository → Video Add-ons
3. France.tv → Install

**Geo-restriction:** May require French IP address (VPN)

**References:**
- Official: https://kodi.tv/addons/omega/plugin.video.francetv/
- Wiki: https://kodi.wiki/view/Add-on:France.tv

### 3.5 MyCanal (Canal+ Official - Limited Free)

**Status:** Official Kodi addon
**Repository:** Kodi Official Repository
**Type:** Canal+ replay service

**Features:**
- Canal+ replay content
- Free content only (subscription content requires login)
- myCANAL JSON API integration

**Installation:**
1. Settings → Add-ons → Install from repository
2. Kodi Add-on repository → Video Add-ons
3. MyCanal → Install

**Limitation:** Free content only - premium Canal+ content requires subscription

**Relevance for Africa:**
- Canal+ has major presence in francophone Africa
- Free preview content available
- Full service requires paid myCANAL subscription

**Alternative:** SuperRepo has "Canal+" addon with broader access:
- Repository: SuperRepo
- Addon: plugin.video.canal.plus
- Description: "Plugin vidéo donnant acces a toutes les vidéos de la mosaique Canal+"

**References:**
- Official: https://kodi.wiki/view/Add-on:MyCanal
- SuperRepo: https://superrepo.org/kodi/addon/plugin.video.canal.plus

### 3.6 DStv Now (South Africa - Subscription Required)

**Status:** Unofficial third-party
**Repository:** MattHuisman.nz Repository
**Type:** South African IPTV service

**Features:**
- South African channels
- Requires active DStv subscription
- Channels depend on subscription package

**Installation:**
1. Main Menu → Add-ons → My Add-ons
2. Install from repository
3. MattHuisman.nz Repository → Video add-ons
4. DStv Now → Install

**Requirement:** Active DStv Now subscription (not free)

**References:**
- Installation: https://briefly.co.za/31485-kodi-south-africa-best-kodi-add-ons-step-by-step-installation-process.html
- Forum: https://www.golden-forum.com/viewtopic.php?t=41591

### 3.7 Filmon Simple

**Status:** Third-party
**Repository:** TV Addons (fusion.tvaddons.co)
**Type:** Multi-region IPTV

**Features:**
- African TV category
- Asian TV
- Caribbean channels
- Multiple regional options

**Installation:**
1. Add source: http://fusion.tvaddons.co/
2. Install TV Addons repository
3. Install Filmon Simple

**Note:** TV Addons had legal issues in past - verify current status before use

**References:**
- Best Addons: https://techspace.africa/5-best-kodi-add-ons-that-just-work/

---

## 4. Commercial IPTV Services (For Reference)

These are paid services that could provide content for DASH-WebTV integration:

### 4.1 IPTV Senegal
- **Website:** http://www.iptvsenegal.shop/
- **Channels:** 58,000+ HD channels
- **Coverage:** Senegalese, African, international
- **VOD:** 97,000+ films and series
- **Platforms:** Smart IPTV, Android, iOS, Windows, macOS, Linux, Kodi, VLC
- **Type:** Premium subscription service

### 4.2 AFCON IPTV
- **Website:** https://afconiptv.com/
- **Coverage:** Côte d'Ivoire, Senegal, Cameroon, pan-Africa
- **Channels:** 50,000+ channels, films, series
- **Trial:** Free 24-hour trial
- **Infrastructure:** Optimized for Senegal
- **Type:** Premium subscription service

### 4.3 Africa IPTV (General)
- **Website:** https://getiptvpanels.com/africa-iptv/
- **Coverage:** Mali, Senegal, Guinea, pan-Africa
- **Content:** All African languages, sports, movies, Live TV, Kids
- **Type:** Premium subscription service

### 4.4 Regional IPTV Subscriptions
- **Coverage:** Western Sahara, Senegal, Gambia, Mali, Burkina Faso, Guinea, Guinea-Bissau
- **Platforms:** Smart TV Box, PC, Phone, Enigma2, M3U, MAG
- **Type:** Commercial service

**Note:** These services require payment and may provide reseller/API access for integration into platforms like DASH-WebTV.

---

## 5. Alternative IPTV Addons (General)

These addons may include international/African channels:

### 5.1 The Crew
- Popular Kodi addon
- Live TV, movies, sports
- IPTV section with international channels
- Unofficial

### 5.2 Pluto TV
- Legal and free
- 250+ live TV channels
- Limited African content
- Official addon

### 5.3 Ultra IPTV
- Worldwide channel browsing
- US, UK, Canada, India focus
- May include international
- Third-party

### 5.4 Mega IPTV
- IPTV.org channels integration
- Fluxus IPTV channels
- Free-IPTV by country
- Unofficial

### 5.5 Kodi World TV Addon
- **GitHub:** https://github.com/henry-richard7/Kodi-World-TV-Addon
- All TV channels from around the world
- May include African channels
- Community-maintained

**References:**
- Best IPTV Addons: https://www.iptveye.com/best-kodi-addons-for-iptv/
- Live TV Guide: https://www.wirelesshack.org/top-best-kodi-live-tv-addons.html

---

## 6. Kodi IPTV Implementation Patterns

### 6.1 Pattern 1: PVR IPTV Simple Client with M3U
**Most common approach for African content**

```
User Flow:
1. Install PVR IPTV Simple Client (official)
2. Configure M3U playlist URL (iptv-org or custom)
3. Optional: Add XMLTV EPG
4. Channels appear in TV section
```

**Advantages:**
- Official addon (safe, maintained)
- Flexible - works with any M3U source
- EPG support
- Supports catchup streams

**Disadvantages:**
- Requires finding/maintaining M3U playlists
- No built-in content discovery
- Quality varies by source

### 6.2 Pattern 2: Dedicated Country/Region Addon
**Less common for African content**

```
User Flow:
1. Install regional addon (e.g., Arawak TV, DStv Now)
2. Addon has hardcoded sources
3. Browse channels within addon
```

**Advantages:**
- Curated content
- Built-in UI
- May include EPG

**Disadvantages:**
- Limited availability for African markets
- Often unmaintained
- May require subscriptions

### 6.3 Pattern 3: Language-Based Addon
**French content for francophone Africa**

```
User Flow:
1. Install language addon (e.g., vStream, France.tv)
2. Access French-language content
3. May include African francophone channels
```

**Advantages:**
- Large content libraries
- Active communities
- Works for francophone markets

**Disadvantages:**
- Not Africa-specific
- May have geo-restrictions
- Legal gray areas (unofficial addons)

---

## 7. Key Findings for DASH-WebTV

### 7.1 Stream Source Discovery

**Kodi addons DO contain stream URLs in their source code:**

1. **Location:** GitHub repositories for unofficial addons
2. **Format:** Usually Python code with hardcoded URLs or API endpoints
3. **Examples:**
   - vStream: https://github.com/Kodi-vStream/venom-xbmc-addons
   - Catch-up TV & More: https://github.com/Catch-up-TV-and-More/plugin.video.catchuptvandmore
   - World TV: https://github.com/henry-richard7/Kodi-World-TV-Addon

**Extraction Method:**
```bash
# Clone addon repository
git clone https://github.com/[addon-repo]

# Search for stream URLs
grep -r "http" --include="*.py" | grep -E "(m3u8|mpd|rtmp|rtsp)"

# Look for channel lists
find . -name "*channel*" -o -name "*playlist*"
```

### 7.2 M3U Playlist Harvesting

**Public Sources:**
- iptv-org GitHub: Largest public collection
- IPTV Cat: Daily updated, community-sourced
- Free IPTV repositories on GitHub

**Quality Tiers:**
1. **Tier 1:** Official broadcaster streams (best quality, stable)
2. **Tier 2:** Public community playlists (variable quality)
3. **Tier 3:** User-submitted streams (often unstable)

**For DASH-WebTV:**
- Start with iptv-org African country playlists
- Validate streams programmatically
- Filter by uptime/quality metrics
- Build custom curated M3U for Guinea/West Africa

### 7.3 Legal Considerations

**Safe Approaches:**
1. Official addons (Catch-up TV & More, France.tv, MyCanal)
2. Public broadcaster streams (iptv-org verified sources)
3. Commercial IPTV partnerships (AFCON IPTV, IPTV Senegal)

**Gray Areas:**
1. Unofficial addons (vStream, The Crew)
2. Community-sourced M3U playlists
3. Scraped streams from third-party sites

**For DASH-WebTV:**
- Prioritize official sources and partnerships
- Use VPN recommendation for users
- Clear disclaimers about content sources
- Focus on freely available public broadcasts

---

## 8. Community Resources

### 8.1 Kodi Forums

**African Channels Thread:**
- URL: https://forum.kodi.tv/showthread.php?tid=171618
- Status: Active discussion
- Finding: Hard to find quality African livestreams
- Community: West African users requesting support
- Conclusion: Africa underrepresented in Kodi ecosystem

**French Channels Thread:**
- URL: https://forum.kodi.tv/showthread.php?tid=318958
- Focus: Legal French channels
- Relevant for francophone Africa
- Discord communities for support

### 8.2 GitHub Communities

**Kodi IPTV Addons:**
- https://github.com/kodi-iptv-addons/kodi-iptv-addons
- Repository aggregator
- Installation via repository.iptv.zip

**Arabic Kodi Addons:**
- https://github.com/saabana/repository.arabic.kodi-addons
- Arabic channels and content
- Relevant for North Africa

### 8.3 Francophone Communities

**les alKODIQues:**
- First francophone Kodi community
- vStream support
- French help resources

---

## 9. Technical Implementation Notes

### 9.1 Extracting Streams from Kodi Addons

**Method 1: Source Code Analysis**
```python
# Example from typical Kodi addon structure
# /resources/lib/channels.py

CHANNELS = [
    {
        'name': 'Channel Name',
        'url': 'https://example.com/stream.m3u8',
        'logo': 'https://example.com/logo.png',
        'epg_id': 'channel.id'
    }
]
```

**Method 2: Network Traffic Analysis**
```bash
# Monitor Kodi network traffic while playing channel
tcpdump -i any -s 0 -w kodi_traffic.pcap

# Analyze with Wireshark
# Filter: http.request or rtsp or rtmp
# Extract stream URLs
```

**Method 3: Kodi Debug Logs**
```
# Enable debug logging in Kodi
Settings → System → Logging → Enable debug logging

# Play channel
# Check log file: ~/.kodi/temp/kodi.log
# Search for stream URLs
```

### 9.2 M3U Playlist Format

**Basic Structure:**
```m3u
#EXTM3U
#EXTINF:-1 tvg-id="channel1.gn" tvg-name="RTG Guinea" tvg-logo="http://example.com/logo.png" group-title="Guinea",RTG Guinea
http://example.com/stream1.m3u8

#EXTINF:-1 tvg-id="channel2.sn" tvg-name="RTS Senegal" tvg-logo="http://example.com/logo2.png" group-title="Senegal",RTS Senegal
http://example.com/stream2.m3u8
```

**For DASH-WebTV Integration:**
1. Parse M3U files
2. Extract channel metadata (name, logo, group)
3. Validate stream URLs
4. Store in database
5. Serve via API

### 9.3 Stream Validation Script

**Pseudocode:**
```python
import requests

def validate_stream(url):
    try:
        response = requests.head(url, timeout=5)
        if response.status_code == 200:
            return True
    except:
        return False

def validate_m3u_playlist(m3u_url):
    playlist = download_m3u(m3u_url)
    valid_streams = []

    for channel in parse_m3u(playlist):
        if validate_stream(channel['url']):
            valid_streams.append(channel)

    return valid_streams
```

---

## 10. Recommendations for DASH-WebTV

### 10.1 Immediate Actions

**Phase 1: Quick Wins**
1. **Integrate iptv-org M3U playlists**
   - Start with Guinea, Senegal, Mali country playlists
   - Use PVR IPTV Simple Client approach
   - Direct M3U parsing for web platform

2. **Add Catch-up TV & More sources**
   - Reverse-engineer channel sources from GitHub
   - Focus on African countries available
   - Legal, official content

3. **vStream integration**
   - For francophone content
   - French movies/series popular in West Africa
   - Community-maintained, active development

**Phase 2: Content Expansion**
1. **Clone and analyze Kodi addon repositories**
   ```bash
   git clone https://github.com/Catch-up-TV-and-More/plugin.video.catchuptvandmore
   git clone https://github.com/Kodi-vStream/venom-xbmc-addons
   git clone https://github.com/henry-richard7/Kodi-World-TV-Addon
   ```

2. **Extract stream URLs programmatically**
   - Parse Python source files
   - Build database of validated streams
   - Categorize by country/language/genre

3. **Build custom M3U aggregator**
   - Combine iptv-org + Kodi addon sources
   - Daily validation checks
   - Uptime monitoring
   - Auto-remove dead streams

**Phase 3: Commercial Partnerships**
1. **Contact IPTV Senegal / AFCON IPTV**
   - Request API access or reseller partnership
   - 58,000+ channels = massive content library
   - Optimized for West African market

2. **Explore Canal+ partnership**
   - Major player in francophone Africa
   - Official myCANAL API exists
   - Potential white-label opportunity

### 10.2 Technical Architecture

**Proposed Flow:**
```
1. Content Aggregation Layer
   ├── iptv-org M3U parser (GitHub automated updates)
   ├── Kodi addon source extractor (periodic scraping)
   ├── Commercial API integrations (IPTV Senegal, etc.)
   └── User-contributed streams (community feature)

2. Validation Layer
   ├── Stream health checker (HTTP HEAD requests)
   ├── Uptime monitoring (24-hour ping cycle)
   ├── Quality assessment (resolution detection)
   └── Geo-availability check (VPN rotation)

3. Database Layer
   ├── Channels table (name, logo, category, country, language)
   ├── Streams table (url, format, quality, status)
   ├── EPG table (program guide data from XMLTV)
   └── User favorites/history

4. API Layer
   ├── GET /api/channels (filtered by country/language/genre)
   ├── GET /api/stream/:id (returns validated stream URL)
   ├── GET /api/epg/:channelId (program guide)
   └── POST /api/report-stream (user reporting)

5. Frontend Integration
   ├── HLS.js for m3u8 playback
   ├── DASH.js for mpd playback
   ├── Channel grid with logos/EPG
   └── Favorites and continue watching
```

### 10.3 Legal & Safety

**Best Practices:**
1. **Source Transparency**
   - Show content source for each channel
   - "Powered by iptv-org" badges
   - Link to original broadcaster when possible

2. **User Disclaimers**
   - VPN recommendation
   - "Streams may be geo-restricted"
   - DMCA compliance process

3. **Content Filtering**
   - Only include public broadcaster streams
   - Avoid pirated premium content
   - Focus on free-to-air channels

### 10.4 West Africa Priority List

**Guinea Channels (Priority 1):**
- RTG (Radio Télévision Guinéenne)
- Espace TV Guinée
- FIM FM TV
- Use: https://iptv-org.github.io/iptv/countries/gn.m3u

**Senegal Channels (Priority 2):**
- RTS (Radio Télévision Sénégalaise)
- 2STV
- TFM
- Explore IPTV Senegal partnership

**Mali Channels (Priority 3):**
- ORTM (Office de Radiodiffusion Télévision du Mali)
- Use iptv-org Mali playlist

**Pan-African (Priority 4):**
- Africa News
- France 24 (French)
- Al Jazeera Arabic
- BBC Africa

**French International (Priority 5):**
- TV5Monde Afrique
- France 24
- RFI (audio/video)
- Available via France.tv addon sources

---

## 11. Code Examples

### 11.1 M3U Parser for DASH-WebTV

```javascript
// m3u-parser.js
const axios = require('axios');

class M3UParser {
  async fetchPlaylist(url) {
    const response = await axios.get(url);
    return response.data;
  }

  parseM3U(content) {
    const lines = content.split('\n');
    const channels = [];
    let currentChannel = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('#EXTINF:')) {
        // Parse channel metadata
        const tvgId = line.match(/tvg-id="([^"]*)"/)?.[1];
        const tvgName = line.match(/tvg-name="([^"]*)"/)?.[1];
        const tvgLogo = line.match(/tvg-logo="([^"]*)"/)?.[1];
        const groupTitle = line.match(/group-title="([^"]*)"/)?.[1];
        const channelName = line.split(',').pop();

        currentChannel = {
          id: tvgId,
          name: tvgName || channelName,
          logo: tvgLogo,
          category: groupTitle,
          displayName: channelName
        };
      } else if (line && !line.startsWith('#')) {
        // This is the stream URL
        currentChannel.url = line;
        channels.push(currentChannel);
        currentChannel = {};
      }
    }

    return channels;
  }

  async getAfricanChannels() {
    const countries = {
      guinea: 'https://iptv-org.github.io/iptv/countries/gn.m3u',
      senegal: 'https://iptv-org.github.io/iptv/countries/sn.m3u',
      mali: 'https://iptv-org.github.io/iptv/countries/ml.m3u',
      ivoryCoast: 'https://iptv-org.github.io/iptv/countries/ci.m3u'
    };

    const allChannels = {};

    for (const [country, url] of Object.entries(countries)) {
      try {
        const playlist = await this.fetchPlaylist(url);
        const channels = this.parseM3U(playlist);
        allChannels[country] = channels;
        console.log(`${country}: ${channels.length} channels`);
      } catch (error) {
        console.error(`Error fetching ${country}:`, error.message);
        allChannels[country] = [];
      }
    }

    return allChannels;
  }
}

// Usage
const parser = new M3UParser();
parser.getAfricanChannels().then(channels => {
  console.log(JSON.stringify(channels, null, 2));
});
```

### 11.2 Stream Validator

```javascript
// stream-validator.js
const axios = require('axios');

class StreamValidator {
  async validateStream(url, timeout = 5000) {
    try {
      const response = await axios.head(url, {
        timeout: timeout,
        maxRedirects: 5
      });

      return {
        valid: response.status === 200,
        status: response.status,
        contentType: response.headers['content-type'],
        server: response.headers['server']
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async validatePlaylist(channels) {
    const results = [];

    for (const channel of channels) {
      const validation = await this.validateStream(channel.url);
      results.push({
        ...channel,
        validation
      });
    }

    return results;
  }

  getWorkingStreams(validatedChannels) {
    return validatedChannels.filter(ch => ch.validation.valid);
  }
}

// Usage
const validator = new StreamValidator();
// Use with M3UParser output
```

### 11.3 Database Schema

```sql
-- channels.sql
CREATE TABLE channels (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  logo_url TEXT,
  country VARCHAR(50),
  language VARCHAR(50),
  category VARCHAR(100),
  source VARCHAR(100), -- 'iptv-org', 'kodi-addon', 'commercial'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE streams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  channel_id VARCHAR(50),
  stream_url TEXT NOT NULL,
  stream_format VARCHAR(20), -- 'm3u8', 'mpd', 'rtmp'
  quality VARCHAR(20), -- 'SD', 'HD', 'FHD'
  is_active BOOLEAN DEFAULT TRUE,
  last_checked TIMESTAMP,
  uptime_percentage DECIMAL(5,2),
  FOREIGN KEY (channel_id) REFERENCES channels(id)
);

CREATE TABLE epg_programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  channel_id VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  FOREIGN KEY (channel_id) REFERENCES channels(id),
  INDEX idx_channel_time (channel_id, start_time)
);

CREATE INDEX idx_country ON channels(country);
CREATE INDEX idx_language ON channels(language);
CREATE INDEX idx_category ON channels(category);
CREATE INDEX idx_active_streams ON streams(channel_id, is_active);
```

---

## 12. Next Steps

### 12.1 Proof of Concept

**Goal:** Validate approach with 10-20 working African channels

**Steps:**
1. Clone iptv-org repo locally
2. Parse Guinea, Senegal, Mali M3U files
3. Validate each stream URL
4. Build simple web player with working streams
5. Test on different devices/networks

**Success Criteria:**
- 80%+ streams working
- < 5 second load time
- Works on mobile and desktop
- EPG data available for major channels

### 12.2 MVP Features

**Core:**
- Channel grid with country/language filters
- HLS video player
- Search functionality
- Favorites (local storage)

**Nice-to-Have:**
- EPG/TV guide
- Continue watching
- User accounts
- Stream quality selector

### 12.3 Scaling Plan

**Month 1:** 50-100 channels (Guinea, Senegal, Mali focus)
**Month 2:** 200-500 channels (add Ivory Coast, Burkina Faso, Niger)
**Month 3:** 500-1000 channels (pan-African + French international)
**Month 4:** Commercial partnerships (IPTV Senegal integration)
**Month 5:** User-contributed streams + community moderation
**Month 6:** White-label for other West African markets

---

## 13. Risks & Mitigations

### Risk 1: Stream Unreliability
**Mitigation:**
- Multiple sources per channel (fallback URLs)
- Daily validation checks
- Community reporting system
- Remove streams offline > 48 hours

### Risk 2: Legal Issues
**Mitigation:**
- Focus on public broadcaster streams
- Clear source attribution
- DMCA takedown process
- User disclaimers
- VPN recommendations

### Risk 3: Geo-restrictions
**Mitigation:**
- VPN integration recommendations
- Multiple stream sources
- User testing from West Africa
- Partner with local providers

### Risk 4: Kodi Addon Abandonment
**Mitigation:**
- Don't rely solely on third-party addons
- Archive working streams in own database
- Build relationships with addon developers
- Contribute to open-source projects

---

## 14. Conclusion

**Key Takeaways:**

1. **No single "African IPTV" Kodi addon exists** - content comes from multiple sources:
   - iptv-org GitHub (country playlists)
   - Catch-up TV & More (official, multi-country)
   - vStream (French content)
   - Arawak TV (African/Caribbean)
   - DStv Now (South Africa, paid)

2. **Best approach for DASH-WebTV:**
   - Start with iptv-org M3U playlists
   - Extract streams from Kodi addon source code
   - Build validation and curation layer
   - Partner with commercial providers (IPTV Senegal, AFCON IPTV)

3. **Technical feasibility: HIGH**
   - M3U parsing is straightforward
   - Stream validation is automated
   - HLS.js for playback
   - EPG via XMLTV

4. **Content availability: MODERATE**
   - Guinea, Senegal, Mali have 10-30 channels each in iptv-org
   - Quality varies (public broadcasters best)
   - French international channels abundant
   - Commercial partnerships needed for premium content

5. **Legal considerations: MANAGEABLE**
   - Focus on public broadcast streams
   - Clear source attribution
   - VPN recommendations
   - DMCA compliance process

**Recommended Immediate Action:**
Clone iptv-org repo and validate West African country playlists to build initial channel database for DASH-WebTV.

---

## Sources

### Search Sources
- [African Channels - Kodi Forum](https://forum.kodi.tv/showthread.php?tid=171618)
- [13 Best Kodi Addons for IPTV 2025 - IPTVEYE](https://www.iptveye.com/best-kodi-addons-for-iptv/)
- [Best Kodi Addons December 2025 - TROYPOINT](https://troypoint.com/best-kodi-addons/)
- [Best Kodi Live TV Addons - WirelesSHack](https://www.wirelesshack.org/top-best-kodi-live-tv-addons.html)
- [KODI South Africa - Briefly.co.za](https://briefly.co.za/31485-kodi-south-africa-best-kodi-add-ons-step-by-step-installation-process.html)
- [PVR IPTV Simple Client - Official Kodi Wiki](https://kodi.wiki/view/Add-on:PVR_IPTV_Simple_Client)
- [IPTV Simple Client - Kodi Addons](https://kodi.tv/addons/omega/pvr.iptvsimple/)
- [AFRICAN & CARIBEAN LIVE TV ON KODI](https://www.latest-kodi.com/african-caribean-live-tv-on-kodi/)
- [GitHub - iptv-org/iptv](https://github.com/iptv-org/iptv)
- [GitHub - kodi-pvr/pvr.iptvsimple](https://github.com/kodi-pvr/pvr.iptvsimple)
- [GitHub - Kodi World TV Addon](https://github.com/henry-richard7/Kodi-World-TV-Addon)
- [Free IPTV Africa 2025 Guide](https://hd.tousecurity.com/free-iptv-africa-m3u-playlists-06-05-2025/)
- [Africa IPTV Cat](https://iptvcat.net/africa/3)
- [Guinea IPTV Cat](https://iptvcat.net/guinea)
- [Meilleurs modules Kodi pour la France](https://www.moyens.net/kodi/meilleurs-modules-complementaires-kodi-pour-la-france-qui-fonctionnent/)
- [Extensions Kodi Françaises - AtlasWeb](https://atlasweb.net/extensions-kodi-populaires-en-francais/)
- [france.tv Kodi Addon](https://kodi.tv/addons/omega/plugin.video.francetv/)
- [Add-on:France.tv - Kodi Wiki](https://kodi.wiki/view/Add-on:France.tv)
- [Canal+ addon - SuperRepo](https://superrepo.org/kodi/addon/plugin.video.canal.plus)
- [Add-on:MyCanal - Kodi Wiki](https://kodi.wiki/view/Add-on:MyCanal)
- [IPTV Senegal Shop](http://www.iptvsenegal.shop/)
- [AFCON IPTV](https://afconiptv.com/)
- [How to Install Catch-Up TV & More](https://www.firesticktricks.com/catch-up-tv-and-more.html)
- [Catch-up TV & More - Official](https://kodi.tv/addons/omega/plugin.video.catchuptvandmore/)
- [GitHub - Catch-up TV & More](https://github.com/Catch-up-TV-and-More/plugin.video.catchuptvandmore)
- [Catch-up TV & More Website](https://catch-up-tv-and-more.github.io/)
- [Add-on:Catch-up TV & More - Kodi Wiki](https://kodi.wiki/view/Add-on:Catch-up_TV_&_More)
- [GitHub - vStream](https://github.com/Kodi-vStream/venom-xbmc-addons)
- [Meilleur Addon Kodi 2025](https://www.opportunites-digitales.com/meilleur-addon-kodi)
- [vStream Kodi Addon Guide](https://www.kodi-guide.com/vstream-kodi-addon/)
- [Guide Install Arawak TV](https://bestforkodi.com/guide-install-arawak-tv-kodi-addon-repo/)
- [How To Install Arawak TV - Tvboxbee](https://tvboxbee.org/how-to-install-arawak-tv-addon-on-kodi/)

---

**END OF RESEARCH**

