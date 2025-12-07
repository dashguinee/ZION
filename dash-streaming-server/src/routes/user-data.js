import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import logger from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()
const USER_DATA_FILE = path.join(__dirname, '../../data/user-data.json')

// Initialize user data file if it doesn't exist
async function initUserDataFile() {
  try {
    await fs.access(USER_DATA_FILE)
  } catch {
    await fs.writeFile(USER_DATA_FILE, JSON.stringify({}, null, 2))
    logger.info('Created user-data.json file')
  }
}

// Read user data from file
async function readUserData() {
  try {
    const data = await fs.readFile(USER_DATA_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    logger.error('Error reading user data:', error)
    return {}
  }
}

// Write user data to file
async function writeUserData(userData) {
  try {
    await fs.writeFile(USER_DATA_FILE, JSON.stringify(userData, null, 2))
    return true
  } catch (error) {
    logger.error('Error writing user data:', error)
    return false
  }
}

// Initialize on module load
initUserDataFile()

// GET /api/user-data/:username/favorites
router.get('/:username/favorites', async (req, res) => {
  const { username } = req.params
  const userData = await readUserData()
  const favorites = userData[username]?.favorites || []
  res.json(favorites)
})

// POST /api/user-data/:username/favorites
router.post('/:username/favorites', async (req, res) => {
  const { username } = req.params
  const { favorites } = req.body
  const userData = await readUserData()
  userData[username] = userData[username] || {}
  userData[username].favorites = favorites
  await writeUserData(userData)
  res.json({ success: true })
})

// GET /api/user-data/:username/history
router.get('/:username/history', async (req, res) => {
  const { username } = req.params
  const userData = await readUserData()
  const history = userData[username]?.history || []
  res.json(history)
})

// POST /api/user-data/:username/history
router.post('/:username/history', async (req, res) => {
  const { username } = req.params
  const { history } = req.body
  const userData = await readUserData()
  userData[username] = userData[username] || {}
  userData[username].history = history.slice(0, 100) // Keep last 100
  await writeUserData(userData)
  res.json({ success: true })
})

// GET /api/user-data/:username/watchlist
router.get('/:username/watchlist', async (req, res) => {
  const { username } = req.params
  const userData = await readUserData()
  const watchlist = userData[username]?.watchlist || []
  res.json(watchlist)
})

// POST /api/user-data/:username/watchlist
router.post('/:username/watchlist', async (req, res) => {
  const { username } = req.params
  const { watchlist } = req.body
  const userData = await readUserData()
  userData[username] = userData[username] || {}
  userData[username].watchlist = watchlist
  await writeUserData(userData)
  res.json({ success: true })
})

// GET /api/user-data/:username/all - Get everything at once
router.get('/:username/all', async (req, res) => {
  const { username } = req.params
  const userData = await readUserData()
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
  const userData = await readUserData()
  userData[username] = {
    favorites: favorites || [],
    history: (history || []).slice(0, 100),
    watchlist: watchlist || [],
    lastSync: new Date().toISOString()
  }
  await writeUserData(userData)
  res.json({ success: true })
})

export default router
