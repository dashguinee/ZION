# Error Handling Quick Reference

## Most Commonly Used Methods

### 1. Show Toast (Most Common)
```javascript
// Success
this.showToastEnhanced('Success message', 'success')

// Error
this.showToastEnhanced('Error message', 'error')

// Warning
this.showToastEnhanced('Warning message', 'warning')

// Info
this.showToastEnhanced('Info message', 'info')
```

### 2. Empty State
```javascript
// In render methods
${items.length === 0 ? this.renderEmptyState('No items found', '📭') : ''}
```

### 3. Safe Fetch (Use Instead of Regular Fetch)
```javascript
// Replace fetch() with safeFetch()
const data = await this.safeFetch('/api/endpoint')
if (!data) return // Error already shown to user
```

### 4. Loading Skeleton
```javascript
// Show while loading
this.elements.container.innerHTML = this.renderLoadingSkeleton(12)
```

### 5. Confirmation Dialog
```javascript
const confirmed = await this.confirmAction('Title', 'Message', 'Confirm')
if (!confirmed) return
// User confirmed, proceed
```

### 6. Progress Indicator
```javascript
this.showProgress('Processing...')
// ... do work ...
this.hideProgress()
```

### 7. Stream Error
```javascript
this.showStreamError(contentId, 'movie', 'Unable to play stream')
```

## Color Reference

- **Success**: Green gradient (#10b981 → #059669)
- **Error**: Red gradient (#ef4444 → #dc2626)
- **Warning**: Orange gradient (#f59e0b → #d97706)
- **Info**: Blue gradient (#3b82f6 → #2563eb)

## Common Patterns

### Pattern 1: Load Data with Error Handling
```javascript
const data = await this.safeFetch('/api/data')
if (!data) {
  this.elements.container.innerHTML = this.renderEmptyState('Failed to load', '⚠️')
  return
}
this.renderContent(data)
```

### Pattern 2: User Action with Feedback
```javascript
async deleteItem(id) {
  const confirmed = await this.confirmAction('Delete', 'Are you sure?', 'Delete')
  if (!confirmed) return

  const result = await this.safeFetch(`/api/delete/${id}`, { method: 'DELETE' })
  if (result?.success) {
    this.showToastEnhanced('Deleted successfully', 'success')
  }
}
```

### Pattern 3: Long Operation
```javascript
this.showProgress('Processing...')
await this.longRunningTask()
this.hideProgress()
this.showToastEnhanced('Complete!', 'success')
```

## Testing Checklist

- [ ] Disconnect internet → offline banner appears
- [ ] Reconnect → "back online" toast
- [ ] Clear favorites → empty state shown
- [ ] Search for nothing → empty state with query
- [ ] Invalid form input → validation message
- [ ] Failed stream → error modal with retry
- [ ] Multiple toasts → stack properly
- [ ] Close toast manually → X button works
