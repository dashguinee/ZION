# Meta-Prompt: Broken Channels Audit and Provider Health Check

## Context
You are auditing all streaming sources for DASH WebTV to identify and fix broken channels. The platform has 74,000+ content items across multiple providers - we need to verify which are actually working.

## Project Location
- Backend: `/home/dash/zion-github/dash-streaming-server/`
- Health Service: `src/services/content-health.service.js` (19,743 lines)
- Free IPTV Service: `src/services/free-iptv.service.js` (38,551 lines)
- Stream Extractor: `src/services/stream-extractor.service.js` (30,153 lines)

## Content Sources to Audit

### 1. StarShare (Xtream Codes) - Primary Source
**Current Status**: ~74,000 items (movies, series, live TV)
**Test Method**:
```javascript
// Test stream URL validity
async function testStarShareStream(streamId, type) {
  const url = buildStreamUrl(streamId, type);
  try {
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    return {
      id: streamId,
      status: response.ok ? 'working' : 'broken',
      httpCode: response.status,
      contentType: response.headers.get('content-type')
    };
  } catch (error) {
    return { id: streamId, status: 'timeout', error: error.message };
  }
}
```
**Audit Tasks**:
- [ ] Test 100 random movies from each category
- [ ] Test 100 random series episodes
- [ ] Test ALL live TV channels (typically ~1000)
- [ ] Generate report: working %, broken %, timeout %

### 2. French VOD Providers
**Providers to Test**:
| Provider | Status | File |
|----------|--------|------|
| Vixsrc | Working (reported) | vixsrc-provider.js |
| MP4Hydra | Working (reported) | mp4hydra-provider.js |
| Vidzee | Unknown | vidzee-provider.js |
| 8 others | Non-functional | stream-extractor.service.js |

**Test Method**:
```javascript
async function testFrenchProvider(provider, testMovieId) {
  try {
    const result = await provider.getStreamUrl(testMovieId);
    if (!result || !result.url) return { provider: provider.name, status: 'no_url' };

    // Test if URL actually streams
    const streamTest = await testStreamUrl(result.url);
    return {
      provider: provider.name,
      status: streamTest.ok ? 'working' : 'broken',
      responseTime: streamTest.time,
      format: result.format
    };
  } catch (error) {
    return { provider: provider.name, status: 'error', error: error.message };
  }
}
```
**Audit Tasks**:
- [ ] Test each provider with 5 different TMDB movie IDs
- [ ] Record response times
- [ ] Document error messages from non-functional providers
- [ ] Create fallback priority order

### 3. iptv-org (Free Live TV)
**Current**: 169 French channels from iptv-org GitHub
**Test Method**:
```javascript
async function testIPTVOrgChannel(channel) {
  try {
    const response = await fetch(channel.url, {
      method: 'HEAD',
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return {
      name: channel.name,
      country: channel.country,
      status: response.ok ? 'working' : 'broken',
      format: channel.url.includes('.m3u8') ? 'HLS' : 'MPEG-TS'
    };
  } catch (error) {
    return { name: channel.name, status: 'offline', error: error.message };
  }
}
```
**Audit Tasks**:
- [ ] Test all 169 channels
- [ ] Group by country/category
- [ ] Identify geo-blocked channels
- [ ] Find alternative sources for broken channels

## Create Health Report

### Output File: `/data/health-report-YYYY-MM-DD.json`
```json
{
  "generated": "2025-12-07T00:00:00Z",
  "summary": {
    "total_tested": 5000,
    "working": 4200,
    "broken": 500,
    "timeout": 300,
    "health_percentage": 84
  },
  "by_source": {
    "starshare": {
      "movies": { "tested": 1000, "working": 920 },
      "series": { "tested": 500, "working": 450 },
      "live": { "tested": 1000, "working": 800 }
    },
    "french_vod": {
      "vixsrc": { "tested": 50, "working": 48 },
      "mp4hydra": { "tested": 50, "working": 45 },
      "vidzee": { "tested": 50, "working": 0 }
    },
    "iptv_org": {
      "tested": 169,
      "working": 120,
      "geo_blocked": 30
    }
  },
  "broken_channels": [
    { "id": "xxx", "name": "Channel Name", "source": "starshare", "error": "404" }
  ],
  "recommendations": [
    "Remove 50 permanently dead channels",
    "Update 30 channel URLs",
    "Disable vidzee provider (0% success)"
  ]
}
```

## Implementation Steps

### Step 1: Create Audit Script
```javascript
// src/scripts/audit-channels.js
const { StarShareClient } = require('../services/xtream-client');
const { FrenchVodService } = require('../services/french-vod.service');
const { FreeIPTVService } = require('../services/free-iptv.service');

async function runFullAudit() {
  console.log('Starting full channel audit...');

  const results = {
    timestamp: new Date().toISOString(),
    starshare: await auditStarShare(),
    frenchVod: await auditFrenchProviders(),
    iptvOrg: await auditIPTVOrg()
  };

  // Generate summary
  results.summary = calculateSummary(results);

  // Save report
  const reportPath = `./data/health-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log(`Audit complete. Report saved to ${reportPath}`);
  return results;
}
```

### Step 2: Batch Testing (Avoid Rate Limits)
```javascript
async function batchTest(items, testFn, batchSize = 10, delayMs = 1000) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(testFn));
    results.push(...batchResults);

    console.log(`Progress: ${results.length}/${items.length}`);
    if (i + batchSize < items.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return results;
}
```

### Step 3: Update Content Health Database
```javascript
// After audit, update health status
async function updateHealthDatabase(auditResults) {
  const healthDb = await loadHealthDatabase();

  for (const item of auditResults.broken) {
    healthDb[item.id] = {
      status: 'broken',
      lastChecked: Date.now(),
      failCount: (healthDb[item.id]?.failCount || 0) + 1,
      error: item.error
    };
  }

  // Auto-disable items that failed 3+ times
  for (const [id, data] of Object.entries(healthDb)) {
    if (data.failCount >= 3) {
      data.status = 'disabled';
      data.disabledAt = Date.now();
    }
  }

  await saveHealthDatabase(healthDb);
}
```

## Success Criteria
- [ ] Complete audit of all content sources
- [ ] Health report generated with accurate percentages
- [ ] Broken channels flagged in database
- [ ] Non-functional providers disabled
- [ ] Alternative sources documented for broken content
- [ ] Audit can be run on schedule (daily/weekly)

## Integration with Frontend
After audit:
1. Hide/grey out broken content in UI
2. Show health badges on content cards
3. Prioritize working sources in search results
4. Provide "Report Broken" button that updates health DB

## DO NOT
- Do not delete any content from database (just flag as broken)
- Do not make changes to provider APIs
- Do not test more than 10 concurrent streams (rate limits)
- Do not store full stream URLs in reports (security)

## Output
When complete, provide:
1. Full health report JSON
2. Summary statistics
3. List of providers to disable
4. Recommended actions for improving health %
5. Script for scheduled auditing
