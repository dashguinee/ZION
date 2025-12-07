# Meta-Prompt: User Data Backend Sync (Favorites, History, Watchlist)

## Context
You are implementing backend sync for user data. Currently favorites, watch history, and watchlist are stored ONLY in localStorage - they're lost when users switch devices. This needs to sync to backend.

## Project Location
- Frontend: `/home/dash/zion-github/dash-webtv/`
- Backend: `/home/dash/zion-github/dash-streaming-server/`

## Current Problems

### Favorites (app.js:4795-4810)
```javascript
// Current: localStorage only
addToFavorites(id, type) {
  const favorites = this.loadFavorites()
  localStorage.setItem('dash_favorites', JSON.stringify(updated))
  // NO API CALL - data lost on device switch
}
```

### Watch History (app.js:4842-4924)
```javascript
// Current: localStorage only
addToHistory(item) {
  const history = JSON.parse(localStorage.getItem('dash_history') || '[]')
  localStorage.setItem('dash_history', JSON.stringify(history))
  // NO API CALL - data lost on device switch
}
```

### Watchlist/My List (app.js:4927-4965)
```javascript
// Current: localStorage only
addToWatchlist(item) {
  const list = JSON.parse(localStorage.getItem('dash_watchlist') || '[]')
  localStorage.setItem('dash_watchlist', JSON.stringify(list))
  // NO API CALL - data lost on device switch
}
```

## Implementation Tasks

### 1. Create Backend Endpoints
**File:** `/home/dash/zion-github/dash-streaming-server/src/routes/user-data.js` (NEW)

```javascript
import express from 'express'
import { readJsonFile, writeJsonFile } from '../utils/file-lock.js'

const router = express.Router()

// GET /api/user-data/:username/favorites
router.get('/:username/favorites', async (req, res) => {
  const { username } = req.params
  const userData = await readJsonFile('data/user-data.json')
  const favorites = userData[username]?.favorites || []
  res.json(favorites)
})

// POST /api/user-data/:username/favorites
router.post('/:username/favorites', async (req, res) => {
  const { username } = req.params
  const { favorites } = req.body
  const userData = await readJsonFile('data/user-data.json')
  userData[username] = userData[username] || {}
  userData[username].favorites = favorites
  await writeJsonFile('data/user-data.json', userData)
  res.json({ success: true })
})

// GET /api/user-data/:username/history
router.get('/:username/history', async (req, res) => {
  const { username } = req.params
  const userData = await readJsonFile('data/user-data.json')
  const history = userData[username]?.history || []
  res.json(history)
})

// POST /api/user-data/:username/history
router.post('/:username/history', async (req, res) => {
  const { username } = req.params
  const { history } = req.body
  const userData = await readJsonFile('data/user-data.json')
  userData[username] = userData[username] || {}
  userData[username].history = history.slice(0, 100) // Keep last 100
  await writeJsonFile('data/user-data.json', userData)
  res.json({ success: true })
})

// GET /api/user-data/:username/watchlist
router.get('/:username/watchlist', async (req, res) => {
  const { username } = req.params
  const userData = await readJsonFile('data/user-data.json')
  const watchlist = userData[username]?.watchlist || []
  res.json(watchlist)
})

// POST /api/user-data/:username/watchlist
router.post('/:username/watchlist', async (req, res) => {
  const { username } = req.params
  const { watchlist } = req.body
  const userData = await readJsonFile('data/user-data.json')
  userData[username] = userData[username] || {}
  userData[username].watchlist = watchlist
  await writeJsonFile('data/user-data.json', userData)
  res.json({ success: true })
})

// GET /api/user-data/:username/all - Get everything at once
router.get('/:username/all', async (req, res) => {
  const { username } = req.params
  const userData = await readJsonFile('data/user-data.json')
  const user = userData[username] || {}
  res.json({
    favorites: user.favorites || [],
    history: user.history || [],
    watchlist: user.watchlist || []
  })
})

// POST /api/user-data/:username/sync - Sync all at once
router.post('/:username/sync', async (req, res) => {
  const { username } = req.params
  const { favorites, history, watchlist } = req.body
  const userData = await readJsonFile('data/user-data.json')
  userData[username] = {
    favorites: favorites || [],
    history: (history || []).slice(0, 100),
    watchlist: watchlist || [],
    lastSync: new Date().toISOString()
  }
  await writeJsonFile('data/user-data.json', userData)
  res.json({ success: true })
})

export default router
```

### 2. Register Routes in Backend
**File:** `/home/dash/zion-github/dash-streaming-server/src/index.js`

```javascript
import userDataRouter from './routes/user-data.js'

// Add after other route registrations
app.use('/api/user-data', userDataRouter)
```

### 3. Create Data File
**File:** `/home/dash/zion-github/dash-streaming-server/data/user-data.json`

```json
{}
```

### 4. Update Frontend - Favorites
**File:** `/home/dash/zion-github/dash-webtv/js/app.js`

```javascript
// Replace addToFavorites function
async addToFavorites(id, type) {
  const favorites = this.loadFavorites()
  const item = { id, type, addedAt: new Date().toISOString() }

  // Check if already exists
  if (favorites.some(f => f.id === id && f.type === type)) {
    this.showToast('Already in favorites', 'info')
    return
  }

  favorites.push(item)
  localStorage.setItem('dash_favorites', JSON.stringify(favorites))

  // Sync to backend
  await this.syncFavoritesToBackend(favorites)

  this.showToast('Added to favorites!', 'success')
}

async syncFavoritesToBackend(favorites) {
  const username = localStorage.getItem('dash_user')
  if (!username) return

  try {
    await fetch(`${this.backendUrl}/api/user-data/${username}/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorites })
    })
  } catch (error) {
    console.warn('Failed to sync favorites:', error)
    // Silent fail - localStorage still has data
  }
}
```

### 5. Update Frontend - Watch History
**File:** `/home/dash/zion-github/dash-webtv/js/app.js`

```javascript
// Replace addToHistory function
async addToHistory(item) {
  const history = JSON.parse(localStorage.getItem('dash_history') || '[]')

  // Remove duplicate if exists
  const filtered = history.filter(h =>
    !(h.id === item.id && h.type === item.type)
  )

  // Add to front with timestamp
  filtered.unshift({
    ...item,
    watchedAt: new Date().toISOString()
  })

  // Keep last 100
  const trimmed = filtered.slice(0, 100)
  localStorage.setItem('dash_history', JSON.stringify(trimmed))

  // Sync to backend (debounced)
  this.debouncedSyncHistory(trimmed)
}

// Debounce history sync (don't spam API)
debouncedSyncHistory = this.debounce(async (history) => {
  const username = localStorage.getItem('dash_user')
  if (!username) return

  try {
    await fetch(`${this.backendUrl}/api/user-data/${username}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history })
    })
  } catch (error) {
    console.warn('Failed to sync history:', error)
  }
}, 5000) // Sync every 5 seconds max
```

### 6. Update Frontend - Sync on Login
**File:** `/home/dash/zion-github/dash-webtv/js/app.js`

```javascript
// Add to login success handler
async onLoginSuccess(username) {
  // Load user data from backend
  try {
    const response = await fetch(`${this.backendUrl}/api/user-data/${username}/all`)
    const userData = await response.json()

    // Merge with local data (prefer more recent)
    this.mergeUserData(userData)
  } catch (error) {
    console.warn('Failed to load user data from server:', error)
    // Continue with localStorage data
  }
}

mergeUserData(serverData) {
  const localFavorites = JSON.parse(localStorage.getItem('dash_favorites') || '[]')
  const localHistory = JSON.parse(localStorage.getItem('dash_history') || '[]')
  const localWatchlist = JSON.parse(localStorage.getItem('dash_watchlist') || '[]')

  // Merge favorites (union, no duplicates)
  const mergedFavorites = this.mergeArrays(localFavorites, serverData.favorites, 'id')

  // Merge history (union, sorted by date, limit 100)
  const mergedHistory = this.mergeArrays(localHistory, serverData.history, 'id')
    .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
    .slice(0, 100)

  // Merge watchlist
  const mergedWatchlist = this.mergeArrays(localWatchlist, serverData.watchlist, 'id')

  // Save merged data locally
  localStorage.setItem('dash_favorites', JSON.stringify(mergedFavorites))
  localStorage.setItem('dash_history', JSON.stringify(mergedHistory))
  localStorage.setItem('dash_watchlist', JSON.stringify(mergedWatchlist))

  // Sync merged data back to server
  this.syncAllUserData(mergedFavorites, mergedHistory, mergedWatchlist)
}

async syncAllUserData(favorites, history, watchlist) {
  const username = localStorage.getItem('dash_user')
  if (!username) return

  try {
    await fetch(`${this.backendUrl}/api/user-data/${username}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorites, history, watchlist })
    })
  } catch (error) {
    console.warn('Failed to sync user data:', error)
  }
}
```

### 7. Add Debounce Utility
**File:** `/home/dash/zion-github/dash-webtv/js/app.js`

```javascript
// Add if not exists
debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
```

## Verification Steps
1. Login with test account
2. Add item to favorites
3. Check backend `/data/user-data.json` - should have entry
4. Clear localStorage
5. Login again
6. Favorites should restore from backend
7. Add to watch history
8. Logout, login on "different device" (incognito)
9. History should sync

## Output
Return:
- New route file created
- Frontend functions updated
- Data file created
- Route registered
- Sync flow working
