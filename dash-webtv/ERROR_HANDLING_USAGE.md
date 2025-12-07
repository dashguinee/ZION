# Error Handling Usage Guide

## Quick Reference for Using New Components

### 1. Show Toast Notification
```javascript
// Success
this.showToastEnhanced('Content added to favorites!', 'success')

// Error
this.showToastEnhanced('Failed to load content', 'error')

// Warning
this.showToastEnhanced('Your subscription will expire soon', 'warning')

// Info
this.showToastEnhanced('Content is now downloading', 'info')

// Custom duration (default is 4000ms)
this.showToastEnhanced('Quick message', 'info', 2000)
```

### 2. Show Empty State
```javascript
// In your render methods
return `
  <div class="container">
    ${items.length === 0 ? `
      ${this.renderEmptyState('No items found', '📭')}
    ` : `
      <!-- Your content grid -->
    `}
  </div>
`
```

### 3. Show Loading Skeleton
```javascript
// While loading content
this.elements.pageContainer.innerHTML = this.renderLoadingSkeleton(12)

// After content loads
this.elements.pageContainer.innerHTML = this.renderContentGrid(items)
```

### 4. Show Stream Error with Retry
```javascript
// In your playback error handler
try {
  const stream = await this.getStreamUrl(contentId)
  this.playStream(stream)
} catch (error) {
  this.showStreamError(contentId, 'movie', 'Unable to load stream. Please try again.')
}

// The modal will have a "Try Again" button that calls:
// dashApp.retryStream(contentId, contentType)
```

### 5. Show Progress Indicator
```javascript
// For long operations
this.showProgress('Processing video...')

// With percentage
this.showProgress('Downloading...', 45)

// Hide when done
this.hideProgress()
```

### 6. Confirmation Dialog
```javascript
// Ask for confirmation before destructive action
async removeFromFavorites(id) {
  const confirmed = await this.confirmAction(
    'Remove from Favorites',
    'Are you sure you want to remove this from your favorites?',
    'Remove'
  )

  if (confirmed) {
    // User clicked "Remove"
    this.favorites = this.favorites.filter(f => f.id !== id)
    this.saveFavorites()
    this.showToastEnhanced('Removed from favorites', 'success')
  } else {
    // User clicked "Cancel"
    console.log('User cancelled')
  }
}
```

### 7. Form Validation
```javascript
// Validate top-up amount
handleTopUp() {
  const amount = parseInt(document.getElementById('topUpAmount').value)

  const validation = this.validateTopUpAmount(amount)

  if (!validation.valid) {
    this.showToastEnhanced(validation.message, 'error')
    return
  }

  // Process valid amount
  this.processTopUp(amount)
}
```

### 8. Safe Fetch Wrapper
```javascript
// Replace this:
const res = await fetch(url)
const data = await res.json()

// With this:
const data = await this.safeFetch(url)
if (!data) {
  // Error already shown to user
  return
}

// With POST options:
const data = await this.safeFetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ foo: 'bar' })
})
```

### 9. Network Monitoring (Automatic)
```javascript
// Already initialized in init()
// Automatically shows offline banner when offline
// Shows toast when back online
// No code needed - just works!
```

## Component Styling Customization

### Override Toast Colors
```css
/* In your custom CSS */
.toast-success {
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
}
```

### Customize Empty State
```css
.empty-state {
  padding: 100px 40px; /* More padding */
}

.empty-icon {
  font-size: 80px; /* Bigger icon */
}
```

### Adjust Loading Skeleton Speed
```css
.skeleton-poster {
  animation-duration: 1s; /* Faster shimmer */
}
```

## Best Practices

### 1. Always Provide User Feedback
```javascript
// Bad - silent failure
async deleteContent(id) {
  await fetch(`/api/delete/${id}`)
}

// Good - user knows what happened
async deleteContent(id) {
  const confirmed = await this.confirmAction(
    'Delete Content',
    'This action cannot be undone.',
    'Delete'
  )

  if (!confirmed) return

  this.showProgress('Deleting...')
  const result = await this.safeFetch(`/api/delete/${id}`, { method: 'DELETE' })
  this.hideProgress()

  if (result?.success) {
    this.showToastEnhanced('Content deleted', 'success')
    this.refreshContent()
  }
}
```

### 2. Use Loading States for Async Operations
```javascript
async loadContent() {
  // Show skeleton while loading
  this.elements.container.innerHTML = this.renderLoadingSkeleton()

  const content = await this.safeFetch('/api/content')

  if (!content) {
    // Error already shown, show empty state
    this.elements.container.innerHTML = this.renderEmptyState(
      'Failed to load content',
      '⚠️'
    )
    return
  }

  // Show content
  this.elements.container.innerHTML = this.renderContent(content)
}
```

### 3. Chain Error Handling
```javascript
async complexOperation() {
  // Progress indicator
  this.showProgress('Processing...')

  // Safe fetch with automatic error handling
  const data = await this.safeFetch('/api/process')
  this.hideProgress()

  if (!data) {
    // safeFetch already showed error toast
    return
  }

  // Success feedback
  this.showToastEnhanced('Operation completed!', 'success')
}
```

### 4. Graceful Degradation
```javascript
async getContent() {
  // Try API first
  const apiData = await this.safeFetch('/api/content')

  if (apiData) {
    return apiData
  }

  // Fallback to cache
  const cached = this.getCachedContent()
  if (cached) {
    this.showToastEnhanced('Using cached content', 'warning')
    return cached
  }

  // Show empty state if nothing available
  return null
}
```

## Testing Your Implementation

### 1. Test Network Errors
```javascript
// In browser console
// Turn off internet
// Try to load content
// Should see error toasts and retry options
```

### 2. Test Empty States
```javascript
// Clear favorites in localStorage
localStorage.removeItem('dash_favorites')

// Navigate to favorites page
// Should see empty state with helpful message
```

### 3. Test Confirmation
```javascript
// Trigger a delete action
// Should see confirmation modal
// Test both Cancel and Confirm
```

### 4. Test Loading Skeletons
```javascript
// Add delay to see skeleton
async loadContent() {
  this.elements.container.innerHTML = this.renderLoadingSkeleton()
  await new Promise(r => setTimeout(r, 2000)) // 2 sec delay
  // Load actual content
}
```

## Common Patterns

### Pattern: Load with Skeleton → Content or Empty State
```javascript
async loadPage() {
  // 1. Show skeleton
  this.showLoading()

  // 2. Fetch data
  const data = await this.safeFetch('/api/data')

  // 3. Show content or empty state
  if (!data || data.length === 0) {
    this.elements.container.innerHTML = this.renderEmptyState(
      'No content available',
      '📭'
    )
  } else {
    this.elements.container.innerHTML = this.renderContent(data)
  }
}
```

### Pattern: Confirm → Progress → Success/Error
```javascript
async dangerousAction(id) {
  // 1. Confirm
  const confirmed = await this.confirmAction(
    'Warning',
    'This will delete all data.',
    'Proceed'
  )
  if (!confirmed) return

  // 2. Show progress
  this.showProgress('Processing...')

  // 3. Execute
  const result = await this.safeFetch(`/api/delete/${id}`, { method: 'DELETE' })
  this.hideProgress()

  // 4. Feedback
  if (result?.success) {
    this.showToastEnhanced('Deleted successfully', 'success')
  } else {
    this.showToastEnhanced('Failed to delete', 'error')
  }
}
```

### Pattern: Multi-step with Progress Updates
```javascript
async multiStepProcess() {
  try {
    // Step 1
    this.showProgress('Step 1 of 3...', 0)
    await this.step1()

    // Step 2
    this.showProgress('Step 2 of 3...', 33)
    await this.step2()

    // Step 3
    this.showProgress('Step 3 of 3...', 66)
    await this.step3()

    // Done
    this.showProgress('Completing...', 100)
    await new Promise(r => setTimeout(r, 500))

    this.hideProgress()
    this.showToastEnhanced('All done!', 'success')

  } catch (error) {
    this.hideProgress()
    this.showToastEnhanced('Process failed', 'error')
  }
}
```

## Migration Guide

### Replacing Old Error Handling

#### Before
```javascript
try {
  const res = await fetch(url)
  const data = await res.json()
  return data
} catch (err) {
  console.error(err)
  return null
}
```

#### After
```javascript
const data = await this.safeFetch(url)
return data // null if error, with toast shown
```

#### Before
```javascript
if (items.length === 0) {
  return '<div>No items</div>'
}
```

#### After
```javascript
if (items.length === 0) {
  return this.renderEmptyState('No items found', '📭')
}
```

#### Before
```javascript
// Using old showToast
this.showToast('Message', 'error')
```

#### After
```javascript
// Using enhanced toast
this.showToastEnhanced('Message', 'error')
// Better styling, close button, proper animations
```
