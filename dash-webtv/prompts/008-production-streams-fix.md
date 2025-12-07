# Meta-Prompt: Production-Grade Stream Playback Fixes

## Context
You are fixing ALL stream playback issues to make DASH WebTV 100% production-grade. The audits found broken providers, timeout issues, and playback failures.

## Project Location
- Frontend: `/home/dash/zion-github/dash-webtv/`
- Backend: `/home/dash/zion-github/dash-streaming-server/`

## Critical Issues to Fix

### 1. VOD Extractors - Fix Timeout Issues
**File:** `/home/dash/zion-github/dash-streaming-server/src/services/stream-extractor.service.js`

**Problems Found:**
- MultiEmbed times out at 15 seconds (line 753) - increase to 30s
- VidSrcRip VRF system times out (line 722) - needs retry logic
- AutoEmbed, Smashy, VidLink all timeout on initial fetch

**Tasks:**
1. Read stream-extractor.service.js
2. Increase timeouts from 15000ms to 30000ms
3. Add retry logic with exponential backoff
4. Add health status tracking for each extractor
5. Disable broken extractors that consistently fail

### 2. Live TV Stream Resolution
**File:** `/home/dash/zion-github/dash-streaming-server/src/routes/live.js`

**Problems:**
- Some streams resolve to dead URLs
- No fallback when stream fails
- HLS proxy infrastructure built but not used

**Tasks:**
1. Add stream validation before returning URL
2. Implement fallback chain for live streams
3. Add health check on stream URLs
4. Enable HLS proxy for problematic streams

### 3. Starshare Service Improvements
**File:** `/home/dash/zion-github/dash-streaming-server/src/services/starshare.service.js`

**Tasks:**
1. Add connection health monitoring
2. Implement retry on failed requests
3. Cache successful stream URLs
4. Log failed stream requests for debugging

### 4. Frontend Player Resilience
**File:** `/home/dash/zion-github/dash-webtv/js/app.js`

**Problems:**
- Player doesn't retry on failure
- No automatic quality fallback
- Error messages not helpful

**Tasks:**
1. Find video player initialization code
2. Add retry logic for failed streams (3 retries with backoff)
3. Add automatic quality downgrade on failure
4. Show helpful error messages ("Stream unavailable, trying backup...")
5. Add "Try Another Source" button for users

### 5. Provider Health Monitoring
**Create:** `/home/dash/zion-github/dash-streaming-server/src/services/provider-health.service.js`

**Implement:**
```javascript
// Track provider success/failure rates
// Disable providers with >80% failure rate
// Re-enable after cooldown period
// Log all failures for debugging
```

## Implementation Order
1. Increase timeouts (quick win)
2. Add retry logic to extractors
3. Add player retry in frontend
4. Implement provider health service
5. Add user feedback UI

## Verification
After implementation:
1. Test Vixsrc extraction with TMDB ID 550 (Fight Club)
2. Test MP4Hydra extraction
3. Test VidZee (should timeout gracefully)
4. Test live TV channel playback
5. Test Starshare VOD playback
6. Verify retry UI shows for users

## Output
Return a summary of:
- Files modified
- Timeouts changed
- Retry logic added
- Provider health status
- Verification test results
