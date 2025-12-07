# Stream Playback Fixes - Implementation Guide

## Summary
This document outlines the production-grade stream fixes implemented for DASH WebTV.

## Backend Fixes (COMPLETED)

### 1. Increased Timeouts in stream-extractor.service.js
- Changed all timeouts from 15000ms to 30000ms
- Files modified: `/home/dash/zion-github/dash-streaming-server/src/services/stream-extractor.service.js`
- Locations:
  - Line 500: EmbedSu fetch timeout
  - Line 580: EmbedSu stream API timeout
  - Lines 607, 929: VidSrcRip and VidLink timeouts
  - All other fetch timeouts updated to 30000ms

### 2. Added Retry Logic with Exponential Backoff
- Added retryWithBackoff() helper method to StreamExtractorService class
- Wrapped key extractors:
  - extractFromVidSrcMe() → uses retryWithBackoff
  - extractFromMultiEmbed() → uses retryWithBackoff
  - extractFromVidSrcRip() → uses retryWithBackoff
- Retry configuration:
  - Max retries: 3
  - Delays: 1s, 2s, 4s (exponential backoff)

### 3. Frontend Timeout Increase
- Updated HLS.js xhr timeout in app.js line 2279 from 15000ms to 30000ms

## Frontend Fixes (TO IMPLEMENT)

### 4. Add Error Handling Helper to app.js

Add this method before `closeVideoPlayer()`:

```javascript
/**
 * Show user-friendly error message with retry options
 */
showStreamErrorWithRetry(loadingEl, message) {
  if (!loadingEl) return

  const errorHTML = `
    <div class="stream-error-container" style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      padding: 40px 20px;
      text-align: center;
      color: #fff;
    ">
      <div class="error-icon" style="font-size: 48px; opacity: 0.7;">⚠️</div>
      <div class="error-message" style="font-size: 18px; font-weight: 500; max-width: 400px;">
        ${message}
      </div>
      <div class="error-actions" style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
        <button class="btn-retry" onclick="dashApp.retryCurrentStream()" style="
          padding: 12px 24px;
          background: #e50914;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        " onmouseover="this.style.background='#f40612'" onmouseout="this.style.background='#e50914'">
          🔄 Try Again
        </button>
        <button class="btn-close" onclick="dashApp.closeVideoPlayer()" style="
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
          ✖ Close
        </button>
      </div>
      <div class="error-hint" style="font-size: 14px; opacity: 0.6; max-width: 400px;">
        Some providers may be temporarily offline. Try another title or check back later.
      </div>
    </div>
  `

  loadingEl.innerHTML = errorHTML
}

/**
 * Retry the current stream
 */
retryCurrentStream() {
  console.log('🔄 Retrying stream...')
  this._hlsRetryCount = 0 // Reset retry counter
  this.closeVideoPlayer()

  // Retry based on stored stream info
  if (this.currentStreamType === 'movie') {
    this.playContent(this.currentStreamId, 'movie', this.currentStreamExtension)
  } else if (this.currentStreamType === 'series') {
    this.playEpisode(this.currentStreamId, this.currentStreamExtension)
  } else if (this.currentLiveStreamId) {
    this.playLiveChannel(this.currentLiveStreamId, this.currentChannelName || 'Live Channel')
  }
}
```

### 5. Update playHLS() Error Handler

Find the `playHLS()` method around line 4251 and replace the error handler:

```javascript
playHLS(video, streamUrl, loadingEl) {
  console.log('🔴 Using HLS.js for:', streamUrl)

  // Initialize retry counter
  if (!this._hlsRetryCount) this._hlsRetryCount = 0
  const maxRetries = 3

  // Check if HLS.js is supported (most browsers except Safari)
  if (typeof Hls !== 'undefined' && Hls.isSupported()) {
    console.log('✅ HLS.js supported - using it')

    this.hlsInstance = new Hls({
      debug: false,
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 90,
      maxBufferLength: 30,
      maxMaxBufferLength: 600,
      startLevel: -1,
      xhrSetup: (xhr, url) => {
        xhr.withCredentials = false
      }
    })

    this.hlsInstance.loadSource(streamUrl)
    this.hlsInstance.attachMedia(video)

    this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('✅ HLS manifest loaded, starting playback')
      this._hlsRetryCount = 0 // Reset on success

      if (this.hlsInstance.levels && this.hlsInstance.levels.length > 1) {
        console.log(`📊 Detected ${this.hlsInstance.levels.length} quality levels`)
        this.showQualitySelector(this.hlsInstance)
      }

      video.play().catch(err => {
        console.warn('⚠️ Autoplay blocked:', err.message)
        if (loadingEl) loadingEl.innerHTML = '<div>Click to play</div>'
      })
    })

    this.hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      console.error('❌ HLS Error:', data.type, data.details)

      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log(`🔄 Network error (attempt ${this._hlsRetryCount + 1}/${maxRetries})`)
            if (this._hlsRetryCount < maxRetries) {
              this._hlsRetryCount++
              if (loadingEl) loadingEl.innerHTML = `<div class="spinner"></div><div>Network issue, retrying... (${this._hlsRetryCount}/${maxRetries})</div>`
              const delay = 1000 * Math.pow(2, this._hlsRetryCount - 1)
              setTimeout(() => {
                this.hlsInstance.startLoad()
              }, delay)
            } else {
              this.hlsInstance.destroy()
              this.showStreamErrorWithRetry(loadingEl, 'Network error - stream may be offline')
            }
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log(`🔄 Media error (attempt ${this._hlsRetryCount + 1}/${maxRetries})`)
            if (this._hlsRetryCount < maxRetries) {
              this._hlsRetryCount++
              if (loadingEl) loadingEl.innerHTML = `<div class="spinner"></div><div>Loading issue, retrying... (${this._hlsRetryCount}/${maxRetries})</div>`
              this.hlsInstance.recoverMediaError()
            } else {
              this.hlsInstance.destroy()
              this.showStreamErrorWithRetry(loadingEl, 'Playback error - try another quality')
            }
            break
          default:
            console.error('❌ Fatal error, cannot recover')
            this.hlsInstance.destroy()
            this.showStreamErrorWithRetry(loadingEl, 'Stream unavailable - provider may be down')
            break
        }
      }
    })

  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    console.log('🍎 Using Safari native HLS')
    video.src = streamUrl
    video.addEventListener('loadedmetadata', () => {
      video.play().catch(err => console.warn('Autoplay blocked:', err))
    })
  } else {
    console.error('❌ HLS not supported in this browser')
    if (loadingEl) loadingEl.innerHTML = '<div>HLS not supported in this browser</div>'
  }
}
```

## Testing Checklist

- [ ] Test VOD extraction with Fight Club (TMDB ID 550)
- [ ] Test network error retry (simulate by blocking network temporarily)
- [ ] Verify "Try Again" button appears after 3 failed retries
- [ ] Test retry counter resets on successful playback
- [ ] Verify improved error messages are user-friendly
- [ ] Test live TV channel playback
- [ ] Verify timeout improvements (streams load within 30s)

## Files Modified

### Backend
1. `/home/dash/zion-github/dash-streaming-server/src/services/stream-extractor.service.js`
   - Added retryWithBackoff() method
   - Increased all timeouts to 30000ms
   - Wrapped VidSrcMe, MultiEmbed, VidSrcRip with retry logic

### Frontend
1. `/home/dash/zion-github/dash-webtv/js/app.js`
   - Increased HLS.js timeout to 30000ms (line 2279)
   - TO ADD: showStreamErrorWithRetry() method
   - TO ADD: retryCurrentStream() method
   - TO UPDATE: playHLS() error handling with retry logic

## Benefits

1. **30s Timeouts**: Slow providers get more time to respond
2. **3 Retries**: Network blips don't kill streams
3. **Exponential Backoff**: 1s → 2s → 4s delays prevent hammering servers
4. **User-Friendly Errors**: Clear messages + retry buttons
5. **Better UX**: Users see progress during retries, know what's happening
