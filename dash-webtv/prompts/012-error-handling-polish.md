# Meta-Prompt: Error Handling and Polish for Production

## Context
You are adding comprehensive error handling and polish to make DASH WebTV feel like a professional Netflix-level app. The audit found silent failures, missing loading states, and poor error messages.

## Project Location
- Frontend: `/home/dash/zion-github/dash-webtv/`
- Backend: `/home/dash/zion-github/dash-streaming-server/`

## Critical Issues to Fix

### 1. Silent API Failures
**Problem:** Many fetch calls don't show errors to users

**File:** `/home/dash/zion-github/dash-webtv/js/app.js`

**Fix Pattern:**
```javascript
// BEFORE (silent failure)
const res = await fetch(`${this.backendUrl}/api/packages/${username}`)
const data = await res.json()

// AFTER (proper error handling)
try {
  const res = await fetch(`${this.backendUrl}/api/packages/${username}`)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }
  const data = await res.json()
  return data
} catch (error) {
  console.error('Failed to load packages:', error)
  this.showToast('Unable to load packages. Please try again.', 'error')
  return null
}
```

### 2. Loading States
**Problem:** No visual feedback while content loads

**Add Loading Skeleton Components:**
```javascript
// Show while content loads
renderLoadingSkeleton(count = 6) {
  const skeletons = Array(count).fill(0).map(() => `
    <div class="content-card skeleton">
      <div class="skeleton-poster"></div>
      <div class="skeleton-title"></div>
      <div class="skeleton-subtitle"></div>
    </div>
  `).join('')

  return `<div class="content-grid">${skeletons}</div>`
}

// CSS for skeletons
.skeleton {
  animation: pulse 1.5s ease-in-out infinite;
}
.skeleton-poster {
  background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  width: 100%;
  aspect-ratio: 2/3;
  border-radius: 8px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 3. Empty States
**Problem:** Empty categories show nothing

**Add Empty State Component:**
```javascript
renderEmptyState(message, icon = '📭') {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <h3>Nothing here yet</h3>
      <p>${message}</p>
    </div>
  `
}

// Usage examples:
// Favorites: "Add your favorite shows and movies to find them quickly"
// History: "Start watching to see your history here"
// Search: "No results found for 'xyz'. Try a different search."
```

### 4. Retry UI for Failed Content
**Problem:** When stream fails, no way to retry

**Add Retry Button:**
```javascript
showStreamError(contentId, contentType, errorMessage) {
  const errorHtml = `
    <div class="stream-error">
      <div class="error-icon">⚠️</div>
      <h3>Playback Error</h3>
      <p>${errorMessage || 'Unable to play this content'}</p>
      <div class="error-actions">
        <button onclick="app.retryStream('${contentId}', '${contentType}')" class="btn-primary">
          Try Again
        </button>
        <button onclick="app.tryAlternateSource('${contentId}', '${contentType}')" class="btn-secondary">
          Try Another Source
        </button>
        <button onclick="app.reportIssue('${contentId}', '${contentType}')" class="btn-outline">
          Report Problem
        </button>
      </div>
    </div>
  `
  this.showModal('stream-error', errorHtml)
}
```

### 5. Network Status Indicator
**Problem:** Users don't know if they're offline

**Add Network Monitor:**
```javascript
// Add to app initialization
initNetworkMonitor() {
  window.addEventListener('online', () => {
    this.showToast('You\'re back online!', 'success')
    this.dismissOfflineBanner()
  })

  window.addEventListener('offline', () => {
    this.showOfflineBanner()
  })

  // Check initial state
  if (!navigator.onLine) {
    this.showOfflineBanner()
  }
}

showOfflineBanner() {
  const banner = document.createElement('div')
  banner.id = 'offline-banner'
  banner.innerHTML = `
    <span>📡</span>
    <span>You're offline. Some features may not work.</span>
  `
  document.body.prepend(banner)
}
```

### 6. Form Validation
**Problem:** Forms submit with invalid data

**Add Validation:**
```javascript
validateTopUpAmount(amount) {
  if (!amount || isNaN(amount)) {
    return { valid: false, message: 'Please enter a valid amount' }
  }
  if (amount < 10000) {
    return { valid: false, message: 'Minimum top-up is 10,000 GNF' }
  }
  if (amount > 1000000) {
    return { valid: false, message: 'Maximum top-up is 1,000,000 GNF' }
  }
  return { valid: true }
}
```

### 7. Confirmation Dialogs
**Problem:** Destructive actions happen immediately

**Add Confirmations:**
```javascript
async confirmAction(title, message, confirmText = 'Confirm') {
  return new Promise((resolve) => {
    const modal = `
      <div class="confirm-dialog">
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="dialog-actions">
          <button onclick="app.resolveConfirm(false)" class="btn-outline">Cancel</button>
          <button onclick="app.resolveConfirm(true)" class="btn-primary">${confirmText}</button>
        </div>
      </div>
    `
    this.showModal('confirm', modal)
    this.confirmResolver = resolve
  })
}

resolveConfirm(result) {
  this.closeModal('confirm')
  if (this.confirmResolver) {
    this.confirmResolver(result)
  }
}

// Usage:
async removeFromFavorites(id) {
  const confirmed = await this.confirmAction(
    'Remove from Favorites',
    'Are you sure you want to remove this from your favorites?',
    'Remove'
  )
  if (confirmed) {
    // Do the removal
  }
}
```

### 8. Toast Notifications Improvement
**Improve existing toast system:**
```javascript
showToast(message, type = 'info', duration = 4000) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `

  const container = document.getElementById('toast-container') || this.createToastContainer()
  container.appendChild(toast)

  // Auto-dismiss
  setTimeout(() => toast.remove(), duration)

  // Animate in
  requestAnimationFrame(() => toast.classList.add('toast-visible'))
}
```

### 9. Progress Indicators
**For long operations:**
```javascript
showProgress(message, percent = null) {
  let progressBar = document.getElementById('progress-overlay')

  if (!progressBar) {
    progressBar = document.createElement('div')
    progressBar.id = 'progress-overlay'
    document.body.appendChild(progressBar)
  }

  progressBar.innerHTML = `
    <div class="progress-content">
      <div class="progress-spinner"></div>
      <p class="progress-message">${message}</p>
      ${percent !== null ? `
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percent}%"></div>
        </div>
        <span class="progress-percent">${percent}%</span>
      ` : ''}
    </div>
  `
}

hideProgress() {
  const overlay = document.getElementById('progress-overlay')
  if (overlay) overlay.remove()
}
```

### 10. CSS Polish
**File:** `/home/dash/zion-github/dash-webtv/css/components.css`

**Add:**
```css
/* Toast improvements */
#toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transform: translateX(100%);
  opacity: 0;
  transition: all 0.3s ease;
  max-width: 400px;
}

.toast-visible {
  transform: translateX(0);
  opacity: 1;
}

.toast-success { background: #10b981; color: white; }
.toast-error { background: #ef4444; color: white; }
.toast-warning { background: #f59e0b; color: white; }
.toast-info { background: #3b82f6; color: white; }

/* Empty states */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}
.empty-icon { font-size: 48px; margin-bottom: 20px; }

/* Error screens */
.stream-error {
  text-align: center;
  padding: 40px;
}
.error-icon { font-size: 64px; margin-bottom: 20px; }
.error-actions { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }

/* Offline banner */
#offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #f59e0b;
  color: black;
  padding: 8px;
  text-align: center;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
```

## Implementation Order
1. Add loading skeletons (immediate visual improvement)
2. Add toast container and improve toasts
3. Add empty states
4. Add network monitor
5. Wrap all fetch calls in try-catch
6. Add retry UI for streams
7. Add confirmation dialogs
8. Add form validation
9. Add progress indicators
10. CSS polish

## Verification
1. Disconnect internet → see offline banner
2. Reconnect → see "back online" toast
3. Navigate to empty favorites → see empty state
4. Load content → see skeleton loading
5. Stream fails → see retry options
6. Form validation → see error messages
7. All actions have feedback

## Output
Return:
- Functions added
- CSS added
- Error handling wrapped
- Loading states implemented
- Polish complete
