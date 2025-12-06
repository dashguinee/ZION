# Meta-Prompt: Stream Playback Fixes and Format Handling

## Context
You are fixing stream playback issues for DASH WebTV. The audit showed 95% playback completeness but identified timer cleanup issues, event listener accumulation, and format handling gaps.

## Project Location
- Frontend: `/home/dash/zion-github/dash-webtv/`
- Player Code: `js/app.js` (video player sections)
- Backend Stream Routes: `/home/dash/zion-github/dash-streaming-server/src/routes/stream.js`

## Current Playback Stack
| Format | Library | Status |
|--------|---------|--------|
| MP4 | Native HTML5 | Working |
| MKV | FFmpeg Transcode | Working |
| HLS (.m3u8) | hls.js | Working |
| MPEG-TS | mpegts.js | Working |
| DASH (.mpd) | dash.js | Unknown |

## Tasks

### 1. Fix Timer Cleanup in Video Player (HIGH)
**File**: `/home/dash/zion-github/dash-webtv/js/app.js`
**Issue**: Multiple setInterval calls without proper cleanup

**Find all intervals**:
```bash
grep -n "setInterval" js/app.js
```

**Expected intervals to clean**:
- `rebufferInterval` - Rebuffering detection
- `statsInterval` - Playback statistics
- `healthCheckInterval` - Stream health monitoring
- `progressInterval` - Progress bar update
- `bitrateInterval` - Quality monitoring

**Fix in closeVideoPlayer()**:
```javascript
function closeVideoPlayer() {
  // Store all interval IDs on window or player object
  const intervals = [
    'rebufferInterval',
    'statsInterval',
    'healthCheckInterval',
    'progressInterval',
    'bitrateInterval'
  ];

  intervals.forEach(name => {
    if (window[name]) {
      clearInterval(window[name]);
      window[name] = null;
    }
  });

  // Also clear any timeouts
  const timeouts = ['seekTimeout', 'bufferTimeout', 'retryTimeout'];
  timeouts.forEach(name => {
    if (window[name]) {
      clearTimeout(window[name]);
      window[name] = null;
    }
  });

  // Destroy player instances
  if (window.hlsInstance) {
    window.hlsInstance.destroy();
    window.hlsInstance = null;
  }
  if (window.mpegtsPlayer) {
    window.mpegtsPlayer.destroy();
    window.mpegtsPlayer = null;
  }
  if (window.dashPlayer) {
    window.dashPlayer.reset();
    window.dashPlayer = null;
  }

  // Clear video element
  const video = document.getElementById('videoPlayer');
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }

  // Remove event listeners (use named functions)
  video.removeEventListener('timeupdate', handleTimeUpdate);
  video.removeEventListener('ended', handleEnded);
  video.removeEventListener('error', handleError);

  console.log('[Player] Cleanup complete');
}
```

### 2. Fix Event Listener Accumulation (MEDIUM)
**Issue**: Event listeners added on each play without removal
**Fix**: Use named functions and track listeners

```javascript
// Store listener references
const playerListeners = {
  timeupdate: null,
  ended: null,
  error: null,
  loadedmetadata: null,
  canplay: null,
  waiting: null,
  playing: null
};

function initVideoPlayer(video) {
  // Remove any existing listeners first
  Object.keys(playerListeners).forEach(event => {
    if (playerListeners[event]) {
      video.removeEventListener(event, playerListeners[event]);
    }
  });

  // Create named handlers
  playerListeners.timeupdate = (e) => handleTimeUpdate(e);
  playerListeners.ended = () => handleEnded();
  playerListeners.error = (e) => handleError(e);
  playerListeners.loadedmetadata = () => handleMetadata();
  playerListeners.canplay = () => handleCanPlay();
  playerListeners.waiting = () => handleBuffering(true);
  playerListeners.playing = () => handleBuffering(false);

  // Add listeners
  Object.entries(playerListeners).forEach(([event, handler]) => {
    video.addEventListener(event, handler);
  });
}
```

### 3. Improve MKV Transcoding Reliability
**File**: `/home/dash/zion-github/dash-streaming-server/src/routes/stream.js`
**Issue**: Some MKV files fail to transcode

**Current flow**:
1. Detect MKV format
2. Spawn FFmpeg process
3. Pipe to response

**Improvements**:
```javascript
// Add retry logic
async function transcodeWithRetry(inputUrl, res, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputUrl,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        '-movflags', 'frag_keyframe+empty_moov+faststart',
        '-f', 'mp4',
        'pipe:1'
      ]);

      ffmpeg.stdout.pipe(res);

      await new Promise((resolve, reject) => {
        ffmpeg.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`FFmpeg exited with code ${code}`));
        });
        ffmpeg.on('error', reject);
      });

      return; // Success
    } catch (error) {
      console.log(`Transcode attempt ${attempt} failed: ${error.message}`);
      if (attempt === maxRetries) throw error;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// Add timeout protection
const TRANSCODE_TIMEOUT = 30000; // 30 seconds
setTimeout(() => {
  if (!res.headersSent) {
    ffmpeg.kill();
    res.status(504).json({ error: 'Transcode timeout' });
  }
}, TRANSCODE_TIMEOUT);
```

### 4. Add DASH.js Support (if needed)
**Check if DASH streams exist**:
```javascript
// In stream detection
function detectStreamFormat(url, contentType) {
  if (url.includes('.mpd') || contentType === 'application/dash+xml') {
    return 'dash';
  }
  // ... existing checks
}

// Add DASH player initialization
function initDashPlayer(video, url) {
  if (!window.dashjs) {
    console.error('dash.js not loaded');
    return fallbackToDirectPlay(video, url);
  }

  const player = dashjs.MediaPlayer().create();
  player.initialize(video, url, true);

  player.on(dashjs.MediaPlayer.events.ERROR, (e) => {
    console.error('DASH error:', e);
    handleStreamError(e);
  });

  window.dashPlayer = player;
}
```

### 5. Implement Quality Switching
**Issue**: Quality selector hidden even when multiple qualities available
**Fix**:

```javascript
// After stream loads, detect available qualities
function detectQualities(player, format) {
  let qualities = [];

  if (format === 'hls' && player.levels) {
    qualities = player.levels.map((level, i) => ({
      index: i,
      height: level.height,
      bitrate: level.bitrate,
      label: `${level.height}p`
    }));
  } else if (format === 'dash' && player.getBitrateInfoListFor) {
    qualities = player.getBitrateInfoListFor('video').map(q => ({
      index: q.qualityIndex,
      height: q.height,
      bitrate: q.bitrate,
      label: `${q.height}p`
    }));
  }

  if (qualities.length > 1) {
    showQualitySelector(qualities);
  }
}

function showQualitySelector(qualities) {
  const selector = document.getElementById('qualitySelector');
  selector.innerHTML = qualities.map(q =>
    `<option value="${q.index}">${q.label} (${Math.round(q.bitrate/1000)}kbps)</option>`
  ).join('');
  selector.style.display = 'block';

  selector.onchange = (e) => switchQuality(e.target.value);
}

function switchQuality(index) {
  if (window.hlsInstance) {
    window.hlsInstance.currentLevel = index;
  } else if (window.dashPlayer) {
    window.dashPlayer.setQualityFor('video', index);
  }
}
```

### 6. Add Subtitle/Caption Support (NEW FEATURE)
**Frontend**:
```javascript
function loadSubtitles(videoId) {
  // Check for available subtitles
  fetch(`/api/stream/subtitles/${videoId}`)
    .then(r => r.json())
    .then(subs => {
      if (subs.length > 0) {
        showSubtitleSelector(subs);
        subs.forEach(sub => {
          const track = document.createElement('track');
          track.kind = 'subtitles';
          track.src = sub.url;
          track.srclang = sub.lang;
          track.label = sub.label;
          video.appendChild(track);
        });
      }
    });
}
```

**Backend**:
```javascript
// Add subtitle endpoint
router.get('/subtitles/:videoId', async (req, res) => {
  // Check for .srt/.vtt files matching video
  // Or extract from MKV if embedded
  const subtitles = await findSubtitles(req.params.videoId);
  res.json(subtitles);
});
```

### 7. Implement Automatic Quality Adaptation (ABR)
```javascript
// Monitor bandwidth and adjust quality
function initAdaptiveBitrate(player) {
  if (player.constructor.name === 'Hls') {
    player.config.enableWorker = true;
    player.config.startLevel = -1; // Auto
    player.config.abrEwmaDefaultEstimate = 500000; // Initial estimate

    player.on(Hls.Events.FRAG_LOADED, (event, data) => {
      updateBandwidthDisplay(player.bandwidthEstimate);
    });
  }
}

function updateBandwidthDisplay(bps) {
  const mbps = (bps / 1000000).toFixed(1);
  document.getElementById('bandwidthDisplay').textContent = `${mbps} Mbps`;
}
```

### 8. Add Picture-in-Picture Support
```javascript
function initPiPButton() {
  if (!document.pictureInPictureEnabled) return;

  const pipButton = document.createElement('button');
  pipButton.className = 'pip-button';
  pipButton.innerHTML = '<svg>...</svg>';
  pipButton.onclick = togglePiP;

  playerControls.appendChild(pipButton);
}

async function togglePiP() {
  const video = document.getElementById('videoPlayer');

  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture();
  } else {
    await video.requestPictureInPicture();
  }
}
```

## Testing Checklist

### Manual Tests:
- [ ] Play MP4 movie, close player, check memory (DevTools)
- [ ] Play MKV movie requiring transcode
- [ ] Play HLS live stream, check quality options
- [ ] Play MPEG-TS channel
- [ ] Switch quality mid-stream
- [ ] Close player during buffering
- [ ] Reopen player multiple times (check listener count)

### Automated Tests:
```javascript
// test/playback.test.js
describe('Video Player', () => {
  it('should clean up all intervals on close', () => {
    initVideoPlayer(mockVideo);
    playStream('test.m3u8');
    closeVideoPlayer();

    expect(window.rebufferInterval).toBeNull();
    expect(window.statsInterval).toBeNull();
  });

  it('should not accumulate event listeners', () => {
    const listenerCountBefore = getEventListeners(mockVideo).length;

    for (let i = 0; i < 5; i++) {
      initVideoPlayer(mockVideo);
      closeVideoPlayer();
    }

    const listenerCountAfter = getEventListeners(mockVideo).length;
    expect(listenerCountAfter).toBe(listenerCountBefore);
  });
});
```

## Success Criteria
- [ ] No memory leaks after 10 play/close cycles
- [ ] All intervals cleared (verified in DevTools)
- [ ] Event listener count stable
- [ ] Quality selector appears for multi-quality streams
- [ ] MKV transcode success rate > 95%
- [ ] No zombie FFmpeg processes

## DO NOT
- Do not replace video player library
- Do not change stream URL formats
- Do not modify backend proxy logic
- Do not add new CDN dependencies

## Output
When complete, provide:
1. List of intervals/timeouts found and cleanup code
2. Memory profiling before/after
3. Quality switching test results
4. Any formats that still have issues
