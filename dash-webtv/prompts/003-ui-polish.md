# Meta-Prompt: UI Polish and Accessibility for DASH WebTV

## Context
You are polishing the UI and fixing accessibility issues for DASH WebTV. The audit found 11 high-priority UI issues including memory leaks, missing accessibility features, and invisible navigation tabs.

## Project Location
- Frontend: `/home/dash/zion-github/dash-webtv/`
- Main Files:
  - `js/app.js` (6,063 lines)
  - `css/components.css` (4,112 lines)
  - `index.html` (~300 lines)

## Tasks

### 1. Add French TV Navigation Tab (CRITICAL)
**File**: `/home/dash/zion-github/dash-webtv/index.html`
**Issue**: French VOD integration exists but nav tab NOT in HTML - invisible to users
**Fix**: Add French tab to navigation alongside Movies, Series, Live TV
```html
<nav class="nav-tabs">
  <!-- Existing tabs -->
  <button class="nav-tab" data-page="french">French TV</button>
</nav>
```
- Style consistently with other tabs
- Wire up to existing `renderFrenchPage()` function

### 2. Fix Player Memory Leak (HIGH)
**File**: `/home/dash/zion-github/dash-webtv/js/app.js` lines ~4236-4286
**Issue**: Timer intervals not cleared when closing video player
**Fix**: In `closeVideoPlayer()` function:
```javascript
function closeVideoPlayer() {
  // Clear ALL intervals
  if (window.rebufferInterval) {
    clearInterval(window.rebufferInterval);
    window.rebufferInterval = null;
  }
  if (window.statsInterval) {
    clearInterval(window.statsInterval);
    window.statsInterval = null;
  }
  if (window.healthCheckInterval) {
    clearInterval(window.healthCheckInterval);
    window.healthCheckInterval = null;
  }
  // ... rest of cleanup
}
```
- Find ALL setInterval calls in player code
- Ensure each has corresponding clearInterval in closeVideoPlayer

### 3. Add ARIA Labels to Navigation (HIGH)
**Files**: `index.html`, `app.js`
**Issue**: Screen readers cannot navigate properly
**Fix**:
```html
<nav role="navigation" aria-label="Main navigation">
  <button class="nav-tab" role="tab" aria-selected="true" aria-controls="home-panel">Home</button>
  <!-- ... -->
</nav>
<main role="main" aria-live="polite">
  <!-- Content panels -->
</main>
```
- Add `role="tab"` to all nav buttons
- Add `aria-selected` state management
- Add `aria-label` to all icon-only buttons
- Add `alt` text to all images

### 4. Fix Login Background Image Error Handler
**File**: `/home/dash/zion-github/dash-webtv/js/app.js`
**Issue**: Login page image has no onerror fallback
**Fix**:
```javascript
// In login render function
backgroundImage.onerror = function() {
  this.src = 'assets/fallback-bg.jpg';
  // Or use gradient fallback
  this.style.display = 'none';
  container.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
};
```

### 5. Add Empty State for Zero Search Results
**File**: `/home/dash/zion-github/dash-webtv/js/app.js`
**Issue**: Empty container shown when no search results
**Fix**:
```javascript
if (results.length === 0) {
  container.innerHTML = `
    <div class="empty-state">
      <svg class="empty-icon"><!-- search icon --></svg>
      <h3>No results found</h3>
      <p>Try different keywords or browse categories</p>
    </div>
  `;
  return;
}
```
- Add empty states for: search, favorites, watch history, downloads

### 6. Increase Touch Targets (HIGH)
**File**: `/home/dash/zion-github/dash-webtv/css/components.css`
**Issue**: Close button 40px vs 44px minimum for accessibility
**Fix**: All interactive elements must be minimum 44x44px
```css
.close-button,
.nav-tab,
.action-button,
.card-button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}
```

### 7. Fix Toast Notification Mobile Cutoff
**File**: `css/components.css`
**Issue**: Toasts cut off on mobile screens
**Fix**:
```css
.toast {
  max-width: calc(100vw - 32px);
  margin: 0 16px;
  word-wrap: break-word;
}

@media (max-width: 768px) {
  .toast {
    bottom: 80px; /* Above mobile nav */
    font-size: 14px;
  }
}
```

### 8. Add Lazy Loading for Hero Banner Images
**File**: `/home/dash/zion-github/dash-webtv/js/app.js`
**Issue**: Hero images load immediately, slowing initial load
**Fix**:
```javascript
// Use Intersection Observer for hero images
const heroImage = document.createElement('img');
heroImage.loading = 'lazy';
heroImage.dataset.src = imageUrl;
// Load when in viewport
```

### 9. Fix Quality Selector Visibility
**File**: `/home/dash/zion-github/dash-webtv/js/app.js`
**Issue**: Quality selector hidden on compatible streams
**Fix**: Show quality selector whenever multiple qualities available
```javascript
function updateQualitySelector(qualities) {
  if (qualities && qualities.length > 1) {
    qualitySelector.style.display = 'block';
    // Populate options
  }
}
```

### 10. Add Keyboard Shortcut Documentation
**File**: Create tooltip or help modal
**Current shortcuts** (document these):
- Space: Play/Pause
- F: Fullscreen
- M: Mute
- Arrow keys: Seek/Volume
- Escape: Close player

### 11. Fix Ultra-wide Screen Grid Overflow
**File**: `css/components.css`
**Issue**: Grid breaks on 4K ultra-wide screens
**Fix**:
```css
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  max-width: 2400px; /* Cap for ultra-wide */
  margin: 0 auto;
}
```

## Implementation Order
1. Add French nav tab (quickest win, critical visibility)
2. Fix memory leaks in closeVideoPlayer
3. Add ARIA labels
4. Fix touch targets
5. Add empty states
6. Fix mobile toast
7. Add lazy loading
8. Fix quality selector
9. Document shortcuts
10. Fix grid overflow

## Success Criteria
- [ ] French TV visible in navigation
- [ ] No memory leaks (check DevTools Memory panel)
- [ ] Lighthouse accessibility score > 70
- [ ] All buttons minimum 44x44px
- [ ] Empty states show helpful messages
- [ ] Works on 4K screens without horizontal scroll

## Testing Commands
```bash
# Check for setInterval without corresponding clearInterval
grep -n "setInterval" js/app.js
grep -n "clearInterval" js/app.js

# Check for missing alt attributes
grep -n "<img" index.html js/app.js | grep -v "alt="

# Check button sizes
grep -n "width.*px\|height.*px" css/components.css
```

## DO NOT
- Do not change the video player library
- Do not modify backend routes
- Do not change the color scheme
- Do not add new animations (performance)

## Output
When complete, provide:
1. Files modified with line counts
2. Before/after Lighthouse scores (estimate)
3. List of remaining accessibility issues (if any)
4. Screenshots or descriptions of new empty states
