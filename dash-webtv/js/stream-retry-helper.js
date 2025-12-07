/**
 * Stream Retry Helper
 * Provides retry logic and user-friendly error messages for DASH WebTV
 */

/**
 * Show error message with retry and alternative source buttons
 * @param {HTMLElement} container - Container element to show error in
 * @param {string} message - Error message to display
 * @param {Function} retryCallback - Function to call when user clicks "Try Again"
 * @param {Function} alternativeCallback - Function to call when user clicks "Try Another Source"
 */
function showStreamErrorWithRetry(container, message, retryCallback, alternativeCallback) {
  if (!container) return

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
        ${retryCallback ? `
          <button class="btn-retry" onclick="(${retryCallback.toString()})()" style="
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
        ` : ''}
        ${alternativeCallback ? `
          <button class="btn-alternative" onclick="(${alternativeCallback.toString()})()" style="
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
            📺 Try Another Source
          </button>
        ` : ''}
      </div>
      <div class="error-hint" style="font-size: 14px; opacity: 0.6; max-width: 400px;">
        Some providers may be temporarily offline. Try another title or check back later.
      </div>
    </div>
  `

  container.innerHTML = errorHTML
}

/**
 * Retry helper with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} initialDelay - Initial delay in ms (default: 1000)
 * @returns {Promise} - Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const isLastAttempt = attempt === maxRetries - 1

      if (isLastAttempt) {
        console.warn(`All ${maxRetries} retry attempts failed:`, error.message)
        throw error
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = initialDelay * Math.pow(2, attempt)
      console.log(`Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw lastError
}

/**
 * Better error messages for common stream errors
 */
const StreamErrorMessages = {
  NETWORK_ERROR: 'Network error - stream may be offline or unreachable',
  MEDIA_ERROR: 'Playback error - the stream format may not be compatible',
  MANIFEST_ERROR: 'Stream loading error - the content may have been removed',
  TIMEOUT_ERROR: 'Connection timeout - the server is not responding',
  CORS_ERROR: 'Access blocked - trying alternative method...',
  UNKNOWN_ERROR: 'Stream unavailable - provider may be down'
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showStreamErrorWithRetry,
    retryWithBackoff,
    StreamErrorMessages
  }
}
