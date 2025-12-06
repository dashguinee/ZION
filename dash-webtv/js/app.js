/**
 * DASH WebTV - Main Application
 * With Login System for Dynamic Credentials
 */

class DashApp {
  constructor() {
    // Initialize Xtream Client (no credentials until login)
    this.client = new XtreamClient()

    // App State
    this.state = {
      currentPage: 'home',
      isAuthenticated: false,
      categories: {
        vod: [],
        series: [],
        live: []
      },
      content: {
        movies: [],
        series: [],
        liveTV: []
      },
      selectedCategory: null,
      searchQuery: '',
      favorites: this.loadFavorites(),
      watchHistory: this.loadWatchHistory()
    }

    // DOM Elements
    this.elements = {
      loginOverlay: document.getElementById('login-overlay'),
      appContainer: document.getElementById('app-container'),
      loginError: document.getElementById('login-error'),
      loginBtn: document.getElementById('login-btn'),
      pageContainer: document.getElementById('pageContainer'),
      navItems: document.querySelectorAll('.nav-item[data-page]'),
      searchInput: document.getElementById('searchInput'),
      logo: document.getElementById('logo'),
      accountBtn: document.getElementById('accountBtn'),
      modalContainer: document.getElementById('modalContainer'),
      videoPlayerContainer: document.getElementById('videoPlayerContainer')
    }

    // Video player instance (for proper cleanup)
    this.currentPlayer = null

    // Current stream info for quality changes
    this.currentStreamNeedsTranscode = false

    // Load user tier from localStorage (set after login)
    this.userTier = localStorage.getItem('dash_tier') || 'BASIC'
    this.starshareEnabled = localStorage.getItem('dash_starshare') === 'true'
    this.currentStreamId = null
    this.currentStreamExtension = null
    this.currentStreamType = null

    // Collections for Netflix-style UI
    this.collections = null

    // Local data cache (from JSON files)
    this.localMovies = null
    this.localSeries = null
    this.localLive = null

    // Season grouping cache
    this.groupedSeries = null
    this.seriesGroups = new Map() // baseName -> [series1, series2, ...]

    // Adult content filter (default: hide)
    this.showAdultContent = localStorage.getItem('dash_adult') === 'true'

    // Hero banner rotation
    this.heroSlideIndex = 0
    this.heroSlideTimer = null
    this.heroProgressTimer = null
    this.heroSlideDuration = 8000 // 8 seconds per slide

    this.init()
  }

  // ============================================
  // INITIALIZATION & SESSION MANAGEMENT
  // ============================================

  async ensureLatestServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.update()
        }
        console.log('✅ Service worker check complete')
      } catch (e) {
        console.log('Service worker update check failed:', e)
      }
    }
  }

  async init() {
    console.log('🚀 DASH WebTV initializing...')

    // Force service worker update if needed
    await this.ensureLatestServiceWorker()

    // Check for saved session
    const savedUser = localStorage.getItem('dash_user')
    const savedPass = localStorage.getItem('dash_pass')

    if (savedUser && savedPass) {
      console.log('🔄 Found saved session, auto-logging in...')
      await this.attemptLogin(savedUser, savedPass, true)
    } else {
      console.log('🔒 No saved session, showing login')
      this.showLoginUI()
    }
  }

  async loadLocalData() {
    console.log('📂 Loading local data files...')
    try {
      const [moviesRes, seriesRes, liveRes, collectionsRes] = await Promise.all([
        fetch('data/movies.json'),
        fetch('data/series.json'),
        fetch('data/live.json'),
        fetch('data/collections.json')
      ])

      this.localMovies = await moviesRes.json()
      this.localSeries = await seriesRes.json()
      this.localLive = await liveRes.json()
      this.collections = await collectionsRes.json()

      console.log(`✅ Loaded: ${this.localMovies.length} movies, ${this.localSeries.length} series, ${this.localLive.length} live channels`)
      console.log(`📚 Loaded ${Object.keys(this.collections).length} collections`)

      // Build season groupings for series
      this.buildSeriesGroups()
    } catch (err) {
      console.error('❌ Failed to load local data:', err)
    }
  }

  /**
   * Extract base series name by removing season/language indicators
   * Examples:
   *   "Game of Thrones (season 1)" -> "Game of Thrones"
   *   "Vikings 6" -> "Vikings"
   *   "Stranger Things 2 S02" -> "Stranger Things"
   *   "Breaking Bad (Hindi)" -> "Breaking Bad"
   */
  extractSeriesBaseName(name) {
    if (!name) return ''

    let baseName = name.trim()

    // Remove language tags: (Hindi), (English), (Turkish), (Tamil), (Telugu), (URDU)
    baseName = baseName.replace(/\s*\((Hindi|English|Turkish|Tamil|Telugu|URDU|Urdu|urdu)\)\s*$/i, '')

    // Remove season patterns
    // Pattern: "Season X", "(Season X)", "(season X)", "S0X", "SX"
    baseName = baseName.replace(/\s*\(?\s*[Ss]eason\s*\d+\s*\)?\s*$/i, '')
    baseName = baseName.replace(/\s+S\d{1,2}$/i, '')

    // Remove trailing numbers (Vikings 6 -> Vikings)
    // But be careful: "24" should stay as "24", "1883" should stay as "1883"
    // Only remove if preceded by a word
    baseName = baseName.replace(/\s+\d{1,2}$/, '')

    // Remove trailing "S02", "S2" style without space
    baseName = baseName.replace(/\s*S\d{1,2}\s*$/i, '')

    return baseName.trim()
  }

  /**
   * Extract season number from series name
   */
  extractSeasonNumber(name) {
    if (!name) return 1

    // Match various season patterns
    const patterns = [
      /[Ss]eason\s*(\d+)/,      // Season 1, season 2
      /\(season\s*(\d+)\)/i,    // (season 1)
      /\s+S(\d{1,2})$/i,        // S01, S1
      /\s+(\d{1,2})$/,          // trailing number: Vikings 6
      /\s+S(\d{1,2})\s*$/i      // S02 at end
    ]

    for (const pattern of patterns) {
      const match = name.match(pattern)
      if (match) return parseInt(match[1], 10)
    }

    return 1 // Default to season 1
  }

  /**
   * Build groupings of related series (by season)
   */
  buildSeriesGroups() {
    if (!this.localSeries) return

    this.seriesGroups = new Map()
    const processed = new Set()

    for (const series of this.localSeries) {
      const baseName = this.extractSeriesBaseName(series.name)
      const seasonNum = this.extractSeasonNumber(series.name)

      if (!this.seriesGroups.has(baseName)) {
        this.seriesGroups.set(baseName, [])
      }

      this.seriesGroups.get(baseName).push({
        ...series,
        season_number: seasonNum,
        base_name: baseName
      })
    }

    // Sort seasons within each group
    for (const [baseName, seasons] of this.seriesGroups) {
      seasons.sort((a, b) => a.season_number - b.season_number)
    }

    // Create grouped series list (one entry per base name)
    this.groupedSeries = []
    for (const [baseName, seasons] of this.seriesGroups) {
      if (seasons.length > 1) {
        // Multiple seasons - create grouped entry
        const primary = seasons[0] // Use first season as primary
        this.groupedSeries.push({
          ...primary,
          name: baseName,
          is_grouped: true,
          season_count: seasons.length,
          seasons: seasons,
          all_series_ids: seasons.map(s => s.series_id)
        })
      } else {
        // Single season - keep as is
        this.groupedSeries.push({
          ...seasons[0],
          is_grouped: false,
          season_count: 1,
          seasons: seasons
        })
      }
    }

    // Count multi-season series
    const multiSeasonCount = [...this.seriesGroups.values()].filter(s => s.length > 1).length
    console.log(`📺 Season grouping: ${this.groupedSeries.length} unique series (${multiSeasonCount} with multiple seasons)`)
  }

  // ============================================
  // CONTENT SCORING ALGORITHM
  // Prioritizes: Images, Ratings, English/African, Recent content
  // ============================================

  /**
   * Score content for priority display
   * Higher score = shown first
   */
  scoreContent(item) {
    let score = 0
    const category = (item.category_name || '').toUpperCase()
    const name = (item.name || '').toUpperCase()

    // IMAGE SCORE (30 points max)
    // Content with images should appear first
    const hasImage = item.stream_icon && item.stream_icon.trim() &&
                     !item.stream_icon.includes('placeholder')
    if (hasImage) {
      // High quality TMDB images get full points
      if (item.stream_icon.includes('tmdb.org')) {
        score += 30
      } else {
        score += 20
      }
    }

    // RATING SCORE (25 points max)
    const rating = parseFloat(item.rating) || 0
    if (rating >= 8.0) score += 25
    else if (rating >= 7.0) score += 20
    else if (rating >= 6.0) score += 15
    else if (rating >= 5.0) score += 10
    else score += 5

    // LANGUAGE/ORIGIN SCORE (20 points max)
    // English and African content prioritized for West Africa market
    const englishKeywords = ['ENGLISH', 'HOLLYWOOD', 'NETFLIX', 'AMAZON PRIME',
                             'HBO', 'APPLE TV', 'DISNEY', 'HULU', 'OSCAR', 'BLOCKBUSTER']
    const africanKeywords = ['AFRICA', 'NOLLYWOOD', 'LAGOS', 'NIGERIA', 'GHANA', 'KENYA']
    const indianKeywords = ['HINDI', 'TAMIL', 'TELUGU', 'MALAYALAM', 'KANNADA',
                           'MARATHI', 'BANGLA', 'PUNJABI', 'INDIAN', 'SOUTH INDIAN']
    const turkishKeywords = ['TURKISH']

    if (africanKeywords.some(kw => category.includes(kw) || name.includes(kw))) {
      score += 20 // African content same priority as English
    } else if (englishKeywords.some(kw => category.includes(kw))) {
      score += 20
    } else if (turkishKeywords.some(kw => category.includes(kw))) {
      score += 10
    } else if (indianKeywords.some(kw => category.includes(kw))) {
      score += 8 // Indian content lower priority (dedicated section)
    } else {
      score += 5
    }

    // YEAR SCORE (15 points max)
    const year = parseInt(item.year) || 0
    const currentYear = new Date().getFullYear()
    if (year >= currentYear) score += 15
    else if (year >= currentYear - 1) score += 12
    else if (year >= currentYear - 2) score += 10
    else if (year >= currentYear - 3) score += 8
    else if (year >= 2020) score += 5
    else score += 3

    // POPULARITY BOOST (10 points max)
    if (category.includes('BLOCKBUSTER')) score += 10
    if (category.includes('NETFLIX')) score += 8
    if (category.includes('OSCAR')) score += 8
    if (category.includes('4K')) score += 5
    if (category.includes('FHD')) score += 3

    // PENALTY: CAM quality
    if (name.includes('(CAM)') || category.includes('(CAM)')) {
      score -= 15
    }

    return score
  }

  /**
   * Sort content by priority score (highest first)
   */
  sortByPriority(items) {
    if (!items || !Array.isArray(items)) return items
    return [...items].sort((a, b) => this.scoreContent(b) - this.scoreContent(a))
  }

  /**
   * Check if content is English/Western (for filtering)
   */
  isEnglishContent(item) {
    const category = (item.category_name || '').toUpperCase()
    const englishKeywords = ['ENGLISH', 'HOLLYWOOD', 'NETFLIX', 'AMAZON PRIME',
                             'HBO', 'APPLE TV', 'DISNEY', 'HULU', 'OSCAR', 'BLOCKBUSTER', 'BBC', 'KIDS']
    return englishKeywords.some(kw => category.includes(kw))
  }

  /**
   * Check if content is Indian (for dedicated section)
   */
  isIndianContent(item) {
    const category = (item.category_name || '').toUpperCase()
    const indianKeywords = ['HINDI', 'TAMIL', 'TELUGU', 'MALAYALAM', 'KANNADA',
                           'MARATHI', 'BANGLA', 'PUNJABI', 'INDIAN', 'SOUTH INDIAN']
    return indianKeywords.some(kw => category.includes(kw))
  }

  /**
   * Check if content is Turkish (for dedicated section)
   */
  isTurkishContent(item) {
    const category = (item.category_name || '').toUpperCase()
    return category.includes('TURKISH')
  }

  filterAdultContent(items) {
    if (this.showAdultContent) return items
    return items.filter(item => !item.is_adult)
  }

  // Fix HTTP images for HTTPS site - proxy through our worker
  fixImageUrl(url) {
    if (!url) return '/assets/placeholder.svg'
    // If it's HTTP, proxy it through our Cloudflare worker to avoid mixed content blocking
    if (url.startsWith('http://')) {
      return `https://dash-webtv-proxy.dash-webtv.workers.dev/?url=${encodeURIComponent(url)}`
    }
    return url
  }

  getMovieById(id) {
    return this.localMovies?.find(m => String(m.stream_id) === String(id))
  }

  getCollectionMovies(collectionKey, limit = 20) {
    const collection = this.collections?.[collectionKey]
    if (!collection) return []

    // First try by ID
    let movies = []
    if (collection.movies && collection.movies.length > 0) {
      movies = collection.movies.map(id => this.getMovieById(id)).filter(Boolean)
    }

    // If no movies found by ID, search by collection keywords/name
    if (movies.length < 3) {
      const searchTerms = this.getCollectionSearchTerms(collectionKey)
      if (searchTerms.length > 0) {
        const keywordMatches = (this.localMovies || []).filter(m => {
          const name = (m.name || '').toLowerCase()
          const plot = (m.plot || '').toLowerCase()
          return searchTerms.some(term => name.includes(term) || plot.includes(term))
        })
        // Add matches that aren't already in the list
        const existingIds = new Set(movies.map(m => m.stream_id))
        keywordMatches.forEach(m => {
          if (!existingIds.has(m.stream_id) && m.stream_icon) {
            movies.push(m)
          }
        })
      }
    }

    // Sort by rating and return limited results
    return movies
      .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
      .slice(0, limit)
  }

  // Get search terms for a collection
  getCollectionSearchTerms(collectionKey) {
    const searchMap = {
      'fast_furious': ['fast', 'furious', 'f9', 'f10', 'hobbs', 'shaw'],
      'marvel': ['marvel', 'avengers', 'spider-man', 'iron man', 'thor', 'hulk', 'captain america', 'guardians galaxy', 'black panther', 'ant-man', 'doctor strange'],
      'dc': ['batman', 'superman', 'wonder woman', 'justice league', 'aquaman', 'flash', 'shazam', 'joker', 'dc'],
      'wizarding_world': ['harry potter', 'fantastic beasts', 'hogwarts', 'dumbledore', 'voldemort'],
      'star_wars': ['star wars', 'jedi', 'skywalker', 'mandalorian', 'boba fett', 'force awakens', 'rogue one'],
      'john_wick': ['john wick', 'wick'],
      'james_bond': ['bond', '007', 'skyfall', 'spectre', 'casino royale'],
      'horror': ['horror', 'scary', 'nightmare', 'haunted', 'conjuring', 'annabelle', 'exorcist'],
      'comedy': ['comedy', 'funny', 'laugh'],
      'romance': ['romance', 'love story', 'romantic'],
      'bollywood': ['bollywood', 'hindi', 'shah rukh', 'salman khan', 'aamir khan'],
      'african_stories': ['nigeria', 'nollywood', 'africa', 'lagos', 'johannesburg', 'kenya', 'ghana'],
      'kdrama': ['korean', 'k-drama', 'kdrama'],
      'turkish_drama': ['turkish', 'turkey']
    }
    return searchMap[collectionKey] || []
  }

  showLoginUI() {
    this.elements.loginOverlay.style.display = 'flex'
    this.elements.appContainer.style.display = 'none'
  }

  showAppUI() {
    this.elements.loginOverlay.style.display = 'none'
    this.elements.appContainer.style.display = 'block'
    this.state.isAuthenticated = true

    // Setup event listeners once app is shown
    this.setupEventListeners()

    // Load content
    this.loadAppContent()
  }

  async handleLogin() {
    console.log('🔐 handleLogin called')
    const username = document.getElementById('login-username').value
    const password = document.getElementById('login-password').value
    const btn = this.elements.loginBtn
    const errorEl = this.elements.loginError

    console.log('📝 Username:', username ? `${username.substring(0,3)}***` : 'EMPTY')
    console.log('📝 Password:', password ? '***SET***' : 'EMPTY')

    // Clear previous error
    errorEl.textContent = ''

    // Validate inputs
    if (!username || !password) {
      errorEl.textContent = 'Please enter username and password'
      return
    }

    // Show loading state
    btn.textContent = 'CONNECTING...'
    btn.disabled = true

    try {
      await this.attemptLogin(username, password, false)
    } catch (error) {
      console.error('❌ Login error:', error)
      errorEl.textContent = 'Connection error: ' + error.message
    }

    // Reset button
    btn.textContent = 'ENTER UNIVERSE'
    btn.disabled = false
  }

  async attemptLogin(username, password, isAutoLogin) {
    console.log('🔄 attemptLogin called, isAuto:', isAutoLogin)

    let result
    try {
      result = await this.client.login(username, password)
      console.log('📨 Login result:', JSON.stringify(result))
    } catch (error) {
      console.error('❌ Login fetch error:', error)
      result = { success: false, error: 'Network error: ' + error.message }
    }

    if (result.success) {
      // Save credentials for session persistence
      localStorage.setItem('dash_user', username)
      localStorage.setItem('dash_pass', password)

      // Fetch user's tier from DASH backend
      await this.fetchUserTier(username)

      console.log('✅ Login successful!')
      this.showAppUI()
    } else {
      const errorMsg = result.error || 'Invalid username or password'
      console.error('❌ Login failed:', errorMsg)

      if (!isAutoLogin) {
        // Show error to user with styling
        this.elements.loginError.textContent = errorMsg
        this.elements.loginError.style.display = 'block'
        this.elements.loginError.style.color = '#ff6b6b'
        this.elements.loginError.style.padding = '10px'
        this.elements.loginError.style.marginTop = '10px'
        this.elements.loginError.style.background = 'rgba(255,0,0,0.1)'
        this.elements.loginError.style.borderRadius = '8px'
      } else {
        // Auto-login failed, show login screen
        console.warn('⚠️ Auto-login failed, showing login screen')
        localStorage.removeItem('dash_user')
        localStorage.removeItem('dash_pass')
        this.showLoginUI()
      }
    }
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('dash_user')
      localStorage.removeItem('dash_pass')
      localStorage.removeItem('dash_tier')
      localStorage.removeItem('dash_starshare')
      localStorage.removeItem('dash_endpoints')
      location.reload()
    }
  }

  /**
   * Fetch user's tier from DASH backend
   * Stores: tier (BASIC/STANDARD/PREMIUM), starshareEnabled, endpoints
   */
  async fetchUserTier(username) {
    try {
      const backendUrl = this.client.serverUrl || 'https://zion-production-39d8.up.railway.app'
      const res = await fetch(`${backendUrl}/api/iptv-access/${encodeURIComponent(username)}`)
      const data = await res.json()

      if (data.success) {
        // Store tier info
        localStorage.setItem('dash_tier', data.tier || 'BASIC')
        localStorage.setItem('dash_starshare', data.starshareEnabled ? 'true' : 'false')
        localStorage.setItem('dash_endpoints', JSON.stringify(data.endpoints || {}))

        console.log(`🎫 User tier: ${data.tier}, StarShare: ${data.starshareEnabled}`)

        // Store in app state for quick access
        this.userTier = data.tier || 'BASIC'
        this.starshareEnabled = data.starshareEnabled || false
        this.tierEndpoints = data.endpoints || {}
      } else {
        // Default to BASIC if not found
        console.log('ℹ️ User not in DASH system, defaulting to BASIC tier')
        localStorage.setItem('dash_tier', 'BASIC')
        localStorage.setItem('dash_starshare', 'true') // StarShare login worked
        this.userTier = 'BASIC'
        this.starshareEnabled = true
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch tier info:', err.message)
      // Default to BASIC
      localStorage.setItem('dash_tier', 'BASIC')
      this.userTier = 'BASIC'
      this.starshareEnabled = true
    }
  }

  /**
   * Get user's current tier (from memory or localStorage)
   */
  getUserTier() {
    return this.userTier || localStorage.getItem('dash_tier') || 'BASIC'
  }

  /**
   * Check if user has StarShare access
   */
  hasStarshareAccess() {
    return this.starshareEnabled || localStorage.getItem('dash_starshare') === 'true'
  }

  /**
   * Check if content is accessible for user's tier
   * @param {string} contentSource - 'starshare', 'iptv-org', 'free-tv', etc.
   */
  canAccessContent(contentSource) {
    // Free content always accessible
    if (['iptv-org', 'free-tv', 'pluto', 'movies-library'].includes(contentSource)) {
      return true
    }

    // StarShare content requires starshareEnabled
    if (contentSource === 'starshare') {
      return this.hasStarshareAccess()
    }

    return true
  }

  /**
   * Get max channels allowed for current tier
   */
  getMaxChannels() {
    const tier = this.getUserTier()
    switch (tier) {
      case 'BASIC': return 50
      case 'STANDARD': return 200
      case 'PREMIUM': return Infinity
      default: return 50
    }
  }

  async loadAppContent() {
    console.log('📂 Loading app content...')

    // Load local data files (movies, series, collections)
    await this.loadLocalData()

    // Load categories from API
    await this.loadCategories()

    // Load offline/degraded content status for health indicators
    await this.loadOfflineStatus()

    // Render home page
    this.navigate('home')
  }

  setupEventListeners() {
    // Navigation
    this.elements.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page
        if (page) this.navigate(page)
      })
    })

    // Logo click
    if (this.elements.logo) {
      this.elements.logo.addEventListener('click', () => {
        this.navigate('home')
      })
    }

    // Account button
    if (this.elements.accountBtn) {
      this.elements.accountBtn.addEventListener('click', () => {
        this.navigate('account')
      })
    }

    // Search
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value
        this.handleSearch()
      })
    }

    // Close modal on overlay click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.closeModal()
      }
    })
  }

  // ============================================
  // CATEGORIES & NAVIGATION
  // ============================================

  async loadCategories() {
    try {
      console.log('📂 Loading categories from local files...')

      // Load categories from local JSON files instead of API
      const [vodCatsRes, seriesCatsRes, liveCatsRes] = await Promise.all([
        fetch('data/vod_categories.json'),
        fetch('data/series_categories.json'),
        fetch('data/live_categories.json')
      ])

      this.state.categories.vod = await vodCatsRes.json() || []
      this.state.categories.series = await seriesCatsRes.json() || []
      this.state.categories.live = await liveCatsRes.json() || []

      console.log(`✅ Loaded ${this.state.categories.vod.length} movie categories`)
      console.log(`✅ Loaded ${this.state.categories.series.length} series categories`)
      console.log(`✅ Loaded ${this.state.categories.live.length} live TV categories`)

    } catch (error) {
      console.error('❌ Failed to load categories:', error)
      this.showError('Failed to load categories')
    }
  }

  navigate(page) {
    this.state.currentPage = page

    // Reset pagination when navigating to new page
    this.loadMoreOffset = 100
    this.state.selectedCategory = null

    // Update active nav item
    this.elements.navItems.forEach(item => {
      if (item.dataset.page === page) {
        item.classList.add('active')
      } else {
        item.classList.remove('active')
      }
    })

    this.renderPage(page)
  }

  async renderPage(page) {
    this.showLoading()

    let content = ''

    switch (page) {
      case 'home':
        content = await this.renderHomePage()
        break
      case 'movies':
        content = await this.renderMoviesPage()
        break
      case 'series':
        content = await this.renderSeriesPage()
        break
      case 'live':
        content = await this.renderLiveTVPage()
        break
      case 'account':
        content = this.renderAccountPage()
        break
      case 'collection':
        content = this.renderCollectionPage()
        break
      case 'search':
        content = this.renderSearchResults()
        break
      case 'favorites':
        content = this.renderFavoritesPage()
        break
      case 'downloads':
        content = this.renderDownloadsPage()
        break
      case 'continue_watching':
        content = this.renderContinueWatchingPage()
        break
      case 'mylist':
        content = this.renderMyListPage()
        break
      default:
        content = '<div class="empty-state"><h2>Page not found</h2></div>'
    }

    this.elements.pageContainer.innerHTML = content
  }

  // ============================================
  // PAGE RENDERERS
  // ============================================

  async renderHomePage() {
    const username = localStorage.getItem('dash_user') || 'User'

    // Get hero movies for rotation (top rated with images from real collections)
    const heroMovies = [
      ...this.getCollectionMovies('marvel', 2),
      ...this.getCollectionMovies('african_stories', 1),
      ...this.getCollectionMovies('star_wars', 1),
      ...this.getCollectionMovies('award_winners', 1)
    ].filter(m => m?.stream_icon).slice(0, 5)

    // Fallback: if no collection movies, get top rated from all movies
    if (heroMovies.length === 0) {
      const fallbackHero = (this.localMovies || [])
        .filter(m => m.stream_icon && m.rating && parseFloat(m.rating) > 7)
        .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
        .slice(0, 5)
      heroMovies.push(...fallbackHero)
    }

    // Build collection rows - WESTERN FOCUSED with blockbusters
    const collectionRows = [
      { key: 'african_stories', title: '🌍 African Stories', icon: 'globe', featured: true },
      { key: 'marvel', title: '🦸 Marvel Universe', icon: 'zap' },
      { key: 'dc', title: '🦇 DC Universe', icon: 'zap' },
      { key: 'fast_furious', title: '🏎️ Fast & Furious', icon: 'car' },
      { key: 'wizarding_world', title: '⚡ Wizarding World', icon: 'magic' },
      { key: 'star_wars', title: '✨ Star Wars', icon: 'star' },
      { key: 'john_wick', title: '🔫 John Wick', icon: 'target' },
      { key: 'james_bond', title: '🎯 James Bond 007', icon: 'target' },
      { key: 'kids_family', title: '👨‍👩‍👧‍👦 Kids & Family', icon: 'smile' },
      { key: 'kdrama', title: '🇰🇷 K-Drama', icon: 'heart' },
      { key: 'netflix', title: '🎬 Netflix Originals', icon: 'play' },
      { key: '4k_quality', title: '📺 4K Ultra HD', icon: 'monitor' },
      { key: 'horror', title: '👻 Horror', icon: 'moon' },
      { key: 'comedy', title: '😂 Comedy', icon: 'smile' },
      { key: 'romance', title: '💕 Romance', icon: 'heart' },
      { key: 'documentary', title: '📚 Documentaries', icon: 'award' },
      { key: 'bollywood', title: '🎭 Bollywood', icon: 'gem' },
      { key: 'turkish_drama', title: '🇹🇷 Turkish Drama', icon: 'palette' },
      { key: 'award_winners', title: '🏆 Award Winners', icon: 'award' },
    ]

    // Schedule hero rotation after render
    setTimeout(() => this.startHeroRotation(), 100)

    return `
      <div class="fade-in premium-home">
        <!-- CINEMATIC HERO BANNER WITH AUTO-ROTATION -->
        <div class="hero-cinematic" id="hero-cinematic">
          <div class="hero-slides">
            ${heroMovies.map((movie, index) => `
              <div class="hero-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
                <img src="${this.fixImageUrl(movie.stream_icon)}" alt="${movie.name}" class="hero-bg"
                     onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&q=80'">
                <div class="hero-gradient hero-gradient-left"></div>
                <div class="hero-gradient hero-gradient-bottom"></div>
                <div class="hero-vignette"></div>
                <div class="hero-content">
                  <div class="hero-badge-premium">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    ${index === 0 ? 'TOP RATED' : index === 1 ? 'TRENDING' : 'FEATURED'}
                  </div>
                  <h1 class="hero-title-premium">${movie.name}</h1>
                  <div class="hero-meta-premium">
                    ${movie.year ? `<span class="hero-meta-item">${movie.year}</span>` : ''}
                    ${movie.rating ? `<span class="hero-meta-item hero-meta-rating">★ ${movie.rating}</span>` : ''}
                    ${movie.category_name ? `<span class="hero-meta-item">${movie.category_name}</span>` : ''}
                  </div>
                  <p class="hero-description-premium">${movie.plot || 'An incredible cinematic experience awaits. Dive into a world of stunning visuals and captivating storytelling.'}</p>
                  <div class="hero-actions-premium">
                    <button class="btn-play-premium btn-ripple" onclick="dashApp.playContent('${movie.stream_id}', 'movie')">
                      <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Play
                    </button>
                    <button class="btn-info-premium" onclick="dashApp.showDetails('${movie.stream_id}', 'movie')">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      More Info
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Hero Navigation Dots -->
          <div class="hero-dots">
            ${heroMovies.map((_, index) => `
              <button class="hero-dot ${index === 0 ? 'active' : ''}" data-dot="${index}" onclick="dashApp.goToHeroSlide(${index})"></button>
            `).join('')}
          </div>

          <!-- Progress Bar -->
          <div class="hero-progress">
            <div class="hero-progress-bar" id="hero-progress-bar"></div>
          </div>
        </div>

        <!-- Continue Watching Row (Priority 1) -->
        ${this.renderContinueWatchingRow()}

        <!-- Trending Now (Activity-Based) -->
        ${this.renderTrendingRow()}

        <!-- My List Row (Priority 2) -->
        ${this.renderMyListRow()}

        <!-- Popular in [Language] (Activity-Based) -->
        ${this.renderLanguageRow()}

        <!-- Top 10 Today (Netflix Style) -->
        ${this.renderTop10Row()}

        <!-- Because You Watched (Recommendations) -->
        ${this.renderRecommendationsRow()}

        <!-- Collection Rows (Netflix Style) -->
        ${collectionRows.map(row => {
          // Special African Stories row with tall poster style
          if (row.key === 'african_stories') {
            return this.renderAfricanStoriesRow()
          }
          // Special Kids & Family row with playful bubble style
          if (row.key === 'kids_family') {
            return this.renderKidsRow()
          }
          // Special K-Drama row with elegant Korean aesthetic
          if (row.key === 'kdrama') {
            return this.renderKDramaRow()
          }
          // Handle mixed collections (series + movies)
          const collection = this.collections?.[row.key]
          if (collection?.type === 'mixed' || collection?.type === 'series') {
            return this.renderMixedCollectionRow(row.key, row.title, row.icon)
          }
          const movies = this.filterAdultContent(this.getCollectionMovies(row.key, 20))
          if (movies.length === 0) return ''
          return `
            <div class="collection-row ${row.featured ? 'featured-row' : ''}">
              <div class="collection-header">
                <h2 class="collection-title">
                  ${this.getCollectionIcon(row.icon)}
                  ${row.title}
                </h2>
                <span class="collection-see-all" onclick="dashApp.showCollection('${row.key}')">
                  See All
                  <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                </span>
              </div>
              <div class="collection-carousel" data-collection="${row.key}">
                <button class="carousel-btn carousel-btn-left" onclick="dashApp.scrollCarousel('${row.key}', -1)">‹</button>
                <div class="carousel-track">
                  ${movies.map(movie => this.renderMovieCard(movie)).join('')}
                </div>
                <button class="carousel-btn carousel-btn-right" onclick="dashApp.scrollCarousel('${row.key}', 1)">›</button>
              </div>
            </div>
          `
        }).join('')}

        <!-- Quick Links - Premium -->
        <div class="quick-links">
          <div class="quick-link-card" onclick="dashApp.navigate('movies')">
            <div class="quick-link-icon-wrap">
              <svg viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                <line x1="7" y1="2" x2="7" y2="22"/>
                <line x1="17" y1="2" x2="17" y2="22"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
              </svg>
            </div>
            <div class="quick-link-title">Movies</div>
            <div class="quick-link-count">${this.localMovies?.length.toLocaleString() || '49,396'} Titles</div>
          </div>
          <div class="quick-link-card" onclick="dashApp.navigate('series')">
            <div class="quick-link-icon-wrap">
              <svg viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                <polyline points="17 2 12 7 7 2"/>
              </svg>
            </div>
            <div class="quick-link-title">TV Series</div>
            <div class="quick-link-count">${this.localSeries?.length.toLocaleString() || '14,483'} Shows</div>
          </div>
          <div class="quick-link-card" onclick="dashApp.navigate('live')">
            <div class="quick-link-icon-wrap">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="2"/>
                <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
              </svg>
            </div>
            <div class="quick-link-title">Live TV</div>
            <div class="quick-link-count">${this.localLive?.length.toLocaleString() || '10,452'} Channels</div>
          </div>
        </div>
      </div>
    `
  }

  // Hero rotation functions
  startHeroRotation() {
    // Clear any existing timers
    this.stopHeroRotation()

    const slides = document.querySelectorAll('.hero-slide')
    if (slides.length <= 1) return

    // Start progress bar animation
    this.animateHeroProgress()

    // Start rotation timer
    this.heroSlideTimer = setInterval(() => {
      this.heroSlideIndex = (this.heroSlideIndex + 1) % slides.length
      this.updateHeroSlide()
      this.animateHeroProgress()
    }, this.heroSlideDuration)
  }

  stopHeroRotation() {
    if (this.heroSlideTimer) {
      clearInterval(this.heroSlideTimer)
      this.heroSlideTimer = null
    }
    if (this.heroProgressTimer) {
      cancelAnimationFrame(this.heroProgressTimer)
      this.heroProgressTimer = null
    }
  }

  animateHeroProgress() {
    const progressBar = document.getElementById('hero-progress-bar')
    if (!progressBar) return

    const startTime = performance.now()
    const duration = this.heroSlideDuration

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min((elapsed / duration) * 100, 100)
      progressBar.style.width = `${progress}%`

      if (progress < 100) {
        this.heroProgressTimer = requestAnimationFrame(animate)
      }
    }

    progressBar.style.width = '0%'
    this.heroProgressTimer = requestAnimationFrame(animate)
  }

  updateHeroSlide() {
    const slides = document.querySelectorAll('.hero-slide')
    const dots = document.querySelectorAll('.hero-dot')

    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === this.heroSlideIndex)
    })

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.heroSlideIndex)
    })
  }

  goToHeroSlide(index) {
    this.heroSlideIndex = index
    this.updateHeroSlide()

    // Reset rotation timer
    this.stopHeroRotation()
    this.startHeroRotation()
  }

  getCollectionIcon(iconName) {
    const icons = {
      fire: '<svg class="collection-title-icon" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
      star: '<svg class="collection-title-icon" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
      award: '<svg class="collection-title-icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
      zap: '<svg class="collection-title-icon" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
      target: '<svg class="collection-title-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
      smile: '<svg class="collection-title-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
      moon: '<svg class="collection-title-icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
      heart: '<svg class="collection-title-icon" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      palette: '<svg class="collection-title-icon" viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c0.926 0 1.648-0.746 1.648-1.688 0-0.437-0.18-0.835-0.437-1.125-0.29-0.289-0.438-0.652-0.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>',
      gem: '<svg class="collection-title-icon" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 22 22 7 12 2"/><polyline points="2 7 12 12 22 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>',
      globe: '<svg class="collection-title-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
      film: '<svg class="collection-title-icon" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
      video: '<svg class="collection-title-icon" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
      flag: '<svg class="collection-title-icon" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
      calendar: '<svg class="collection-title-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      clock: '<svg class="collection-title-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    }
    return icons[iconName] || ''
  }

  renderMovieCard(movie) {
    const poster = this.fixImageUrl(movie.stream_icon)
    const title = movie.name || 'Untitled'
    const id = movie.stream_id
    const year = movie.year || movie.releaseDate?.slice(0, 4) || ''
    const healthClass = this.getContentHealthClass(id, 'movie')

    return `
      <div class="movie-card ${healthClass}" onclick="dashApp.showDetails('${id}', 'movie')">
        <img src="${poster}" alt="${title}" class="movie-card-poster" loading="lazy"
             onerror="this.onerror=null;this.src='/assets/placeholder.svg'">
        <div class="movie-card-overlay">
          <div class="movie-card-play">
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
        <div class="movie-card-info">
          <div class="movie-card-title">${title}${year ? ` (${year})` : ''}</div>
          ${movie.rating ? `<div class="movie-card-rating">★ ${movie.rating}</div>` : ''}
        </div>
      </div>
    `
  }

  scrollCarousel(collectionKey, direction) {
    const carousel = document.querySelector(`[data-collection="${collectionKey}"] .carousel-track`)
    if (carousel) {
      const scrollAmount = 300 * direction
      carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  showCollection(collectionKey) {
    const collection = this.collections?.[collectionKey]
    if (!collection) return

    // Store for rendering
    this.currentCollection = collectionKey
    this.navigate('collection')
  }

  renderCollectionPage() {
    const collection = this.collections?.[this.currentCollection]
    if (!collection) return '<div class="empty-state">Collection not found</div>'

    // Handle "Coming Soon" collections
    if (collection.coming_soon) {
      return `
        <div class="fade-in">
          <div class="page-header">
            <button class="btn btn-back" onclick="dashApp.navigate('home')">← Back</button>
            <h1>${collection.title}</h1>
            <p class="page-description">${collection.description}</p>
          </div>
          <div class="coming-soon-banner">
            <div class="coming-soon-icon">🎬</div>
            <h2>Coming Soon!</h2>
            <p>We're working on bringing you the best content. Stay tuned!</p>
          </div>
        </div>
      `
    }

    // Check if this is a SERIES collection
    if (collection.type === 'series') {
      return this.renderSeriesCollection(collection)
    }

    let movies = []

    // Handle dynamic collections that filter by category
    if (collection.dynamic && collection.filter?.categories) {
      const categoryKeywords = collection.filter.categories.map(c => c.toUpperCase())
      movies = (this.localMovies || []).filter(movie => {
        const category = (movie.category_name || '').toUpperCase()
        return categoryKeywords.some(kw => category.includes(kw))
      })
    } else if (collection.dynamic && collection.filter?.extensions) {
      // Filter by file extension (for offline_ready collection)
      const extensions = collection.filter.extensions
      movies = (this.localMovies || []).filter(movie => {
        const ext = (movie.container_extension || '').toLowerCase()
        return extensions.includes(ext)
      })
    } else {
      // Static collection with movie IDs
      movies = (collection.movies || []).map(id => this.getMovieById(id)).filter(Boolean)
    }

    // Filter adult content and apply priority sorting
    movies = this.filterAdultContent(movies)
    movies = this.sortByPriority(movies)

    return `
      <div class="fade-in">
        <div class="page-header">
          <button class="btn btn-back" onclick="dashApp.navigate('home')">← Back</button>
          <h1>${collection.title}</h1>
          <p class="page-description">${collection.description} (${movies.length.toLocaleString()} titles)</p>
        </div>
        <div class="content-grid">
          ${this.renderContentGrid(movies, 'movie')}
        </div>
      </div>
    `
  }

  // New: Render Series Collection (for African Stories, Kids, K-Drama)
  renderSeriesCollection(collection) {
    let series = []

    // Handle dynamic series collections that filter by category
    if (collection.dynamic && collection.filter?.series_categories) {
      const categoryKeywords = collection.filter.series_categories.map(c => c.toUpperCase())
      series = (this.localSeries || []).filter(s => {
        const category = (s.category_name || '').toUpperCase()
        return categoryKeywords.some(kw => category.includes(kw))
      })
    } else if (collection.series && collection.series.length > 0) {
      // Static series collection with series IDs
      series = collection.series.map(id =>
        (this.localSeries || []).find(s => s.series_id === id || String(s.series_id) === String(id))
      ).filter(Boolean)
    }

    // Also search by keywords if provided (for African content)
    if (collection.keywords && collection.keywords.length > 0) {
      const keywordMatches = (this.localSeries || []).filter(s => {
        const name = (s.name || '').toLowerCase()
        const plot = (s.plot || '').toLowerCase()
        const category = (s.category_name || '').toLowerCase()
        return collection.keywords.some(kw =>
          name.includes(kw) || plot.includes(kw) || category.includes(kw)
        )
      })
      // Merge and dedupe
      const existingIds = new Set(series.map(s => s.series_id))
      keywordMatches.forEach(s => {
        if (!existingIds.has(s.series_id)) {
          series.push(s)
        }
      })
    }

    // Sort by rating (higher first), then by having images
    series = series.sort((a, b) => {
      const ratingA = parseFloat(a.rating) || 0
      const ratingB = parseFloat(b.rating) || 0
      if (ratingB !== ratingA) return ratingB - ratingA
      const hasImgA = a.cover && a.cover.includes('tmdb') ? 1 : 0
      const hasImgB = b.cover && b.cover.includes('tmdb') ? 1 : 0
      return hasImgB - hasImgA
    })

    return `
      <div class="fade-in">
        <div class="page-header">
          <button class="btn btn-back" onclick="dashApp.navigate('home')">← Back</button>
          <h1>${collection.title}</h1>
          <p class="page-description">${collection.description} (${series.length.toLocaleString()} shows)</p>
        </div>
        <div class="content-grid">
          ${this.renderContentGrid(series, 'series')}
        </div>
      </div>
    `
  }

  async renderMoviesPage() {
    const categories = this.state.categories.vod || []

    // Use local JSON data instead of API
    let movies = this.localMovies || []

    // Filter by category if selected
    if (this.state.selectedCategory) {
      movies = movies.filter(m => String(m.category_id) === String(this.state.selectedCategory))
    }

    // Filter adult content
    movies = this.filterAdultContent(movies)

    // Sort by priority score (images, ratings, English/African first)
    movies = this.sortByPriority(movies)

    // Get category counts
    const totalMovies = this.localMovies?.length || 0
    const filteredCount = movies.length
    const categoryCount = categories.length

    return `
      <div class="fade-in">
        <!-- Premium Header -->
        <div class="browse-header">
          <div class="browse-title-row">
            <div class="browse-icon">
              <svg viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                <line x1="7" y1="2" x2="7" y2="22"/>
                <line x1="17" y1="2" x2="17" y2="22"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
              </svg>
            </div>
            <h1 class="browse-title">Movies</h1>
          </div>

          <div class="browse-stats">
            <div class="browse-stat">
              <div class="browse-stat-icon">
                <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <div class="browse-stat-info">
                <span class="browse-stat-value">${totalMovies.toLocaleString()}</span>
                <span class="browse-stat-label">Total Movies</span>
              </div>
            </div>
            <div class="browse-stat">
              <div class="browse-stat-icon">
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div class="browse-stat-info">
                <span class="browse-stat-value">${categoryCount}</span>
                <span class="browse-stat-label">Categories</span>
              </div>
            </div>
            <div class="browse-stat">
              <div class="browse-stat-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div class="browse-stat-info">
                <span class="browse-stat-value">2025</span>
                <span class="browse-stat-label">Latest</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Premium Category Tabs -->
        <div class="category-tabs-container">
          <div class="category-tabs">
            <div class="category-tab ${!this.state.selectedCategory ? 'active' : ''}"
                 onclick="dashApp.filterByCategory(null, 'vod')">
              All Movies
            </div>
            ${categories.slice(0, 30).map(cat => `
              <div class="category-tab ${this.state.selectedCategory === cat.category_id ? 'active' : ''}"
                   onclick="dashApp.filterByCategory('${cat.category_id}', 'vod')">
                ${cat.category_name}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Movies Grid -->
        <div class="browse-grid">
          ${this.renderBrowseGrid((movies || []).slice(0, this.loadMoreOffset || 100), 'movie')}
        </div>

        ${(movies || []).length > 100 ? `
          <div class="load-more-container">
            <button class="btn-load-more" onclick="dashApp.loadMore()">
              Load More Movies
            </button>
          </div>
        ` : ''}
      </div>
    `
  }

  async renderSeriesPage() {
    const categories = this.state.categories.series || []

    // Use grouped series for cleaner display (related seasons combined)
    let series = this.groupedSeries || this.localSeries || []

    // Filter by category if selected
    if (this.state.selectedCategory) {
      series = series.filter(s => String(s.category_id) === String(this.state.selectedCategory))
    }

    // Filter adult content
    series = this.filterAdultContent(series)

    // Sort by priority score (images, ratings, English/African first)
    series = this.sortByPriority(series)

    const totalSeries = this.groupedSeries?.length || this.localSeries?.length || 0
    const categoryCount = categories.length

    return `
      <div class="fade-in">
        <!-- Premium Header -->
        <div class="browse-header">
          <div class="browse-title-row">
            <div class="browse-icon">
              <svg viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                <polyline points="17 2 12 7 7 2"/>
              </svg>
            </div>
            <h1 class="browse-title">TV Series</h1>
          </div>

          <div class="browse-stats">
            <div class="browse-stat">
              <div class="browse-stat-icon">
                <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
              </div>
              <div class="browse-stat-info">
                <span class="browse-stat-value">${totalSeries.toLocaleString()}</span>
                <span class="browse-stat-label">Total Series</span>
              </div>
            </div>
            <div class="browse-stat">
              <div class="browse-stat-icon">
                <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </div>
              <div class="browse-stat-info">
                <span class="browse-stat-value">${categoryCount}</span>
                <span class="browse-stat-label">Categories</span>
              </div>
            </div>
            <div class="browse-stat">
              <div class="browse-stat-icon">
                <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <div class="browse-stat-info">
                <span class="browse-stat-value">500K+</span>
                <span class="browse-stat-label">Episodes</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Premium Category Tabs -->
        <div class="category-tabs-container">
          <div class="category-tabs">
            <div class="category-tab ${!this.state.selectedCategory ? 'active' : ''}"
                 onclick="dashApp.filterByCategory(null, 'series')">
              All Series
            </div>
            ${categories.slice(0, 30).map(cat => `
              <div class="category-tab ${this.state.selectedCategory === cat.category_id ? 'active' : ''}"
                   onclick="dashApp.filterByCategory('${cat.category_id}', 'series')">
                ${cat.category_name}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Series Grid -->
        <div class="browse-grid">
          ${this.renderBrowseGrid((series || []).slice(0, this.loadMoreOffset || 100), 'series')}
        </div>

        ${(series || []).length > 100 ? `
          <div class="load-more-container">
            <button class="btn-load-more" onclick="dashApp.loadMore()">
              Load More Series
            </button>
          </div>
        ` : ''}
      </div>
    `
  }

  async renderLiveTVPage() {
    const categories = this.state.categories.live || []

    // Use local JSON data instead of API
    let channels = this.localLive || []

    // Filter by category if selected
    if (this.state.selectedCategory) {
      channels = channels.filter(c => String(c.category_id) === String(this.state.selectedCategory))
    }

    // Filter adult content
    channels = this.filterAdultContent(channels)

    // Apply tier-based channel limit
    const maxChannels = this.getMaxChannels()
    const userTier = this.getUserTier()
    const isLimited = channels.length > maxChannels && maxChannels !== Infinity

    // For limited tiers, prioritize popular/high-quality channels
    if (isLimited) {
      // Sort by stream_icon presence (channels with logos are usually more popular)
      channels = channels
        .sort((a, b) => (b.stream_icon ? 1 : 0) - (a.stream_icon ? 1 : 0))
        .slice(0, maxChannels)
    }

    const totalChannels = this.localLive?.length || 0
    const categoryCount = categories.length

    return `
      <div class="fade-in">
        <!-- Premium Header -->
        <div class="browse-header">
          <div class="browse-title-row">
            <div class="browse-icon live-icon">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="2"/>
                <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
              </svg>
            </div>
            <h1 class="browse-title">Live TV</h1>
            <div class="live-indicator">
              <span class="live-dot-pulse"></span>
              LIVE
            </div>
          </div>

          ${isLimited ? `
            <div class="tier-upgrade-banner">
              <div class="tier-info">
                <span class="tier-badge tier-${userTier.toLowerCase()}">${userTier}</span>
                <span class="tier-text">Your plan includes ${maxChannels} channels of ${totalChannels.toLocaleString()} available</span>
              </div>
              <button class="btn-upgrade" onclick="dashApp.navigate('account')">
                Upgrade Plan
              </button>
            </div>
          ` : ''}

          <div class="browse-stats">
            <div class="browse-stat">
              <div class="browse-stat-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49"/></svg>
              </div>
              <div class="browse-stat-info">
                <span class="browse-stat-value">${isLimited ? channels.length : totalChannels.toLocaleString()}</span>
                <span class="browse-stat-label">${isLimited ? 'Your Channels' : 'Channels'}</span>
              </div>
            </div>
            <div class="browse-stat">
              <div class="browse-stat-icon">
                <svg viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              </div>
              <div class="browse-stat-info">
                <span class="browse-stat-value">${categoryCount}</span>
                <span class="browse-stat-label">Countries</span>
              </div>
            </div>
            <div class="browse-stat">
              <div class="browse-stat-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </div>
              <div class="browse-stat-info">
                <span class="browse-stat-value">24/7</span>
                <span class="browse-stat-label">Streaming</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Premium Category Tabs -->
        <div class="category-tabs-container">
          <div class="category-tabs">
            <div class="category-tab ${!this.state.selectedCategory ? 'active' : ''}"
                 onclick="dashApp.filterByCategory(null, 'live')">
              All Channels
            </div>
            ${categories.slice(0, 40).map(cat => `
              <div class="category-tab ${this.state.selectedCategory === cat.category_id ? 'active' : ''}"
                   onclick="dashApp.filterByCategory('${cat.category_id}', 'live')">
                ${cat.category_name}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Live TV Grid with Glow Cards -->
        <div class="live-grid">
          ${this.renderLiveGrid((channels || []).slice(0, this.loadMoreOffset || 120))}
        </div>

        ${(channels || []).length > 120 ? `
          <div class="load-more-container">
            <button class="btn-load-more" onclick="dashApp.loadMore()">
              Load More Channels
            </button>
          </div>
        ` : ''}
      </div>
    `
  }

  renderAccountPage() {
    const username = localStorage.getItem('dash_user') || 'User'
    const userTier = this.getUserTier()
    const hasStarshare = this.hasStarshareAccess()
    const maxChannels = this.getMaxChannels()

    // Tier display config
    const tierConfig = {
      BASIC: { color: '#64748b', label: 'Basic', desc: `${maxChannels} live channels` },
      STANDARD: { color: '#0ea5e9', label: 'Standard', desc: `${maxChannels} live channels` },
      PREMIUM: { color: '#7c3aed', label: 'Premium', desc: 'Unlimited access' }
    }
    const tier = tierConfig[userTier] || tierConfig.BASIC

    return `
      <div class="fade-in">
        <div class="page-title-row">
          <svg class="page-title-icon" viewBox="0 0 24 24" fill="none" stroke="var(--primary-purple)" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <h1>Account</h1>
        </div>

        <div class="card glass p-lg mt-md">
          <div class="account-section">
            <svg class="account-icon" viewBox="0 0 24 24" fill="none" stroke="var(--primary-purple)" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <div>
              <h3>Logged in as</h3>
              <p style="color: var(--primary-purple); font-size: 1.5rem; font-weight: bold;">${username}</p>
            </div>
          </div>
        </div>

        <!-- Subscription Tier Card -->
        <div class="card glass p-lg mt-md">
          <div class="account-section">
            <svg class="account-icon" viewBox="0 0 24 24" fill="none" stroke="${tier.color}" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <div style="flex:1;">
              <h3>Your Plan</h3>
              <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
                <span class="tier-badge tier-${userTier.toLowerCase()}">${tier.label}</span>
                ${hasStarshare ? '<span class="badge" style="background: linear-gradient(135deg, #f97316, #fb923c); font-size: 0.7rem;">+ StarShare VOD</span>' : ''}
              </div>
              <p style="color: var(--text-secondary); margin-top: 8px; font-size: 0.9rem;">${tier.desc}</p>
            </div>
          </div>
        </div>

        <div class="card glass p-lg mt-md" onclick="dashApp.navigate('favorites')" style="cursor: pointer;">
          <div class="account-section">
            <svg class="account-icon" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <div style="flex:1;">
              <h3>My Favorites</h3>
              <p style="color: var(--text-secondary);">${this.loadFavorites().length} saved items</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>

        <div class="card glass p-lg mt-md">
          <div class="account-section">
            <svg class="account-icon" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div>
              <h3>Subscription Status</h3>
              <p style="color: var(--accent-green); font-weight: 600;">Active</p>
            </div>
          </div>
        </div>

        <div class="card glass p-lg mt-md">
          <div class="account-section">
            <svg class="account-icon" viewBox="0 0 24 24" fill="none" stroke="var(--primary-cyan)" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <div style="flex:1;">
              <h3>Streaming Quality</h3>
              <p style="color: var(--text-secondary); margin-bottom: 0.75rem;">Default quality for transcoded content (MKV)</p>
              <select id="accountQualitySelect" onchange="dashApp.updateQualityPreference(this.value)" class="quality-select-account">
                ${this.client.getAvailableQualities().map(q =>
                  `<option value="${q}" ${q === this.client.getPreferredQuality() ? 'selected' : ''}>${q}</option>`
                ).join('')}
              </select>
            </div>
          </div>
        </div>

        <div class="card glass p-lg mt-md">
          <div class="account-section">
            <svg class="account-icon" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <div>
              <h3>Session</h3>
              <button class="btn btn-outline btn-ripple" onclick="dashApp.logout()" style="margin-top: 1rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  /**
   * Update quality preference from Account page
   */
  updateQualityPreference(quality) {
    if (this.client.setPreferredQuality(quality)) {
      // Show confirmation
      const select = document.getElementById('accountQualitySelect')
      if (select) {
        select.style.borderColor = 'var(--accent-green)'
        setTimeout(() => {
          select.style.borderColor = ''
        }, 1000)
      }
    }
  }

  // ============================================
  // CONTENT RENDERING
  // ============================================

  renderContentGrid(items, type) {
    if (!items || items.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-title">No content found</div>
        </div>
      `
    }

    // Helper to check if item has a real image
    const hasRealImage = (item) => {
      const poster = item.stream_icon || item.cover
      return poster && poster.trim() &&
             !poster.includes('placeholder') &&
             poster !== 'null' &&
             poster !== 'undefined'
    }

    // Separate items with and without images
    const withImages = items.filter(hasRealImage)
    const withoutImages = items.filter(item => !hasRealImage(item))

    // Render a single item card
    const renderCard = (item, isNeonCard = false) => {
      const poster = this.fixImageUrl(item.stream_icon || item.cover)
      const title = item.name || 'Untitled'
      const year = item.year || ''
      const id = item.stream_id || item.series_id

      const escapedTitle = title.replace(/'/g, "\\'")
      const clickHandler = type === 'live'
        ? `dashApp.playLiveChannel('${id}', '${escapedTitle}')`
        : `dashApp.showDetails('${id}', '${type}')`

      // Use neon card style for items without images
      if (isNeonCard || !hasRealImage(item)) {
        return `
          <div class="content-card neon-card" onclick="${clickHandler}">
            <div class="neon-card-content">
              <div class="neon-title">${title}</div>
              ${year ? `<div class="neon-year">${year}</div>` : ''}
            </div>
          </div>
        `
      }

      return `
        <div class="content-card" onclick="${clickHandler}">
          <img src="${poster}" alt="${title}" class="content-card-poster" loading="lazy"
               onerror="this.parentElement.classList.add('neon-card');this.remove();this.parentElement.innerHTML='<div class=\\'neon-card-content\\'><div class=\\'neon-title\\'>${escapedTitle}</div></div>'">
          <div class="content-card-overlay">
            <div class="content-card-title">${title}</div>
            <div class="content-card-meta">
              ${this.renderBadges(item)}
            </div>
          </div>
        </div>
      `
    }

    // Build the grid HTML
    let html = ''

    // Render all items with images first
    html += withImages.map(item => renderCard(item)).join('')

    // If there are items without images, group them in a "Hidden Gems" section
    if (withoutImages.length > 0) {
      html += `
        <div class="neon-section-divider">
          <div class="neon-section-title">Hidden Gems</div>
          <div class="neon-section-subtitle">${withoutImages.length} titles without posters</div>
        </div>
      `
      // Render neon cards in rows of 4
      html += withoutImages.map(item => renderCard(item, true)).join('')
    }

    return html
  }

  renderBadges(item) {
    let badges = ''
    const categoryName = (item.category_name || '').toLowerCase()
    const extension = item.container_extension || ''

    // Download badge for MKV content (offline-ready)
    if (extension === 'mkv') {
      badges += '<span class="badge badge-download" title="Download for Offline">⬇️ DL</span>'
    }

    if (categoryName.includes('netflix')) {
      badges += '<span class="badge badge-netflix">Netflix</span>'
    }
    if (categoryName.includes('prime') || categoryName.includes('amazon')) {
      badges += '<span class="badge badge-prime">Prime</span>'
    }
    if (categoryName.includes('hbo')) {
      badges += '<span class="badge badge-hbo">HBO</span>'
    }
    if (categoryName.includes('4k') || categoryName.includes('uhd')) {
      badges += '<span class="badge badge-4k">4K</span>'
    }

    return badges
  }

  // Premium Browse Grid for Movies/Series pages
  renderBrowseGrid(items, type) {
    if (!items || items.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div class="empty-state-title">No content found</div>
          <div class="empty-state-description">Try selecting a different category</div>
        </div>
      `
    }

    return items.map(item => {
      const hasImage = item.stream_icon || item.cover
      const poster = this.fixImageUrl(item.stream_icon || item.cover)
      const title = item.name || 'Untitled'
      const id = item.stream_id || item.series_id
      const year = item.year || item.releaseDate?.slice(0, 4) || ''
      const rating = item.rating || item.rating_5based
      const plot = item.plot || ''

      // Check if this is offline exclusive (MKV)
      // Movies have container_extension, series we check category
      const ext = (item.container_extension || '').toLowerCase()
      const isOfflineExclusive = ext === 'mkv'

      // Gold download icon for offline exclusive content
      const offlineIcon = isOfflineExclusive ? `
        <div class="offline-exclusive-badge" title="Offline Exclusive - Download Only">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>
      ` : ''

      // Season count badge for grouped series
      const seasonBadge = (type === 'series' && item.is_grouped && item.season_count > 1) ? `
        <div class="season-count-badge" title="${item.season_count} Seasons Available">
          ${item.season_count} Seasons
        </div>
      ` : ''

      // NEON card for movies without images
      if (!hasImage) {
        // Generate gradient based on title
        const gradients = [
          ['#667eea', '#764ba2'],  // Purple
          ['#f093fb', '#f5576c'],  // Pink
          ['#4facfe', '#00f2fe'],  // Cyan
          ['#43e97b', '#38f9d7'],  // Green
          ['#fa709a', '#fee140'],  // Sunset
          ['#a8edea', '#fed6e3'],  // Soft
          ['#ff9a9e', '#fecfef'],  // Rose
          ['#667eea', '#764ba2'],  // Purple
        ]
        const gradientIndex = title.length % gradients.length
        const [color1, color2] = gradients[gradientIndex]

        return `
          <div class="browse-card neon-card" onclick="dashApp.showDetails('${id}', '${type}')"
               style="--neon-color1: ${color1}; --neon-color2: ${color2};">
            <div class="browse-card-poster-wrap neon-poster">
              <div class="neon-content">
                <div class="neon-title">${title.length > 30 ? title.slice(0, 27) + '...' : title}</div>
                ${year ? `<div class="neon-year">${year}</div>` : ''}
                ${plot ? `<div class="neon-plot">${plot.slice(0, 80)}${plot.length > 80 ? '...' : ''}</div>` : ''}
              </div>
              <div class="browse-card-overlay">
                <div class="browse-card-play">
                  <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
              </div>
              ${offlineIcon}
              ${seasonBadge}
              ${rating ? `<div class="browse-card-rating">★ ${parseFloat(rating).toFixed(1)}</div>` : ''}
            </div>
            <div class="browse-card-info">
              <div class="browse-card-title">${title}</div>
              ${year ? `<div class="browse-card-year">${year}</div>` : ''}
            </div>
          </div>
        `
      }

      return `
        <div class="browse-card" onclick="dashApp.showDetails('${id}', '${type}')">
          <div class="browse-card-poster-wrap">
            <img src="${poster}" alt="${title}" class="browse-card-poster" loading="lazy"
                 onerror="this.onerror=null; this.parentElement.innerHTML = dashApp.getNeonFallback('${title.replace(/'/g, "\\'")}', '${year}')">
            <div class="browse-card-overlay">
              <div class="browse-card-play">
                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
            ${offlineIcon}
            ${seasonBadge}
            ${rating ? `<div class="browse-card-rating">★ ${parseFloat(rating).toFixed(1)}</div>` : ''}
          </div>
          <div class="browse-card-info">
            <div class="browse-card-title">${title}</div>
            ${year ? `<div class="browse-card-year">${year}</div>` : ''}
          </div>
        </div>
      `
    }).join('')
  }

  // Neon fallback for broken images (called via onerror)
  getNeonFallback(title, year) {
    const gradients = [
      ['#667eea', '#764ba2'],  // Purple
      ['#f093fb', '#f5576c'],  // Pink
      ['#4facfe', '#00f2fe'],  // Cyan
      ['#43e97b', '#38f9d7'],  // Green
      ['#fa709a', '#fee140'],  // Sunset
      ['#a8edea', '#fed6e3'],  // Soft
      ['#ff9a9e', '#fecfef'],  // Rose
      ['#6a11cb', '#2575fc'],  // Royal
    ]
    const gradientIndex = (title || '').length % gradients.length
    const [color1, color2] = gradients[gradientIndex]

    return `
      <div class="neon-fallback" style="--neon-color1: ${color1}; --neon-color2: ${color2};">
        <div class="neon-title">${(title || 'Unknown').length > 25 ? (title || 'Unknown').slice(0, 22) + '...' : (title || 'Unknown')}</div>
        ${year ? `<div class="neon-year">${year}</div>` : ''}
      </div>
    `
  }

  // Premium Live TV Grid with Glow Cards
  renderLiveGrid(channels) {
    if (!channels || channels.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="2"/>
              <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
            </svg>
          </div>
          <div class="empty-state-title">No channels found</div>
          <div class="empty-state-description">Try selecting a different category</div>
        </div>
      `
    }

    return channels.map(channel => {
      const logo = this.fixImageUrl(channel.stream_icon)
      const name = channel.name || 'Unknown Channel'
      const id = channel.stream_id
      const hasLogo = channel.stream_icon && !channel.stream_icon.includes('placeholder')
      const healthClass = this.getContentHealthClass(id, 'live')

      // Generate a deterministic color based on channel name
      const colors = [
        ['#9d4edd', '#3a86ff'],  // Purple to Blue
        ['#ff6b6b', '#feca57'],  // Red to Yellow
        ['#00d9ff', '#9d4edd'],  // Cyan to Purple
        ['#48dbfb', '#10ac84'],  // Light Blue to Green
        ['#ff9f43', '#ee5a24'],  // Orange to Red
        ['#00b894', '#00cec9'],  // Green to Teal
      ]
      const colorIndex = name.charCodeAt(0) % colors.length
      const [color1, color2] = colors[colorIndex]

      // Escape name for safe onclick
      const escapedName = name.replace(/'/g, "\\'")

      return `
        <div class="live-card ${hasLogo ? '' : 'live-card-glow'} ${healthClass}" onclick="dashApp.playLiveChannel('${id}', '${escapedName}')"
             style="${!hasLogo ? `--glow-color-1: ${color1}; --glow-color-2: ${color2};` : ''}">
          ${hasLogo ? `
            <img src="${logo}" alt="${name}" class="live-card-logo" loading="lazy"
                 onerror="this.parentElement.classList.add('live-card-glow');this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div class="live-card-fallback" style="display:none;">
              <div class="live-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="2"/>
                  <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49"/>
                </svg>
              </div>
            </div>
          ` : `
            <div class="live-card-fallback">
              <div class="live-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="2"/>
                  <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49"/>
                </svg>
              </div>
            </div>
          `}
          <div class="live-card-overlay">
            <div class="live-badge">
              <span class="live-dot"></span>
              LIVE
            </div>
          </div>
          <div class="live-card-name-bar">${name}</div>
        </div>
      `
    }).join('')
  }

  // ============================================
  // CONTENT DETAILS & PLAYBACK
  // ============================================

  async showDetails(id, type) {
    console.log(`📖 Showing details for ${type}:`, id)

    // Check if this is a grouped series (multiple seasons combined)
    if (type === 'series') {
      const groupedInfo = this.groupedSeries?.find(s => String(s.series_id) === String(id))
      if (groupedInfo?.is_grouped && groupedInfo.seasons?.length > 1) {
        // Show season picker for grouped series
        this.showSeasonPicker(groupedInfo)
        return
      }
    }

    // Show loading in modal
    this.elements.modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal" style="display:flex;align-items:center;justify-content:center;min-height:300px;">
          <div class="loading-container">
            <div class="spinner"></div>
            <div class="loading-text">Loading ${type} details...</div>
          </div>
        </div>
      </div>
    `

    let details = null
    let localInfo = null

    // Get local info for fallback display
    if (type === 'movie') {
      localInfo = this.localMovies?.find(m => String(m.stream_id) === String(id))
    } else if (type === 'series') {
      localInfo = this.localSeries?.find(s => String(s.series_id) === String(id))
    }

    try {
      if (type === 'movie') {
        details = await this.client.getVODInfo(id)
      } else if (type === 'series') {
        details = await this.client.getSeriesInfo(id)
      }
      console.log(`✅ Got ${type} details from API:`, details)
    } catch (error) {
      console.error(`❌ Failed to load ${type} details from API:`, error)
      // Don't return - we can still show local info and allow play attempt
    }

    // Merge local info with API details
    const info = details?.info || {}
    const name = info.name || localInfo?.name || 'Untitled'
    const cover = this.fixImageUrl(info.cover || localInfo?.cover || localInfo?.stream_icon)
    const plot = info.plot || localInfo?.plot || 'No description available.'
    const rating = info.rating || localInfo?.rating || ''
    const year = info.releaseDate?.slice(0,4) || localInfo?.year || ''
    const extension = info.container_extension || details?.movie_data?.container_extension || localInfo?.container_extension || 'mp4'

    let modalContent = ''

    if (type === 'movie') {
      modalContent = `
        <div class="modal-actions">
          <button class="btn btn-primary btn-ripple" onclick="dashApp.playContent('${id}', 'movie', '${extension}')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="margin-right:8px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Play Now
          </button>
          <button class="btn btn-outline" onclick="dashApp.addToFavorites('${id}', 'movie')">
            ❤️ Add to Favorites
          </button>
        </div>
      `
    } else if (type === 'series') {
      // Check if we got episodes from API
      if (details?.episodes && Object.keys(details.episodes).length > 0) {
        const seasons = Object.keys(details.episodes).sort((a, b) => parseInt(a) - parseInt(b))

        // DEBUG: Log first episode to see its structure
        const firstSeason = seasons[0]
        const firstEp = details.episodes[firstSeason]?.[0]
        console.log('🔍 DEBUG - First episode object:', firstEp)
        console.log('🔍 DEBUG - Episode keys:', firstEp ? Object.keys(firstEp) : 'N/A')

        modalContent = `
          <div class="series-episodes">
            ${seasons.map(seasonNum => {
              const episodes = details.episodes[seasonNum]
              return `
                <div class="season-section">
                  <h3>Season ${seasonNum}</h3>
                  <div class="episode-list">
                    ${episodes.map(ep => {
                      const ext = (ep.container_extension || 'mp4').toLowerCase()
                      const isOfflineExclusive = ext === 'mkv'
                      const epTitle = (ep.title || `Episode ${ep.episode_num}`).replace(/'/g, "\\'")

                      if (isOfflineExclusive) {
                        // OFFLINE EXCLUSIVE (MKV) - Now with streaming via server remux!
                        // Server remuxes MKV→MP4 automatically (same H264/AAC codecs)
                        return `
                          <div class="episode-card offline-exclusive-episode" onclick="dashApp.playEpisode('${ep.id}', '${ext}')">
                            <div class="episode-number">E${ep.episode_num}</div>
                            <div class="episode-info">
                              <div class="episode-title">${ep.title || `Episode ${ep.episode_num}`} <span class="format-badge offline-exclusive">⬇️ OFFLINE EXCLUSIVE</span></div>
                              <div class="episode-meta">${ep.duration || ''} • Stream or Download</div>
                            </div>
                            <div class="episode-actions">
                              <button class="episode-btn stream-btn" onclick="event.stopPropagation(); dashApp.playEpisode('${ep.id}', '${ext}')" title="Stream (server remux)">▶️ Stream</button>
                              <button class="episode-btn download-btn" onclick="event.stopPropagation(); dashApp.downloadToDevice('${ep.id}', '${ext}', '${epTitle}', '${id}')" title="Download to device">⬇️</button>
                            </div>
                          </div>
                        `
                      } else {
                        // STREAM FIRST (MP4) - Can stream directly, download limited
                        return `
                          <div class="episode-card" onclick="dashApp.playEpisode('${ep.id}', '${ext}')">
                            <div class="episode-number">E${ep.episode_num}</div>
                            <div class="episode-info">
                              <div class="episode-title">${ep.title || `Episode ${ep.episode_num}`} <span class="format-badge stream-first">▶️ STREAM FIRST</span></div>
                              <div class="episode-meta">${ep.duration || ''}</div>
                            </div>
                            <div class="episode-actions">
                              <button class="episode-btn stream-btn" onclick="event.stopPropagation(); dashApp.playEpisode('${ep.id}', '${ext}')">▶️ Stream</button>
                              <button class="episode-btn stream-download-btn" onclick="event.stopPropagation(); dashApp.downloadStreamFirst('${ep.id}', '${ext}', '${epTitle}', '${id}')" title="Download (limited)">⬇️</button>
                            </div>
                          </div>
                        `
                      }
                    }).join('')}
                  </div>
                </div>
              `
            }).join('')}
          </div>
        `
      } else {
        // No episodes from API - show message with retry option
        const episodeCount = localInfo?.episode_count || 'Unknown'
        modalContent = `
          <div class="series-no-episodes">
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">
              📺 This series has ${episodeCount} episodes.
            </p>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.9rem;">
              Episodes are loaded from the streaming server. If they don't appear, try refreshing or check your connection.
            </p>
            <button class="btn btn-primary" onclick="dashApp.showDetails('${id}', 'series')">
              🔄 Retry Loading Episodes
            </button>
          </div>
        `
      }
    }

    const seasonCount = details?.episodes ? Object.keys(details.episodes).length : 0

    const modalHTML = `
      <div class="modal-overlay">
        <div class="modal">
          <button class="modal-close" onclick="dashApp.closeModal()">×</button>

          <div class="modal-header">
            <img src="${cover}" alt="${name}"
                 class="modal-header-bg" onerror="this.onerror=null;this.src='/assets/placeholder.svg'">
            <div class="modal-header-overlay">
              <h1 class="modal-title">${name}</h1>
              <div class="modal-meta">
                ${year ? `<span>📅 ${year}</span>` : ''}
                ${rating ? `<span>⭐ ${rating}</span>` : ''}
                ${type === 'series' && seasonCount > 0 ? `<span>📺 ${seasonCount} Seasons</span>` : ''}
                ${info.duration ? `<span>⏱️ ${info.duration}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="modal-body">
            <p class="modal-description">${plot}</p>
            ${modalContent}
          </div>
        </div>
      </div>
    `

    this.elements.modalContainer.innerHTML = modalHTML
  }

  closeModal() {
    this.elements.modalContainer.innerHTML = ''
  }

  /**
   * Show season picker for grouped series (multiple seasons)
   */
  showSeasonPicker(groupedSeries) {
    const seasons = groupedSeries.seasons || []
    const baseName = groupedSeries.name || groupedSeries.base_name
    const cover = this.fixImageUrl(groupedSeries.cover || groupedSeries.stream_icon)
    const plot = groupedSeries.plot || 'Multiple seasons available'

    const seasonCards = seasons.map(season => {
      const seasonName = season.name || `Season ${season.season_number}`
      const seasonCover = this.fixImageUrl(season.cover || season.stream_icon || cover)
      const episodeCount = season.episode_count || '?'

      return `
        <div class="season-picker-card" onclick="dashApp.showDetails('${season.series_id}', 'series'); dashApp.lastGroupedSeries = null;">
          <div class="season-picker-poster">
            <img src="${seasonCover}" alt="${seasonName}" loading="lazy"
                 onerror="this.src='${cover}'">
          </div>
          <div class="season-picker-info">
            <div class="season-picker-title">${seasonName}</div>
            <div class="season-picker-episodes">${episodeCount} episodes</div>
          </div>
        </div>
      `
    }).join('')

    this.elements.modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal season-picker-modal">
          <button class="modal-close" onclick="dashApp.closeModal()">×</button>

          <div class="modal-header">
            <img src="${cover}" alt="${baseName}" class="modal-poster">
            <div class="modal-info">
              <h2>${baseName}</h2>
              <p class="modal-plot">${plot}</p>
              <div class="season-picker-badge">${seasons.length} Seasons Available</div>
            </div>
          </div>

          <div class="season-picker-container">
            <h3 class="season-picker-heading">Select a Season</h3>
            <div class="season-picker-grid">
              ${seasonCards}
            </div>
          </div>
        </div>
      </div>
    `

    // Store for reference when closing
    this.lastGroupedSeries = groupedSeries
  }

  async playContent(id, type, extension = 'mp4') {
    console.log(`Playing ${type}:`, id, `Original format: ${extension}`)

    let streamUrl = ''

    if (type === 'movie') {
      // Pass the ORIGINAL extension to buildVODUrl
      // xtream-client.js will route MKV/AVI/etc through FFmpeg server
      // MP4 goes direct to Starshare (no transcoding needed)
      if (extension.toLowerCase() !== 'mp4') {
        console.log(`🔄 MKV detected - routing through FFmpeg transcoding server`)
      } else {
        console.log('🎬 Using direct MP4 stream')
      }
      // buildVODUrl handles the routing:
      // - MKV/AVI/etc → FFmpeg server (https://zion-production-39d8.up.railway.app)
      // - MP4 → Direct to Starshare
      streamUrl = this.client.buildVODUrl(id, extension)

      // Save to watch history
      const movie = (this.localMovies || []).find(m => String(m.stream_id) === String(id))
      if (movie) {
        this.saveToWatchHistory(id, 'movie', {
          name: movie.name,
          image: movie.stream_icon || movie.cover
        }, 0)
      }
    } else if (type === 'live') {
      // Use playLiveChannel instead for proper channel name handling
      this.playLiveChannel(id, 'Live Channel')
      return
    }

    console.log('Stream URL:', streamUrl)
    this.closeModal()
    this.showVideoPlayer(streamUrl, type)
  }

  /**
   * Play a live TV channel with channel name for overlay
   */
  playLiveChannel(id, channelName) {
    console.log(`🔴 Playing live channel: ${channelName} (ID: ${id})`)

    // Store channel info for UI
    this.currentLiveStreamId = id
    this.currentChannelName = channelName
    this._proxyRetried = false

    // Build stream URL
    const liveStream = this.client.buildLiveStreamUrl(id, 'ts')
    console.log(`📡 Live stream type: ${liveStream.type}`)

    this.closeModal()
    this.showVideoPlayer(liveStream.url, 'live', liveStream.type, channelName)
  }

  playEpisode(episodeId, extension = 'mp4', seriesInfo = null) {
    console.log(`📺 Playing episode: ${episodeId}, Original format: ${extension}`)

    // Check if this content needs transcoding (for quality selector display)
    const needsTranscode = ['mkv', 'avi', 'flv', 'wmv', 'mov', 'webm']
      .includes(extension.toLowerCase())

    // Store current stream info for quality changes
    this.currentStreamNeedsTranscode = needsTranscode
    this.currentStreamId = episodeId
    this.currentStreamExtension = extension
    this.currentStreamType = 'series'

    // Pass the ORIGINAL extension to buildSeriesUrl
    // xtream-client.js will route MKV/AVI/etc through FFmpeg server
    // MP4 goes direct to Starshare (no transcoding needed)
    if (needsTranscode) {
      console.log(`🔄 MKV detected - routing through FFmpeg transcoding server @ ${this.client.getPreferredQuality()}`)
    }

    // Save to watch history if we have series info
    if (this._currentSeriesInfo) {
      this.saveToWatchHistory(this._currentSeriesInfo.id, 'series', {
        name: this._currentSeriesInfo.name,
        image: this._currentSeriesInfo.cover || this._currentSeriesInfo.stream_icon,
        episodeId: episodeId,
        episodeName: this._currentEpisodeName || `Episode ${episodeId}`
      }, 0)
    }

    // buildSeriesUrl handles the routing:
    // - MKV/AVI/etc → FFmpeg server (https://zion-production-39d8.up.railway.app)
    // - MP4 → Direct to Starshare
    const streamUrl = this.client.buildSeriesUrl(episodeId, extension)
    console.log('📺 Stream URL:', streamUrl)

    this.closeModal()
    this.showVideoPlayer(streamUrl, 'series')
  }

  /**
   * Try to play MKV episode - may fail in browser
   * Strategy 1: Safari/iOS - Try HLS (.m3u8) which they support natively
   * Strategy 2: Request as MP4 (server might remux on-the-fly)
   */
  tryPlayEpisode(episodeId, extension = 'mkv') {
    console.log(`🎯 Attempting to play MKV episode: ${episodeId}`)

    // Check if Safari/iOS - they have native HLS support
    if (this.client.hasNativeHLS()) {
      // Try HLS endpoint first for Safari/iOS
      const hlsUrl = this.client.buildSeriesUrl(episodeId, 'm3u8')
      console.log('🍎 Safari/iOS detected - trying HLS URL:', hlsUrl)
      this.closeModal()
      this.showVideoPlayer(hlsUrl, 'series', 'hls-native')
    } else {
      // For other browsers, try MP4 (some servers remux on-the-fly)
      const mp4Url = this.client.buildSeriesUrl(episodeId, 'mp4')
      console.log('📺 Trying MP4 URL (server remux):', mp4Url)
      this.closeModal()
      this.showVideoPlayer(mp4Url, 'series')
    }
  }

  /**
   * Open MKV episode in external player
   * On mobile: Opens in VLC, MX Player, or default video app
   * On desktop: Opens in default video player or downloads
   */
  downloadEpisode(episodeId, extension = 'mkv', title = 'Episode') {
    console.log(`🎬 Opening episode in external player: ${episodeId} (${extension})`)

    // Use DIRECT URL for external players - they can handle MKV natively
    const streamUrl = this.client.buildDirectSeriesUrl(episodeId, extension)
    console.log('🎬 Stream URL:', streamUrl)

    // Detect platform
    const isAndroid = /Android/i.test(navigator.userAgent)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isMobile = isAndroid || isIOS

    if (isAndroid) {
      // Android: Try intent URL for video players
      // This will prompt user to choose: VLC, MX Player, etc.
      const intentUrl = `intent:${streamUrl}#Intent;type=video/*;end`
      console.log('📱 Android intent URL:', intentUrl)

      // Try intent first, fallback to direct open
      try {
        window.location.href = intentUrl
      } catch (e) {
        window.open(streamUrl, '_blank')
      }
      this.showToast(`Opening in video player...`, 'info')
    } else if (isIOS) {
      // iOS: VLC has a custom URL scheme
      // vlc-x-callback://x-callback-url/stream?url=VIDEO_URL
      const vlcUrl = `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(streamUrl)}`
      console.log('🍎 iOS VLC URL:', vlcUrl)

      // Try VLC first, then Infuse, then direct
      const tryOpen = (url, fallback) => {
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.src = url
        document.body.appendChild(iframe)
        setTimeout(() => {
          document.body.removeChild(iframe)
          if (fallback) fallback()
        }, 2000)
      }

      tryOpen(vlcUrl, () => window.open(streamUrl, '_blank'))
      this.showToast(`Opening in VLC or video player...`, 'info')
    } else {
      // Desktop: Just open in new tab
      // Browser will either play it or trigger download based on user settings
      window.open(streamUrl, '_blank')
      this.showToast(`Opening: ${title}`, 'info')
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast-notification')
    if (existingToast) existingToast.remove()

    const toast = document.createElement('div')
    toast.className = `toast-notification toast-${type}`
    toast.innerHTML = `
      <span class="toast-icon">${type === 'info' ? 'ℹ️' : type === 'success' ? '✅' : '⚠️'}</span>
      <span class="toast-message">${message}</span>
    `
    document.body.appendChild(toast)

    // Auto-remove after 3s
    setTimeout(() => toast.remove(), 3000)
  }

  // ============================================
  // CONTENT HEALTH & REPORTING (Elite Tier)
  // ============================================

  /**
   * Show report dialog for current content
   */
  showReportDialog() {
    const contentId = this.currentStreamId
    const contentType = this.currentStreamType || 'movie'
    const contentName = this.currentChannelName || 'Unknown Content'

    const issueTypes = [
      { value: 'not_playing', label: 'Not Playing', icon: '🚫' },
      { value: 'buffering', label: 'Constant Buffering', icon: '⏳' },
      { value: 'offline', label: 'Stream Offline', icon: '📴' },
      { value: 'audio_issue', label: 'Audio Problem', icon: '🔇' },
      { value: 'wrong_content', label: 'Wrong Content', icon: '❓' },
      { value: 'low_quality', label: 'Low Quality', icon: '📉' },
      { value: 'other', label: 'Other Issue', icon: '🔧' }
    ]

    const dialogHTML = `
      <div class="report-dialog-overlay" onclick="dashApp.closeReportDialog(event)">
        <div class="report-dialog" onclick="event.stopPropagation()">
          <div class="report-dialog-header">
            <h3>🚩 Report an Issue</h3>
            <button class="report-dialog-close" onclick="dashApp.closeReportDialog()">&times;</button>
          </div>
          <div class="report-dialog-content">
            <p class="report-dialog-info">Help us improve by reporting issues with:</p>
            <p class="report-dialog-title">${contentName}</p>
            <div class="report-issue-types">
              ${issueTypes.map(t => `
                <button class="report-issue-btn" data-type="${t.value}" onclick="dashApp.selectIssueType('${t.value}')">
                  <span class="report-issue-icon">${t.icon}</span>
                  <span class="report-issue-label">${t.label}</span>
                </button>
              `).join('')}
            </div>
            <textarea id="reportDescription" class="report-description" placeholder="Additional details (optional)..."></textarea>
            <button class="report-submit-btn" onclick="dashApp.submitReport()">
              Submit Report
            </button>
          </div>
        </div>
      </div>
    `

    // Remove existing dialog
    const existing = document.querySelector('.report-dialog-overlay')
    if (existing) existing.remove()

    document.body.insertAdjacentHTML('beforeend', dialogHTML)
    this.selectedIssueType = null
  }

  /**
   * Select issue type in report dialog
   */
  selectIssueType(type) {
    this.selectedIssueType = type

    // Update button states
    document.querySelectorAll('.report-issue-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.type === type)
    })
  }

  /**
   * Submit the report
   */
  async submitReport() {
    if (!this.selectedIssueType) {
      this.showToast('Please select an issue type', 'error')
      return
    }

    const description = document.getElementById('reportDescription')?.value || ''
    const contentId = this.currentStreamId
    const contentType = this.currentStreamType || 'movie'
    const contentName = this.currentChannelName || 'Unknown Content'

    // Show loading state
    const submitBtn = document.querySelector('.report-submit-btn')
    if (submitBtn) {
      submitBtn.disabled = true
      submitBtn.textContent = 'Submitting...'
    }

    const result = await this.client.reportStream(
      contentId,
      contentType,
      contentName,
      this.selectedIssueType,
      description
    )

    if (result.success) {
      this.showToast('Report submitted! Thank you for helping improve DASH.', 'success')
      this.closeReportDialog()
    } else {
      this.showToast('Failed to submit report. Please try again.', 'error')
      if (submitBtn) {
        submitBtn.disabled = false
        submitBtn.textContent = 'Submit Report'
      }
    }
  }

  /**
   * Close report dialog
   */
  closeReportDialog(event) {
    if (event && event.target !== event.currentTarget) return
    const dialog = document.querySelector('.report-dialog-overlay')
    if (dialog) dialog.remove()
  }

  /**
   * Load offline content status for UI indicators
   */
  async loadOfflineStatus() {
    this.offlineData = await this.client.getOfflineContent()
    console.log(`📊 Loaded offline status: ${this.offlineData.offline?.length || 0} offline, ${this.offlineData.degraded?.length || 0} degraded`)
  }

  /**
   * Check if content should show health warning
   */
  getContentHealthClass(contentId, contentType) {
    if (!this.offlineData) return ''

    if (this.client.isContentOffline(contentId, contentType, this.offlineData)) {
      return 'content-offline'
    }
    if (this.client.isContentDegraded(contentId, contentType, this.offlineData)) {
      return 'content-degraded'
    }
    return ''
  }

  // ============================================
  // ENHANCED ACTIVITY-BASED RECOMMENDATIONS
  // ============================================

  /**
   * Get user's language preferences based on watch history
   */
  getLanguagePreferences() {
    const history = this.loadWatchHistory()
    if (history.length === 0) return {}

    const langCounts = {}

    history.forEach(item => {
      const content = item.type === 'movie'
        ? (this.localMovies || []).find(m => String(m.stream_id) === String(item.id))
        : (this.localSeries || []).find(s => String(s.series_id) === String(item.id))

      if (content?.category_name) {
        // Extract language from category name
        const cat = content.category_name.toUpperCase()

        // Common language patterns
        const languages = ['ENGLISH', 'HINDI', 'TAMIL', 'TELUGU', 'FRENCH', 'ARABIC', 'TURKISH', 'KOREAN', 'SPANISH', 'GERMAN', 'ITALIAN', 'PORTUGUESE', 'JAPANESE', 'CHINESE', 'RUSSIAN', 'THAI', 'VIETNAMESE', 'INDONESIAN', 'MALAY', 'FILIPINO', 'BENGALI', 'PUNJABI', 'GUJARATI', 'MARATHI', 'KANNADA', 'MALAYALAM', 'URDU']

        for (const lang of languages) {
          if (cat.includes(lang)) {
            langCounts[lang] = (langCounts[lang] || 0) + 1
            break
          }
        }
      }
    })

    // Sort by count and return top 3
    return Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .reduce((acc, [lang, count]) => {
        acc[lang] = count
        return acc
      }, {})
  }

  /**
   * Get "Popular in Your Language" recommendations
   */
  getLanguageBasedRecommendations() {
    const langPrefs = this.getLanguagePreferences()
    const topLang = Object.keys(langPrefs)[0]

    if (!topLang) return []

    const history = this.loadWatchHistory()
    const watchedIds = new Set(history.map(h => String(h.id)))

    return (this.localMovies || [])
      .filter(m => {
        const cat = (m.category_name || '').toUpperCase()
        return cat.includes(topLang) &&
               !watchedIds.has(String(m.stream_id)) &&
               m.stream_icon &&
               parseFloat(m.rating) >= 5
      })
      .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
      .slice(0, 20)
  }

  /**
   * Render "Popular in [Language]" row
   */
  renderLanguageRow() {
    const langPrefs = this.getLanguagePreferences()
    const topLang = Object.keys(langPrefs)[0]

    if (!topLang) return ''

    const recommendations = this.getLanguageBasedRecommendations()
    if (recommendations.length < 5) return ''

    // Format language name nicely
    const langDisplay = topLang.charAt(0) + topLang.slice(1).toLowerCase()

    return `
      <div class="collection-row language-row">
        <div class="collection-header">
          <h2 class="collection-title">
            <svg class="collection-title-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
            </svg>
            Popular in ${langDisplay}
          </h2>
        </div>
        <div class="collection-carousel" data-collection="language_${topLang.toLowerCase()}">
          <button class="carousel-btn carousel-btn-left" onclick="dashApp.scrollCarousel('language_${topLang.toLowerCase()}', -1)">‹</button>
          <div class="carousel-track">
            ${recommendations.map(movie => this.renderMovieCard(movie)).join('')}
          </div>
          <button class="carousel-btn carousel-btn-right" onclick="dashApp.scrollCarousel('language_${topLang.toLowerCase()}', 1)">›</button>
        </div>
      </div>
    `
  }

  /**
   * Get trending content (most recently watched by users)
   * For now, uses recently added content with high ratings
   */
  getTrendingContent() {
    const currentYear = new Date().getFullYear()

    return (this.localMovies || [])
      .filter(m =>
        m.stream_icon &&
        parseInt(m.year) >= currentYear - 1 &&
        parseFloat(m.rating) >= 6
      )
      .sort((a, b) => {
        // Sort by year (newest first) then rating
        const yearDiff = (parseInt(b.year) || 0) - (parseInt(a.year) || 0)
        if (yearDiff !== 0) return yearDiff
        return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0)
      })
      .slice(0, 20)
  }

  /**
   * Render "Trending Now" row
   */
  renderTrendingRow() {
    const trending = this.getTrendingContent()
    if (trending.length < 5) return ''

    return `
      <div class="collection-row trending-row">
        <div class="collection-header">
          <h2 class="collection-title">
            <svg class="collection-title-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
            </svg>
            Trending Now
          </h2>
        </div>
        <div class="collection-carousel" data-collection="trending">
          <button class="carousel-btn carousel-btn-left" onclick="dashApp.scrollCarousel('trending', -1)">‹</button>
          <div class="carousel-track">
            ${trending.map(movie => this.renderMovieCard(movie)).join('')}
          </div>
          <button class="carousel-btn carousel-btn-right" onclick="dashApp.scrollCarousel('trending', 1)">›</button>
        </div>
      </div>
    `
  }

  // ============================================
  // DOWNLOAD LIBRARY SYSTEM
  // ============================================

  /**
   * Load download library from localStorage
   */
  loadDownloadLibrary() {
    const saved = localStorage.getItem('dash_download_library')
    return saved ? JSON.parse(saved) : { series: {}, movies: {} }
  }

  /**
   * Save download library to localStorage
   */
  saveDownloadLibrary(library) {
    localStorage.setItem('dash_download_library', JSON.stringify(library))
  }

  /**
   * Add episode to download library
   * Also fetches ALL episodes of the series for the complete library view
   */
  async addToDownloadLibrary(seriesId, episodeId, episodeTitle, format, action = 'downloaded') {
    const library = this.loadDownloadLibrary()

    // Get series info
    const seriesInfo = this.localSeries?.find(s => String(s.series_id) === String(seriesId))

    // If series not in library yet, fetch all episodes
    if (!library.series[seriesId]) {
      library.series[seriesId] = {
        id: seriesId,
        title: seriesInfo?.name || 'Unknown Series',
        thumbnail: seriesInfo?.cover || seriesInfo?.stream_icon || '',
        episodes: {},
        allEpisodes: [], // Store ALL episodes for full view
        addedAt: new Date().toISOString()
      }

      // Fetch all episodes from API
      try {
        const details = await this.client.getSeriesInfo(seriesId)
        if (details?.episodes) {
          const allEps = []
          Object.keys(details.episodes).forEach(seasonNum => {
            details.episodes[seasonNum].forEach(ep => {
              allEps.push({
                id: ep.id,
                title: ep.title || `Episode ${ep.episode_num}`,
                season: seasonNum,
                episode_num: ep.episode_num,
                format: (ep.container_extension || 'mp4').toLowerCase(),
                type: (ep.container_extension || 'mp4').toLowerCase() === 'mkv' ? 'offline-exclusive' : 'stream-first',
                duration: ep.duration || ''
              })
            })
          })
          library.series[seriesId].allEpisodes = allEps
          console.log(`📚 Loaded ${allEps.length} episodes for ${seriesInfo?.name}`)
        }
      } catch (err) {
        console.log('Could not fetch all episodes:', err)
      }
    }

    // Mark this specific episode as downloaded/watched
    library.series[seriesId].episodes[episodeId] = {
      id: episodeId,
      title: episodeTitle,
      format: format,
      type: format === 'mkv' ? 'offline-exclusive' : 'stream-first',
      action: action, // 'watched' or 'downloaded'
      addedAt: new Date().toISOString()
    }

    this.saveDownloadLibrary(library)
    console.log(`📥 Added to library: ${episodeTitle}`)

    // Show toast
    this.showToast(`✨ Added to your Downloads library!`, 'success')

    return library
  }

  /**
   * Watch in external player (OFFLINE EXCLUSIVE)
   * Opens stream in VLC, MX Player, etc.
   */
  async watchInPlayer(episodeId, extension, title, seriesId) {
    console.log(`▶️ Watch in Player: ${title} (${extension})`)

    // Use DIRECT URL for external players - they can handle MKV natively
    const streamUrl = this.client.buildDirectSeriesUrl(episodeId, extension)
    const isAndroid = /Android/i.test(navigator.userAgent)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

    // Add to download library as "watched"
    await this.addToDownloadLibrary(seriesId, episodeId, title, extension, 'watched')

    if (isAndroid) {
      // Android intent for video players
      const intentUrl = `intent:${streamUrl}#Intent;type=video/*;end`
      try {
        window.location.href = intentUrl
      } catch (e) {
        window.open(streamUrl, '_blank')
      }
      this.showToast(`Opening in video player...`, 'success')
    } else if (isIOS) {
      // iOS VLC URL scheme
      const vlcUrl = `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(streamUrl)}`
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = vlcUrl
      document.body.appendChild(iframe)
      setTimeout(() => {
        document.body.removeChild(iframe)
        window.open(streamUrl, '_blank')
      }, 2000)
      this.showToast(`Opening in VLC...`, 'success')
    } else {
      // Desktop - open in default player
      window.open(streamUrl, '_blank')
      this.showToast(`Opening: ${title}`, 'success')
    }
  }

  /**
   * Download to device (OFFLINE EXCLUSIVE)
   * Triggers actual file download
   */
  async downloadToDevice(episodeId, extension, title, seriesId) {
    console.log(`⬇️ Download to device: ${title} (${extension})`)

    // Use DIRECT URL for downloads - not transcoded
    // Downloads need the original file, FFmpeg streaming is for browser playback only
    const streamUrl = this.client.buildDirectSeriesUrl(episodeId, extension)

    // Add to download library
    await this.addToDownloadLibrary(seriesId, episodeId, title, extension, 'downloaded')

    // Create download link
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_')
    const filename = `${sanitizedTitle}.${extension}`

    // For mobile, we use different approaches
    const isAndroid = /Android/i.test(navigator.userAgent)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

    if (isAndroid) {
      // Android: Use download attribute or intent
      const a = document.createElement('a')
      a.href = streamUrl
      a.download = filename
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      this.showToast(`⬇️ Downloading: ${title}`, 'success')
    } else if (isIOS) {
      // iOS: Open in new tab (Safari will prompt to save)
      window.open(streamUrl, '_blank')
      this.showToast(`Tap "Download" in Safari menu`, 'info')
    } else {
      // Desktop: Force download
      const a = document.createElement('a')
      a.href = streamUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      this.showToast(`⬇️ Downloading: ${title}`, 'success')
    }
  }

  /**
   * Download Stream First content (LIMITED)
   * TODO: Implement daily limit tracking
   */
  async downloadStreamFirst(episodeId, extension, title, seriesId) {
    console.log(`⬇️ Stream First download: ${title}`)

    // For now, allow download (future: add limit)
    await this.addToDownloadLibrary(seriesId, episodeId, title, extension, 'downloaded')

    // Use DIRECT URL for downloads - not transcoded
    const streamUrl = this.client.buildDirectSeriesUrl(episodeId, extension)
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_')
    const filename = `${sanitizedTitle}.${extension}`

    const a = document.createElement('a')
    a.href = streamUrl
    a.download = filename
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    this.showToast(`⬇️ Downloading: ${title}`, 'success')
  }

  /**
   * Render Downloads page
   * Shows ALL episodes of series in library, with download status
   */
  renderDownloadsPage() {
    const library = this.loadDownloadLibrary()
    const seriesKeys = Object.keys(library.series)

    let content = `
      <div class="downloads-page">
        <div class="downloads-header">
          <div class="downloads-title">
            <span class="icon">📥</span>
            <h1>My Downloads</h1>
          </div>
          <div class="downloads-stats">
            <div class="downloads-stat gold">
              <span>⬇️</span>
              <span>Offline Exclusive: Unlimited</span>
            </div>
          </div>
        </div>
    `

    if (seriesKeys.length === 0) {
      content += `
        <div class="downloads-empty">
          <div class="downloads-empty-icon">📥</div>
          <h2>No Downloads Yet</h2>
          <p>Your downloaded and watched content will appear here. Look for the golden "Offline Exclusive" badge on episodes!</p>
        </div>
      `
    } else {
      // Group by series - show ALL episodes
      seriesKeys.forEach(seriesId => {
        const series = library.series[seriesId]
        const downloadedEpisodes = series.episodes || {}
        const allEpisodes = series.allEpisodes || []

        // Count stats
        const downloadedCount = Object.keys(downloadedEpisodes).length
        const offlineExclusiveTotal = allEpisodes.filter(e => e.type === 'offline-exclusive').length
        const offlineExclusiveDownloaded = Object.values(downloadedEpisodes).filter(e => e.type === 'offline-exclusive').length

        content += `
          <div class="downloads-series">
            <div class="downloads-series-header">
              <img src="${this.fixImageUrl(series.thumbnail)}" alt="" class="downloads-series-poster" onerror="this.src='/assets/placeholder.svg'">
              <div class="downloads-series-info">
                <h3>${series.title}</h3>
                <div class="downloads-series-meta">
                  ${allEpisodes.length > 0 ? `${allEpisodes.length} episodes` : `${downloadedCount} in library`}
                  ${offlineExclusiveTotal > 0 ? ` • <span style="color:#ffd700">${offlineExclusiveDownloaded}/${offlineExclusiveTotal} Offline Exclusive</span>` : ''}
                </div>
              </div>
            </div>
            <div class="downloads-series-episodes">
        `

        // If we have allEpisodes, show them all with status
        if (allEpisodes.length > 0) {
          // Group by season
          const seasons = {}
          allEpisodes.forEach(ep => {
            if (!seasons[ep.season]) seasons[ep.season] = []
            seasons[ep.season].push(ep)
          })

          Object.keys(seasons).sort((a, b) => parseInt(a) - parseInt(b)).forEach(seasonNum => {
            content += `<div class="downloads-season-label">Season ${seasonNum}</div>`
            content += `<div class="downloads-season-episodes">`

            seasons[seasonNum].forEach(ep => {
              const isDownloaded = !!downloadedEpisodes[ep.id]
              const isOfflineExclusive = ep.type === 'offline-exclusive'

              // Determine chip style
              let chipClass = ''
              let chipStyle = ''

              if (isOfflineExclusive) {
                if (isDownloaded) {
                  // Downloaded Offline Exclusive - Full gold glory
                  chipClass = 'offline-exclusive downloaded'
                } else {
                  // Not downloaded Offline Exclusive - Transparent with gold dashed border
                  chipClass = 'offline-exclusive not-downloaded'
                }
              } else {
                // Stream First - always available
                chipClass = 'stream-first'
                if (isDownloaded) chipClass += ' downloaded'
              }

              const epLabel = `E${ep.episode_num}`

              content += `
                <div class="downloads-episode-chip ${chipClass}"
                     onclick="dashApp.playOrDownloadFromLibrary('${seriesId}', '${ep.id}', '${ep.format}', '${ep.title.replace(/'/g, "\\'")}', ${isDownloaded}, ${isOfflineExclusive})"
                     title="${ep.title}${isDownloaded ? ' ✓ Downloaded' : isOfflineExclusive ? ' - Tap to download' : ''}">
                  ${epLabel}
                  ${isDownloaded ? '<span class="chip-check">✓</span>' : ''}
                </div>
              `
            })

            content += `</div>`
          })
        } else {
          // Fallback: just show downloaded episodes
          Object.keys(downloadedEpisodes).forEach(epId => {
            const ep = downloadedEpisodes[epId]
            const chipClass = ep.type === 'offline-exclusive' ? 'offline-exclusive downloaded' : 'stream-first downloaded'
            content += `
              <div class="downloads-episode-chip ${chipClass}" onclick="dashApp.playFromLibrary('${seriesId}', '${epId}')">
                ${ep.title.includes('Episode') ? ep.title.replace('Episode ', 'E') : ep.title}
                <span class="chip-check">✓</span>
              </div>
            `
          })
        }

        content += `
            </div>
            <button class="download-all-btn" onclick="dashApp.downloadAllOfflineExclusive('${seriesId}')">
              ⬇️ Download All Offline Exclusive
            </button>
          </div>
        `
      })
    }

    content += '</div>'
    return content
  }

  /**
   * Play or download episode from library view
   */
  playOrDownloadFromLibrary(seriesId, episodeId, format, title, isDownloaded, isOfflineExclusive) {
    if (isOfflineExclusive) {
      if (isDownloaded) {
        // Already downloaded - watch in player
        this.watchInPlayer(episodeId, format, title, seriesId)
      } else {
        // Not downloaded - prompt to download
        this.downloadToDevice(episodeId, format, title, seriesId)
      }
    } else {
      // Stream First - just play
      this.playEpisode(episodeId, format)
    }
  }

  /**
   * Download all Offline Exclusive episodes for a series
   */
  async downloadAllOfflineExclusive(seriesId) {
    const library = this.loadDownloadLibrary()
    const series = library.series[seriesId]

    if (!series || !series.allEpisodes) {
      this.showToast('No episodes found', 'error')
      return
    }

    const offlineExclusive = series.allEpisodes.filter(ep => ep.type === 'offline-exclusive')
    const notDownloaded = offlineExclusive.filter(ep => !series.episodes[ep.id])

    if (notDownloaded.length === 0) {
      this.showToast('All Offline Exclusive episodes already downloaded!', 'success')
      return
    }

    this.showToast(`Starting ${notDownloaded.length} downloads...`, 'info')

    // Download with slight delay between each to not overwhelm
    for (let i = 0; i < notDownloaded.length; i++) {
      const ep = notDownloaded[i]
      setTimeout(() => {
        this.downloadToDevice(ep.id, ep.format, ep.title, seriesId)
      }, i * 1500) // 1.5s between each download
    }
  }

  /**
   * Play episode from download library
   */
  playFromLibrary(seriesId, episodeId) {
    const library = this.loadDownloadLibrary()
    const episode = library.series[seriesId]?.episodes[episodeId]

    if (!episode) {
      this.showToast('Episode not found', 'error')
      return
    }

    if (episode.type === 'offline-exclusive') {
      // Open in external player
      this.watchInPlayer(episodeId, episode.format, episode.title, seriesId)
    } else {
      // Stream in app
      this.playEpisode(episodeId, episode.format)
    }
  }

  showVideoPlayer(streamUrl, type = 'movie', streamType = null, channelName = null) {
    console.log('🎬 Playing stream:', streamUrl)

    // Store channel name for offline message
    this.currentChannelName = channelName

    // Detect stream type - streamType overrides URL detection for live
    let isMpegTS = false
    let isHLS = false
    let isSafariNativeHLS = false

    if (streamType === 'hls-native') {
      // Safari native HLS - direct video.src assignment
      isSafariNativeHLS = true
      console.log('🍎 Using Safari native HLS playback')
    } else if (streamType === 'mpegts') {
      isMpegTS = true
      console.log('📡 Using MPEG-TS with mpegts.js')
    } else {
      // Fallback to URL detection for movies/series
      isMpegTS = streamUrl.includes('.ts')
      isHLS = streamUrl.includes('.m3u8')
    }
    console.log('📹 Stream type:', isSafariNativeHLS ? 'Safari-HLS' : (isMpegTS ? 'MPEG-TS' : (isHLS ? 'HLS' : 'Direct')))

    // Clean up any existing player
    this.closeVideoPlayer()

    // Create player HTML with optional channel overlay
    const channelOverlay = channelName ? `
      <div class="channel-overlay">
        <div class="channel-name">${channelName}</div>
      </div>
    ` : ''

    // Build quality selector (only for transcoded content, not live TV)
    const currentQuality = this.client.getPreferredQuality()
    const qualities = this.client.getAvailableQualities()
    const qualityOptions = qualities.map(q =>
      `<option value="${q}" ${q === currentQuality ? 'selected' : ''}>${q}</option>`
    ).join('')

    // Only show quality selector for MKV/transcoded content (type === 'series' or 'movie' with MKV)
    const showQualitySelector = type !== 'live' && this.currentStreamNeedsTranscode
    const qualitySelector = showQualitySelector ? `
      <div class="quality-selector">
        <label>Quality:</label>
        <select id="qualitySelect" onchange="dashApp.changeQuality(this.value)">
          ${qualityOptions}
        </select>
      </div>
    ` : ''

    const playerHTML = `
      <div class="video-player-container">
        <button class="modal-close" onclick="dashApp.closeVideoPlayer()">×</button>
        ${channelOverlay}
        ${qualitySelector}
        <div class="player-report-btn" onclick="dashApp.showReportDialog()" title="Report an issue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
        </div>
        <div class="video-loading">
          <div class="spinner"></div>
          <div>Loading stream...</div>
        </div>
        <video id="dashPlayer" controls autoplay playsinline style="width:100%;height:100%;background:#000;"></video>
      </div>
    `
    this.elements.videoPlayerContainer.innerHTML = playerHTML

    const video = document.getElementById('dashPlayer')
    const loadingEl = this.elements.videoPlayerContainer.querySelector('.video-loading')

    // Hide loading when video starts playing
    video.addEventListener('playing', () => {
      if (loadingEl) loadingEl.style.display = 'none'
    })

    // Show loading on waiting/buffering
    video.addEventListener('waiting', () => {
      if (loadingEl) loadingEl.style.display = 'flex'
    })

    if (isSafariNativeHLS) {
      // Safari native HLS - simply set src, browser handles everything
      this.playSafariHLS(video, streamUrl, loadingEl)
    } else if (isMpegTS) {
      this.playMpegTS(video, streamUrl, loadingEl)
    } else if (isHLS) {
      this.playHLS(video, streamUrl, loadingEl)
    } else {
      this.playDirect(video, streamUrl, loadingEl)
    }
  }

  /**
   * Safari Native HLS Playback
   * Safari has built-in HLS support - no JavaScript library needed!
   * Direct video.src assignment bypasses CORS entirely
   */
  playSafariHLS(video, streamUrl, loadingEl) {
    console.log('🍎 Safari native HLS playback:', streamUrl)

    video.src = streamUrl

    video.addEventListener('loadedmetadata', () => {
      console.log('✅ Safari HLS metadata loaded')
      video.play().catch(err => console.warn('Autoplay blocked:', err))
    })

    video.addEventListener('error', (e) => {
      console.error('❌ Safari HLS error:', video.error)
      if (loadingEl) loadingEl.innerHTML = '<div>Stream error. Try another channel.</div>'
    })

    // Show stream info
    video.addEventListener('playing', () => {
      console.log('🍎 Safari HLS playing successfully - NO PROXY NEEDED!')
    })
  }

  playMpegTS(video, streamUrl, loadingEl) {
    console.log('📡 Using mpegts.js for MPEG-TS stream:', streamUrl)

    // ============================================
    // PERFORMANCE METRICS
    // ============================================
    const metrics = {
      startTime: performance.now(),
      firstByteTime: null,
      firstFrameTime: null,
      bufferEvents: 0,
      bytesReceived: 0,
      lastBufferStart: null
    }

    // Check if mpegts.js is available and supported
    if (typeof mpegts !== 'undefined' && mpegts.getFeatureList().mseLivePlayback) {
      console.log('✅ mpegts.js supported - using it')

      // ============================================
      // PERFECTION MODE - MPEGTS.JS CONFIGURATION
      // Every setting pushed to theoretical limits
      // ============================================
      this.mpegtsPlayer = mpegts.createPlayer({
        type: 'mse',        // MediaSource Extensions mode
        isLive: true,       // Critical: enables live-specific optimizations
        url: streamUrl,
        hasVideo: true,
        hasAudio: true,
      }, {
        // ============================================
        // WORKER THREADS - Maximum CPU efficiency
        // ============================================
        enableWorker: true,           // Transmuxing in dedicated thread
        workerForMSE: true,           // MSE operations in worker too

        // ============================================
        // IO BUFFER - The key to smooth streaming
        // Larger = more resilient to network jitter
        // Too large = memory waste + latency
        // ============================================
        enableStashBuffer: true,
        stashInitialSize: 2 * 1024 * 1024,   // 2MB - optimal for HD streams

        // ============================================
        // SOURCE BUFFER MANAGEMENT
        // Keep enough for rewind, clean old data
        // ============================================
        autoCleanupSourceBuffer: true,
        autoCleanupMaxBackwardDuration: 120,  // Keep 2min for rewind
        autoCleanupMinBackwardDuration: 60,   // Start cleanup at 1min

        // ============================================
        // CRITICAL: CONTINUOUS DATA FLOW
        // lazyLoad = false means NEVER abort connection
        // This is THE key for live streaming
        // ============================================
        lazyLoad: false,
        deferLoadAfterSourceOpen: false,      // Start loading immediately

        // ============================================
        // LATENCY CHASING - Only for emergencies
        // We want smooth playback, not low latency
        // ============================================
        liveBufferLatencyChasing: true,
        liveBufferLatencyChasingOnPaused: false,  // Don't chase when paused
        liveBufferLatencyMaxLatency: 60.0,        // Allow 1 minute behind!
        liveBufferLatencyMinRemain: 0.3,          // Chase only when < 0.3s

        // ============================================
        // LIVE SYNC - Gentle catch-up
        // Only kicks in when really far behind
        // ============================================
        liveSync: true,
        liveSyncMaxLatency: 90.0,          // Only sync if >90s behind
        liveSyncTargetLatency: 15.0,       // Target 15s delay (very smooth)
        liveSyncPlaybackRate: 1.01,        // 1% speedup (imperceptible)

        // ============================================
        // AUDIO/VIDEO SYNC
        // ============================================
        fixAudioTimestampGap: true,        // Fill gaps to prevent desync
        accurateSeek: false,               // Faster seeking (keyframe only)

        // ============================================
        // HTTP SETTINGS
        // ============================================
        seekType: 'range',                 // Use Range requests
        reuseRedirectedURL: true,          // Cache redirects
        referrerPolicy: 'no-referrer',     // Privacy
      })

      this.mpegtsPlayer.attachMediaElement(video)
      this.mpegtsPlayer.load()

      // ============================================
      // PERFECTION BUFFERING STRATEGY
      // Build massive buffer upfront, aggressive rebuffer on stalls
      // Philosophy: One long wait > many short stutters
      // ============================================
      let hasStartedPlaying = false
      let isRebuffering = false
      const MIN_BUFFER_SECONDS = 15   // Wait for 15s before playing (was 10)
      const REBUFFER_THRESHOLD = 1    // Rebuffer when < 1s (more aggressive)
      const REBUFFER_TARGET = 8       // Rebuild to 8s (was 6)

      const checkBufferAndPlay = () => {
        if (hasStartedPlaying) return

        const buffered = video.buffered
        if (buffered.length > 0) {
          const bufferedEnd = buffered.end(buffered.length - 1)
          const currentTime = video.currentTime
          const bufferAhead = bufferedEnd - currentTime

          // Update loading message with buffer status
          if (loadingEl) {
            loadingEl.innerHTML = `<div class="spinner"></div><div>Buffering... ${bufferAhead.toFixed(1)}s</div>`
          }

          console.log(`📊 Buffer: ${bufferAhead.toFixed(1)}s ahead (need ${MIN_BUFFER_SECONDS}s)`)

          // Start playing once we have enough buffer
          if (bufferAhead >= MIN_BUFFER_SECONDS) {
            hasStartedPlaying = true
            console.log(`✅ Buffer ready (${bufferAhead.toFixed(1)}s) - starting playback!`)
            video.play().catch(err => {
              console.warn('⚠️ Autoplay blocked:', err.message)
              if (loadingEl) loadingEl.innerHTML = '<div>Click video to play</div>'
            })
          }
        }
      }

      // Check buffer every 500ms
      const bufferCheckInterval = setInterval(checkBufferAndPlay, 500)

      // Also check on progress events
      video.addEventListener('progress', checkBufferAndPlay)

      // STREAM TIMEOUT - If no data after 20s, stream is dead
      const channelDisplayName = this.currentChannelName || 'This channel'
      const streamTimeout = setTimeout(() => {
        if (!hasStartedPlaying) {
          console.error('❌ Stream timeout - no data received in 20s')
          if (loadingEl) {
            loadingEl.innerHTML = `
              <div class="offline-message">
                <div class="offline-icon">📡</div>
                <div class="offline-text">Sorry, "${channelDisplayName}" is not live.</div>
                <div class="offline-subtext">Try again later</div>
              </div>
            `
          }
          clearInterval(bufferCheckInterval)
        }
      }, 20000)

      // Clear interval when playing or on error
      video.addEventListener('playing', () => {
        clearInterval(bufferCheckInterval)
        clearTimeout(streamTimeout)
        if (loadingEl) loadingEl.style.display = 'none'
      }, { once: true })

      // METRIC: First byte received
      this.mpegtsPlayer.on(mpegts.Events.LOADING_COMPLETE, () => {
        if (!metrics.firstByteTime) {
          metrics.firstByteTime = performance.now()
          console.log(`📊 METRIC: First byte in ${(metrics.firstByteTime - metrics.startTime).toFixed(0)}ms`)
        }
        // Don't auto-play here - let buffer check handle it
      })

      // METRIC: Track statistics + ADAPTIVE NETWORK MONITORING
      let networkSpeedSamples = []
      const MAX_SAMPLES = 10  // Rolling average of last 10 samples

      this.mpegtsPlayer.on(mpegts.Events.STATISTICS_INFO, (stats) => {
        metrics.bytesReceived = stats.totalBytes || 0
        const speedKbps = stats.speed ? stats.speed / 1024 : 0

        // Track rolling average of network speed
        if (speedKbps > 0) {
          networkSpeedSamples.push(speedKbps)
          if (networkSpeedSamples.length > MAX_SAMPLES) {
            networkSpeedSamples.shift()
          }

          const avgSpeed = networkSpeedSamples.reduce((a, b) => a + b, 0) / networkSpeedSamples.length
          metrics.avgSpeedKbps = avgSpeed

          // Debug: Log speed warnings
          if (avgSpeed < 500 && networkSpeedSamples.length >= 5) {
            console.warn(`⚠️ Low network speed: ${avgSpeed.toFixed(0)} KB/s - expect buffering`)
          }
        }

        // Debug mode logging
        if (window.DASH_DEBUG) {
          console.log(`📊 Speed: ${speedKbps.toFixed(0)} KB/s | Avg: ${(metrics.avgSpeedKbps || 0).toFixed(0)} KB/s`)
        }
      })

      this.mpegtsPlayer.on(mpegts.Events.ERROR, (errorType, errorDetail, errorInfo) => {
        console.error('❌ MPEG-TS Error:', errorType, errorDetail, errorInfo)

        // Auto-retry with fallback proxy if available
        if (!this._proxyRetried && this.currentLiveStreamId) {
          this._proxyRetried = true
          console.log('🔄 Retrying with fallback proxy...')
          if (loadingEl) loadingEl.innerHTML = '<div>Switching proxy... Please wait</div>'

          // Get fallback URL from client
          const fallback = this.client.buildFallbackLiveStreamUrl(this.currentLiveStreamId)
          if (fallback) {
            setTimeout(() => {
              this.closeVideoPlayer()
              this.showVideoPlayer(fallback.url, 'live', 'mpegts')
            }, 1000)
            return
          }
        }

        if (loadingEl) loadingEl.innerHTML = '<div>Stream error. Try another channel.</div>'
      })

      // METRIC: First frame rendered
      video.addEventListener('playing', () => {
        if (!metrics.firstFrameTime) {
          metrics.firstFrameTime = performance.now()
          const ttff = (metrics.firstFrameTime - metrics.startTime).toFixed(0)
          console.log(`📊 METRIC: First frame in ${ttff}ms`)
          console.log(`📊 METRIC: Time to first byte: ${(metrics.firstByteTime - metrics.startTime).toFixed(0)}ms`)
          console.log(`📊 METRIC: Decode time: ${(metrics.firstFrameTime - metrics.firstByteTime).toFixed(0)}ms`)
        }
      }, { once: true })

      // ============================================
      // SMART REBUFFERING: Pause and rebuild buffer on stalls
      // Instead of choppy play/pause, we pause once and rebuild
      // ============================================
      video.addEventListener('waiting', () => {
        metrics.bufferEvents++
        metrics.lastBufferStart = performance.now()
        console.log(`📊 Buffer stall #${metrics.bufferEvents}`)

        // Check current buffer level
        const buffered = video.buffered
        if (buffered.length > 0) {
          const bufferAhead = buffered.end(buffered.length - 1) - video.currentTime
          console.log(`📊 Buffer at stall: ${bufferAhead.toFixed(1)}s`)

          // If buffer is critically low, enter rebuffer mode
          if (bufferAhead < REBUFFER_THRESHOLD && !isRebuffering) {
            isRebuffering = true
            video.pause()
            console.log(`🔄 Entering rebuffer mode (need ${REBUFFER_TARGET}s)`)
            if (loadingEl) {
              loadingEl.style.display = 'flex'
              loadingEl.innerHTML = `<div class="spinner"></div><div>Rebuffering... ${bufferAhead.toFixed(1)}s</div>`
            }

            // Check buffer until we have enough
            const rebufferCheck = setInterval(() => {
              const nowBuffered = video.buffered
              if (nowBuffered.length > 0) {
                const nowAhead = nowBuffered.end(nowBuffered.length - 1) - video.currentTime
                if (loadingEl) {
                  loadingEl.innerHTML = `<div class="spinner"></div><div>Rebuffering... ${nowAhead.toFixed(1)}s</div>`
                }
                console.log(`📊 Rebuffering: ${nowAhead.toFixed(1)}s / ${REBUFFER_TARGET}s`)

                if (nowAhead >= REBUFFER_TARGET) {
                  clearInterval(rebufferCheck)
                  isRebuffering = false
                  if (loadingEl) loadingEl.style.display = 'none'
                  console.log(`✅ Rebuffer complete - resuming playback`)
                  video.play().catch(() => {})
                }
              }
            }, 500)
          }
        }
      })

      video.addEventListener('playing', () => {
        if (metrics.lastBufferStart) {
          const stallDuration = (performance.now() - metrics.lastBufferStart).toFixed(0)
          console.log(`📊 Stall duration: ${stallDuration}ms`)
          metrics.lastBufferStart = null
        }
      })

      // Store metrics for external access
      this.currentMetrics = metrics

      // Playback is now handled by checkBufferAndPlay() above
      // We wait for 5 seconds of buffer before starting

    } else {
      console.error('❌ mpegts.js not supported in this browser')
      if (loadingEl) loadingEl.innerHTML = '<div>Live TV not supported in this browser</div>'
    }
  }

  playHLS(video, streamUrl, loadingEl) {
    console.log('🔴 Using HLS.js for:', streamUrl)

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
        startLevel: -1, // Auto quality
        xhrSetup: (xhr, url) => {
          xhr.withCredentials = false
        }
      })

      this.hlsInstance.loadSource(streamUrl)
      this.hlsInstance.attachMedia(video)

      this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ HLS manifest loaded, starting playback')
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
              console.log('🔄 Network error, trying to recover...')
              this.hlsInstance.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('🔄 Media error, trying to recover...')
              this.hlsInstance.recoverMediaError()
              break
            default:
              console.error('❌ Fatal error, cannot recover')
              this.hlsInstance.destroy()
              if (loadingEl) loadingEl.innerHTML = '<div>Stream unavailable. Try another title.</div>'
              break
          }
        }
      })

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari has native HLS support
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

  playDirect(video, streamUrl, loadingEl) {
    console.log('📺 Using direct playback for:', streamUrl)

    video.src = streamUrl

    video.addEventListener('loadedmetadata', () => {
      console.log('✅ Video metadata loaded')
      video.play().catch(err => {
        console.warn('⚠️ Autoplay blocked:', err.message)
        if (loadingEl) loadingEl.innerHTML = '<div>Click to play</div>'
      })
    })

    video.addEventListener('error', (e) => {
      console.error('❌ Video error:', video.error)
      if (loadingEl) loadingEl.innerHTML = '<div>Unable to play. Try another title.</div>'
    })
  }

  closeVideoPlayer() {
    // Destroy mpegts instance if exists
    if (this.mpegtsPlayer) {
      try {
        this.mpegtsPlayer.pause()
        this.mpegtsPlayer.unload()
        this.mpegtsPlayer.detachMediaElement()
        this.mpegtsPlayer.destroy()
        this.mpegtsPlayer = null
      } catch (e) {
        console.warn('MPEG-TS cleanup warning:', e)
      }
    }

    // Destroy HLS instance if exists
    if (this.hlsInstance) {
      try {
        this.hlsInstance.destroy()
        this.hlsInstance = null
      } catch (e) {
        console.warn('HLS cleanup warning:', e)
      }
    }

    // Destroy Video.js instance if exists
    if (this.currentPlayer) {
      try {
        this.currentPlayer.dispose()
        this.currentPlayer = null
      } catch (e) {
        console.warn('Video.js cleanup warning:', e)
      }
    }

    // Clear container
    this.elements.videoPlayerContainer.innerHTML = ''

    // Reset stream info
    this.currentStreamNeedsTranscode = false
    this.currentStreamId = null
    this.currentStreamExtension = null
    this.currentStreamType = null
  }

  /**
   * Change video quality on-the-fly
   * Saves preference and reloads stream with new quality
   */
  changeQuality(quality) {
    console.log(`🎚️ Changing quality to: ${quality}`)

    // Save preference
    this.client.setPreferredQuality(quality)

    // Only reload if we have current stream info and it needs transcoding
    if (!this.currentStreamId || !this.currentStreamNeedsTranscode) {
      console.log('📺 Quality saved for next stream (current stream is direct)')
      return
    }

    // Get current video position
    const video = document.getElementById('dashPlayer')
    const currentTime = video ? video.currentTime : 0
    const wasPlaying = video ? !video.paused : false

    console.log(`📺 Reloading stream at ${quality} (position: ${currentTime.toFixed(1)}s)`)

    // Build new URL with selected quality
    let newUrl
    if (this.currentStreamType === 'series') {
      newUrl = this.client.buildSeriesUrl(this.currentStreamId, this.currentStreamExtension, quality)
    } else if (this.currentStreamType === 'movie') {
      newUrl = this.client.buildVODUrl(this.currentStreamId, this.currentStreamExtension, quality)
    }

    if (newUrl && video) {
      // Show loading
      const loadingEl = this.elements.videoPlayerContainer.querySelector('.video-loading')
      if (loadingEl) loadingEl.style.display = 'flex'

      // Update video source
      video.src = newUrl

      // Seek to previous position when ready
      video.addEventListener('loadedmetadata', () => {
        if (currentTime > 0) {
          video.currentTime = currentTime
        }
        if (wasPlaying) {
          video.play().catch(e => console.warn('Autoplay blocked:', e))
        }
        if (loadingEl) loadingEl.style.display = 'none'
      }, { once: true })

      video.load()
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  async filterByCategory(categoryId, type) {
    this.state.selectedCategory = categoryId
    this.renderPage(this.state.currentPage)
  }

  /**
   * Quick search by genre - fills search box and triggers search
   */
  quickSearch(genre) {
    this.state.searchQuery = genre
    if (this.elements.searchInput) {
      this.elements.searchInput.value = genre
    }
    this.renderPage('search')
  }

  handleSearch() {
    const query = this.state.searchQuery.trim().toLowerCase()

    // Debounce - wait for user to stop typing
    clearTimeout(this.searchTimeout)

    if (query.length < 2) {
      // Too short - don't search
      return
    }

    this.searchTimeout = setTimeout(() => {
      console.log('🔍 Searching for:', query)
      this.state.currentPage = 'search'
      this.renderPage('search')
    }, 300)
  }

  renderSearchResults() {
    const query = this.state.searchQuery.trim().toLowerCase()

    if (query.length < 2) {
      return `
        <div class="fade-in search-page">
          <div class="browse-header">
            <div class="browse-title-row">
              <div class="browse-icon">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <h1 class="browse-title">Search</h1>
            </div>
          </div>

          <!-- Quick Genre Filters -->
          <div class="search-quick-filters">
            <h3>Browse by Genre</h3>
            <div class="genre-buttons">
              <button class="genre-btn" onclick="dashApp.quickSearch('action')">💥 Action</button>
              <button class="genre-btn" onclick="dashApp.quickSearch('comedy')">😂 Comedy</button>
              <button class="genre-btn" onclick="dashApp.quickSearch('horror')">👻 Horror</button>
              <button class="genre-btn" onclick="dashApp.quickSearch('romance')">💕 Romance</button>
              <button class="genre-btn" onclick="dashApp.quickSearch('drama')">🎭 Drama</button>
              <button class="genre-btn" onclick="dashApp.quickSearch('sci-fi')">🚀 Sci-Fi</button>
              <button class="genre-btn" onclick="dashApp.quickSearch('thriller')">🔪 Thriller</button>
              <button class="genre-btn" onclick="dashApp.quickSearch('animation')">🎨 Animation</button>
            </div>
          </div>

          <!-- Quick Collection Links -->
          <div class="search-quick-filters">
            <h3>Popular Collections</h3>
            <div class="genre-buttons">
              <button class="genre-btn featured" onclick="dashApp.showCollection('african_stories')">🌍 African Stories</button>
              <button class="genre-btn" onclick="dashApp.showCollection('marvel')">🦸 Marvel</button>
              <button class="genre-btn" onclick="dashApp.showCollection('kdrama')">🇰🇷 K-Drama</button>
              <button class="genre-btn" onclick="dashApp.showCollection('kids_family')">👨‍👩‍👧‍👦 Kids</button>
              <button class="genre-btn" onclick="dashApp.showCollection('netflix')">🎬 Netflix</button>
              <button class="genre-btn" onclick="dashApp.showCollection('bollywood')">🎭 Bollywood</button>
            </div>
          </div>

          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-title">Start typing to search</div>
            <div class="empty-state-description">Search across 74,000+ movies, series, and channels</div>
          </div>
        </div>
      `
    }

    // Search movies (name, plot, cast, genre)
    const movieResults = (this.localMovies || [])
      .filter(m => {
        const name = (m.name || '').toLowerCase()
        const plot = (m.plot || '').toLowerCase()
        const cast = (m.cast || '').toLowerCase()
        const genre = (m.genre || '').toLowerCase()
        return name.includes(query) || plot.includes(query) || cast.includes(query) || genre.includes(query)
      })
      .sort((a, b) => {
        // Prioritize name matches over plot/cast matches
        const aNameMatch = (a.name || '').toLowerCase().includes(query)
        const bNameMatch = (b.name || '').toLowerCase().includes(query)
        if (aNameMatch && !bNameMatch) return -1
        if (!aNameMatch && bNameMatch) return 1
        // Secondary sort: priority score (images, ratings, English first)
        return this.scoreContent(b) - this.scoreContent(a)
      })
      .slice(0, 30)

    // Search series (use grouped series for cleaner results)
    const seriesResults = (this.groupedSeries || this.localSeries || [])
      .filter(s => {
        const name = (s.name || '').toLowerCase()
        const plot = (s.plot || '').toLowerCase()
        const cast = (s.cast || '').toLowerCase()
        return name.includes(query) || plot.includes(query) || cast.includes(query)
      })
      .sort((a, b) => {
        const aNameMatch = (a.name || '').toLowerCase().includes(query)
        const bNameMatch = (b.name || '').toLowerCase().includes(query)
        if (aNameMatch && !bNameMatch) return -1
        if (!aNameMatch && bNameMatch) return 1
        return 0
      })
      .slice(0, 20)

    // Search live channels
    const liveResults = (this.localLive || [])
      .filter(c => (c.name || '').toLowerCase().includes(query))
      .slice(0, 20)

    const totalResults = movieResults.length + seriesResults.length + liveResults.length

    return `
      <div class="fade-in">
        <div class="browse-header">
          <div class="browse-title-row">
            <div class="browse-icon">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <h1 class="browse-title">Search: "${this.state.searchQuery}"</h1>
          </div>
          <div class="browse-stats">
            <div class="browse-stat">
              <div class="browse-stat-info">
                <span class="browse-stat-value">${totalResults}</span>
                <span class="browse-stat-label">Results Found</span>
              </div>
            </div>
          </div>
        </div>

        ${movieResults.length > 0 ? `
          <div class="section">
            <div class="section-header">
              <h2 class="section-title">🎬 Movies (${movieResults.length})</h2>
            </div>
            <div class="browse-grid">
              ${this.renderBrowseGrid(movieResults, 'movie')}
            </div>
          </div>
        ` : ''}

        ${seriesResults.length > 0 ? `
          <div class="section">
            <div class="section-header">
              <h2 class="section-title">📺 Series (${seriesResults.length})</h2>
            </div>
            <div class="browse-grid">
              ${this.renderBrowseGrid(seriesResults, 'series')}
            </div>
          </div>
        ` : ''}

        ${liveResults.length > 0 ? `
          <div class="section">
            <div class="section-header">
              <h2 class="section-title">📡 Live Channels (${liveResults.length})</h2>
            </div>
            <div class="live-grid">
              ${this.renderLiveGrid(liveResults)}
            </div>
          </div>
        ` : ''}

        ${totalResults === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">😕</div>
            <div class="empty-state-title">No results found</div>
            <div class="empty-state-description">Try a different search term</div>
          </div>
        ` : ''}
      </div>
    `
  }

  renderFavoritesPage() {
    const favorites = this.loadFavorites()

    // Get actual items from favorites
    const movieFavorites = favorites
      .filter(f => f.type === 'movie')
      .map(f => this.localMovies?.find(m => String(m.stream_id) === String(f.id)))
      .filter(Boolean)

    const seriesFavorites = favorites
      .filter(f => f.type === 'series')
      .map(f => this.localSeries?.find(s => String(s.series_id) === String(f.id)))
      .filter(Boolean)

    const totalFavorites = movieFavorites.length + seriesFavorites.length

    return `
      <div class="fade-in">
        <div class="browse-header">
          <div class="browse-title-row">
            <div class="browse-icon" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);">
              <svg viewBox="0 0 24 24" fill="white">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h1 class="browse-title">My Favorites</h1>
          </div>
          <div class="browse-stats">
            <div class="browse-stat">
              <div class="browse-stat-info">
                <span class="browse-stat-value">${totalFavorites}</span>
                <span class="browse-stat-label">Saved Items</span>
              </div>
            </div>
          </div>
        </div>

        ${totalFavorites === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">❤️</div>
            <div class="empty-state-title">No favorites yet</div>
            <div class="empty-state-description">Start adding movies and series to your favorites!</div>
            <button class="btn btn-primary" onclick="dashApp.navigate('movies')" style="margin-top: 1.5rem;">
              Browse Movies
            </button>
          </div>
        ` : ''}

        ${movieFavorites.length > 0 ? `
          <div class="section">
            <div class="section-header">
              <h2 class="section-title">🎬 Movies (${movieFavorites.length})</h2>
            </div>
            <div class="browse-grid">
              ${this.renderBrowseGrid(movieFavorites, 'movie')}
            </div>
          </div>
        ` : ''}

        ${seriesFavorites.length > 0 ? `
          <div class="section">
            <div class="section-header">
              <h2 class="section-title">📺 Series (${seriesFavorites.length})</h2>
            </div>
            <div class="browse-grid">
              ${this.renderBrowseGrid(seriesFavorites, 'series')}
            </div>
          </div>
        ` : ''}
      </div>
    `
  }

  // Pagination state
  loadMoreOffset = 100

  loadMore() {
    const page = this.state.currentPage
    this.loadMoreOffset += 100

    console.log(`📄 Loading more ${page}, offset: ${this.loadMoreOffset}`)

    // Re-render with increased offset
    this.renderPage(page)
  }

  addToFavorites(id, type) {
    const favorites = this.loadFavorites()
    const exists = favorites.find(f => f.id === id && f.type === type)

    if (exists) {
      // Remove from favorites
      const updated = favorites.filter(f => !(f.id === id && f.type === type))
      localStorage.setItem('dash_favorites', JSON.stringify(updated))
      console.log('💔 Removed from favorites:', id, type)
      this.showToast('Removed from favorites', 'info')
    } else {
      // Add to favorites
      favorites.push({ id, type, addedAt: Date.now() })
      localStorage.setItem('dash_favorites', JSON.stringify(favorites))
      console.log('❤️ Added to favorites:', id, type)
      this.showToast('Added to favorites!', 'success')
    }
  }

  showToast(message, type = 'info') {
    // Remove existing toast
    const existing = document.querySelector('.toast')
    if (existing) existing.remove()

    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span class="toast-message">${message}</span>
    `
    document.body.appendChild(toast)

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10)

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

  loadFavorites() {
    const saved = localStorage.getItem('dash_favorites')
    return saved ? JSON.parse(saved) : []
  }

  loadWatchHistory() {
    const saved = localStorage.getItem('dash_watch_history')
    return saved ? JSON.parse(saved) : []
  }

  // ============================================
  // WATCH HISTORY & CONTINUE WATCHING
  // ============================================

  /**
   * Save an item to watch history with progress tracking
   * @param {string|number} id - Content ID
   * @param {string} type - 'movie' or 'series'
   * @param {object} metadata - Additional metadata (name, image, etc.)
   * @param {number} progress - Watch progress percentage (0-100)
   */
  saveToWatchHistory(id, type, metadata = {}, progress = 0) {
    const history = this.loadWatchHistory()
    const timestamp = Date.now()

    // Remove existing entry for this content
    const existingIndex = history.findIndex(h =>
      String(h.id) === String(id) && h.type === type
    )
    if (existingIndex !== -1) {
      history.splice(existingIndex, 1)
    }

    // Add to front of array (most recent first)
    history.unshift({
      id: String(id),
      type,
      timestamp,
      progress,
      name: metadata.name || '',
      image: metadata.image || '',
      episodeId: metadata.episodeId || null,
      episodeName: metadata.episodeName || '',
      seasonNum: metadata.seasonNum || null
    })

    // Keep only last 50 items
    const trimmedHistory = history.slice(0, 50)

    localStorage.setItem('dash_watch_history', JSON.stringify(trimmedHistory))
    this.state.watchHistory = trimmedHistory

    console.log(`📝 Added to watch history: ${metadata.name || id} (${type})`)
  }

  /**
   * Get continue watching items (recent, with progress < 90%)
   */
  getContinueWatching() {
    const history = this.loadWatchHistory()
    // Filter items with progress < 90% (not finished)
    return history.filter(h => (h.progress || 0) < 90).slice(0, 15)
  }

  /**
   * Update watch progress for an item
   */
  updateWatchProgress(id, type, progress) {
    const history = this.loadWatchHistory()
    const item = history.find(h => String(h.id) === String(id) && h.type === type)
    if (item) {
      item.progress = progress
      item.timestamp = Date.now()
      localStorage.setItem('dash_watch_history', JSON.stringify(history))
    }
  }

  /**
   * Remove item from watch history
   */
  removeFromWatchHistory(id, type) {
    const history = this.loadWatchHistory()
    const filtered = history.filter(h => !(String(h.id) === String(id) && h.type === type))
    localStorage.setItem('dash_watch_history', JSON.stringify(filtered))
    this.state.watchHistory = filtered
    // Refresh the page to show updated list
    this.navigateTo(this.state.currentPage)
  }

  // ============================================
  // MY LIST (WATCHLIST) MANAGEMENT
  // ============================================

  /**
   * Load My List items
   */
  loadMyList() {
    const saved = localStorage.getItem('dash_my_list')
    return saved ? JSON.parse(saved) : []
  }

  /**
   * Add/Remove item from My List
   */
  toggleMyList(id, type, metadata = {}) {
    const myList = this.loadMyList()
    const existingIndex = myList.findIndex(item =>
      String(item.id) === String(id) && item.type === type
    )

    if (existingIndex !== -1) {
      // Remove from list
      myList.splice(existingIndex, 1)
      this.showToast('Removed from My List')
    } else {
      // Add to list
      myList.unshift({
        id: String(id),
        type,
        timestamp: Date.now(),
        name: metadata.name || '',
        image: metadata.image || ''
      })
      this.showToast('Added to My List ✓')
    }

    localStorage.setItem('dash_my_list', JSON.stringify(myList))

    // Update button state if on detail modal
    this.updateMyListButton(id, type)
  }

  /**
   * Check if item is in My List
   */
  isInMyList(id, type) {
    const myList = this.loadMyList()
    return myList.some(item => String(item.id) === String(id) && item.type === type)
  }

  /**
   * Update My List button state in modal
   */
  updateMyListButton(id, type) {
    const btn = document.querySelector('.mylist-btn')
    if (btn) {
      const isInList = this.isInMyList(id, type)
      btn.innerHTML = isInList
        ? '✓ In My List'
        : '+ My List'
      btn.classList.toggle('in-list', isInList)
    }
  }

  /**
   * Render Continue Watching row for homepage
   */
  renderContinueWatchingRow() {
    const continueWatching = this.getContinueWatching()
    if (continueWatching.length === 0) return ''

    return `
      <div class="collection-row continue-watching-row">
        <div class="collection-header">
          <h2 class="collection-title">
            <svg class="collection-title-icon" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Continue Watching
          </h2>
          <span class="collection-see-all" onclick="dashApp.showAllContinueWatching()">
            See All
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </div>
        <div class="collection-carousel" data-collection="continue_watching">
          <button class="carousel-btn carousel-btn-left" onclick="dashApp.scrollCarousel('continue_watching', -1)">‹</button>
          <div class="carousel-track">
            ${continueWatching.map(item => this.renderContinueWatchingCard(item)).join('')}
          </div>
          <button class="carousel-btn carousel-btn-right" onclick="dashApp.scrollCarousel('continue_watching', 1)">›</button>
        </div>
      </div>
    `
  }

  /**
   * Render a continue watching card with progress bar
   */
  renderContinueWatchingCard(item) {
    const progress = item.progress || 0
    const onClick = item.type === 'movie'
      ? `dashApp.playContent('${item.id}', 'movie')`
      : `dashApp.showDetails('${item.id}', 'series')`

    return `
      <div class="content-card continue-card" onclick="${onClick}">
        <div class="card-image-container">
          <img class="card-image" src="${this.fixImageUrl(item.image)}" alt="${item.name}"
               onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=60'">
          <div class="progress-overlay">
            <div class="progress-bar" style="width: ${progress}%"></div>
          </div>
          <div class="card-play-icon">
            <svg viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <button class="remove-history-btn" onclick="event.stopPropagation(); dashApp.removeFromWatchHistory('${item.id}', '${item.type}')" title="Remove">✕</button>
        </div>
        <div class="card-info">
          <h3 class="card-title">${item.name || 'Unknown'}</h3>
          ${item.episodeName ? `<p class="card-subtitle">${item.episodeName}</p>` : ''}
        </div>
      </div>
    `
  }

  /**
   * Render My List row for homepage
   */
  renderMyListRow() {
    const myList = this.loadMyList()
    if (myList.length === 0) return ''

    return `
      <div class="collection-row my-list-row">
        <div class="collection-header">
          <h2 class="collection-title">
            <svg class="collection-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            My List
          </h2>
          <span class="collection-see-all" onclick="dashApp.navigate('mylist')">
            See All
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </div>
        <div class="collection-carousel" data-collection="my_list">
          <button class="carousel-btn carousel-btn-left" onclick="dashApp.scrollCarousel('my_list', -1)">‹</button>
          <div class="carousel-track">
            ${myList.slice(0, 15).map(item => this.renderMyListCard(item)).join('')}
          </div>
          <button class="carousel-btn carousel-btn-right" onclick="dashApp.scrollCarousel('my_list', 1)">›</button>
        </div>
      </div>
    `
  }

  /**
   * Render a My List card
   */
  renderMyListCard(item) {
    const onClick = item.type === 'movie'
      ? `dashApp.showDetails('${item.id}', 'movie')`
      : `dashApp.showDetails('${item.id}', 'series')`

    return `
      <div class="content-card mylist-card" onclick="${onClick}">
        <div class="card-image-container">
          <img class="card-image" src="${this.fixImageUrl(item.image)}" alt="${item.name}"
               onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=60'">
          <div class="mylist-badge">
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
        </div>
        <div class="card-info">
          <h3 class="card-title">${item.name || 'Unknown'}</h3>
          <p class="card-subtitle">${item.type === 'movie' ? 'Movie' : 'Series'}</p>
        </div>
      </div>
    `
  }

  /**
   * Show all continue watching items
   */
  showAllContinueWatching() {
    this.state.currentPage = 'continue_watching'
    this.navigateTo('continue_watching')
  }

  /**
   * Render continue watching page
   */
  renderContinueWatchingPage() {
    const items = this.loadWatchHistory()

    return `
      <div class="page-content fade-in">
        <div class="page-header">
          <h1>Continue Watching</h1>
          <p class="page-subtitle">${items.length} items in your history</p>
        </div>
        <div class="content-grid">
          ${items.map(item => this.renderContinueWatchingCard(item)).join('')}
        </div>
        ${items.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📺</div>
            <h2>No watch history yet</h2>
            <p>Start watching something and it will appear here</p>
          </div>
        ` : ''}
      </div>
    `
  }

  /**
   * Render My List page
   */
  renderMyListPage() {
    const items = this.loadMyList()

    return `
      <div class="page-content fade-in">
        <div class="page-header">
          <h1>My List</h1>
          <p class="page-subtitle">${items.length} saved items</p>
        </div>
        <div class="content-grid">
          ${items.map(item => {
            const onClick = item.type === 'movie'
              ? `dashApp.showDetails('${item.id}', 'movie')`
              : `dashApp.showDetails('${item.id}', 'series')`
            return `
              <div class="content-card" onclick="${onClick}">
                <div class="card-image-container">
                  <img class="card-image" src="${this.fixImageUrl(item.image)}" alt="${item.name}"
                       onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=60'">
                  <button class="remove-mylist-btn" onclick="event.stopPropagation(); dashApp.toggleMyList('${item.id}', '${item.type}')" title="Remove from My List">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                  </button>
                </div>
                <div class="card-info">
                  <h3 class="card-title">${item.name || 'Unknown'}</h3>
                  <p class="card-subtitle">${item.type === 'movie' ? 'Movie' : 'Series'}</p>
                </div>
              </div>
            `
          }).join('')}
        </div>
        ${items.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📑</div>
            <h2>Your list is empty</h2>
            <p>Add movies and shows to watch later</p>
          </div>
        ` : ''}
      </div>
    `
  }

  /**
   * Render African Stories row with unique tall poster "story" style
   * This is a signature DASH feature showcasing African content
   */
  renderAfricanStoriesRow() {
    const collection = this.collections?.african_stories
    if (!collection) return ''

    // Get both series and movies for African content
    let items = []

    // Get series by ID first
    if (collection.series && collection.series.length > 0) {
      const seriesItems = collection.series.map(id =>
        (this.localSeries || []).find(s => s.series_id === id || String(s.series_id) === String(id))
      ).filter(Boolean).map(s => ({ ...s, itemType: 'series' }))
      items.push(...seriesItems)
    }

    // Search for African series by keywords
    const africanKeywords = ['nigeria', 'nollywood', 'africa', 'lagos', 'johannesburg', 'kenya', 'ghana', 'south africa', 'nairobi']
    const keywordSeriesMatches = (this.localSeries || []).filter(s => {
      const name = (s.name || '').toLowerCase()
      const category = (s.category_name || '').toLowerCase()
      return africanKeywords.some(kw => name.includes(kw) || category.includes(kw))
    }).map(s => ({ ...s, itemType: 'series' }))

    // Add keyword matches (dedupe)
    const existingSeriesIds = new Set(items.filter(i => i.itemType === 'series').map(s => s.series_id))
    keywordSeriesMatches.forEach(s => {
      if (!existingSeriesIds.has(s.series_id)) {
        items.push(s)
      }
    })

    // Get African movies
    const movieItems = this.getCollectionMovies('african_stories', 15).map(m => ({ ...m, itemType: 'movie' }))
    items.push(...movieItems)

    // Prioritize items with images
    items = items.filter(i => {
      const hasImage = i.itemType === 'series' ? (i.cover || i.stream_icon) : i.stream_icon
      return hasImage
    }).slice(0, 25)

    if (items.length === 0) return ''

    return `
      <div class="collection-row featured-row african-stories-row">
        <div class="collection-header">
          <h2 class="collection-title">
            <span style="margin-right: 8px;">🌍</span>
            African Stories
            <span style="font-size: 0.6em; margin-left: 12px; color: var(--accent-gold);">FROM LAGOS TO JOHANNESBURG</span>
          </h2>
          <span class="collection-see-all" onclick="dashApp.showCollection('african_stories')">
            See All
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </div>
        <div class="collection-carousel" data-collection="african_stories">
          <button class="carousel-btn carousel-btn-left" onclick="dashApp.scrollCarousel('african_stories', -1)">‹</button>
          <div class="carousel-track">
            ${items.map(item => this.renderAfricanStoryCard(item)).join('')}
          </div>
          <button class="carousel-btn carousel-btn-right" onclick="dashApp.scrollCarousel('african_stories', 1)">›</button>
        </div>
      </div>
    `
  }

  /**
   * Render a single African story card (tall poster style)
   */
  renderAfricanStoryCard(item) {
    const isSeries = item.itemType === 'series'
    const id = isSeries ? item.series_id : item.stream_id
    const image = isSeries ? (item.cover || item.stream_icon) : item.stream_icon
    const rating = item.rating ? parseFloat(item.rating).toFixed(1) : ''
    const badge = isSeries ? 'SERIES' : 'MOVIE'
    const onClick = isSeries
      ? `dashApp.showDetails('${id}', 'series')`
      : `dashApp.showDetails('${id}', 'movie')`

    return `
      <div class="african-story-card" onclick="${onClick}">
        <div class="story-image-container">
          <img class="story-image" src="${this.fixImageUrl(image)}" alt="${item.name}"
               onerror="this.onerror=null; this.parentElement.style.background='linear-gradient(135deg, #6B46C1 0%, #2D1B4E 100%)'">
          <span class="story-badge">${badge}</span>
          <div class="story-gradient"></div>
          <div class="story-info">
            <div class="story-title">${item.name || 'Unknown'}</div>
            ${rating ? `<div class="story-rating">★ ${rating}</div>` : ''}
          </div>
        </div>
      </div>
    `
  }

  /**
   * Render Kids & Family row with playful bubble style
   */
  renderKidsRow() {
    const collection = this.collections?.kids_family
    if (!collection) return ''

    let items = []
    const kidsKeywords = ['kids', 'children', 'family', 'animation', 'cartoon', 'animated', 'disney', 'pixar', 'dreamworks', 'nickelodeon']

    const kidsSeries = (this.localSeries || []).filter(s => {
      const name = (s.name || '').toLowerCase()
      const category = (s.category_name || '').toLowerCase()
      return kidsKeywords.some(kw => name.includes(kw) || category.includes(kw))
    }).map(s => ({ ...s, itemType: 'series' }))
    items.push(...kidsSeries)

    const kidsMovies = (this.localMovies || []).filter(m => {
      const name = (m.name || '').toLowerCase()
      const category = (m.category_name || '').toLowerCase()
      return kidsKeywords.some(kw => name.includes(kw) || category.includes(kw))
    }).map(m => ({ ...m, itemType: 'movie' }))
    items.push(...kidsMovies)

    items = items
      .filter(i => {
        const hasImage = i.itemType === 'series' ? (i.cover || i.stream_icon) : i.stream_icon
        return hasImage
      })
      .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
      .slice(0, 25)

    if (items.length === 0) return ''

    return `
      <div class="collection-row featured-row kids-row">
        <div class="collection-header">
          <h2 class="collection-title kids-title">
            <span class="kids-stars">✨</span>
            <span class="kids-emoji">🎈</span>
            Kids & Family
            <span class="kids-emoji">🎠</span>
            <span class="kids-stars">✨</span>
            <span class="kids-tagline">FUN FOR EVERYONE!</span>
          </h2>
          <span class="collection-see-all" onclick="dashApp.showCollection('kids_family')">
            See All
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </div>
        <div class="collection-carousel" data-collection="kids_family">
          <button class="carousel-btn carousel-btn-left" onclick="dashApp.scrollCarousel('kids_family', -1)">‹</button>
          <div class="carousel-track">
            ${items.map((item, idx) => this.renderKidsCard(item, idx)).join('')}
          </div>
          <button class="carousel-btn carousel-btn-right" onclick="dashApp.scrollCarousel('kids_family', 1)">›</button>
        </div>
      </div>
    `
  }

  renderKidsCard(item, index) {
    const isSeries = item.itemType === 'series'
    const id = isSeries ? item.series_id : item.stream_id
    const image = isSeries ? (item.cover || item.stream_icon) : item.stream_icon
    const rating = item.rating ? parseFloat(item.rating).toFixed(1) : ''
    const onClick = isSeries
      ? `dashApp.showDetails('${id}', 'series')`
      : `dashApp.showDetails('${id}', 'movie')`

    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA']
    const accentColor = colors[index % colors.length]

    return `
      <div class="kids-card" onclick="${onClick}" style="--kids-accent: ${accentColor}">
        <div class="kids-card-bubble">
          <img class="kids-card-image" src="${this.fixImageUrl(image)}" alt="${item.name}"
               onerror="this.onerror=null; this.src='/assets/placeholder.svg'">
          <div class="kids-card-sparkle">✨</div>
          <div class="kids-card-overlay">
            <div class="kids-card-play">▶</div>
          </div>
        </div>
        <div class="kids-card-info">
          <div class="kids-card-title">${item.name || 'Fun Time!'}</div>
          ${rating ? `<div class="kids-card-rating">⭐ ${rating}</div>` : ''}
        </div>
      </div>
    `
  }

  /**
   * Render K-Drama row with elegant Korean aesthetic
   */
  renderKDramaRow() {
    const collection = this.collections?.kdrama
    if (!collection) return ''

    let items = []
    const kdramaKeywords = ['korean', 'korea', 'k-drama', 'kdrama', 'seoul', 'hangul']

    const kdramaSeries = (this.localSeries || []).filter(s => {
      const name = (s.name || '').toLowerCase()
      const category = (s.category_name || '').toLowerCase()
      return kdramaKeywords.some(kw => name.includes(kw) || category.includes(kw))
    }).map(s => ({ ...s, itemType: 'series' }))
    items.push(...kdramaSeries)

    const kdramaMovies = (this.localMovies || []).filter(m => {
      const name = (m.name || '').toLowerCase()
      const category = (m.category_name || '').toLowerCase()
      return kdramaKeywords.some(kw => name.includes(kw) || category.includes(kw))
    }).map(m => ({ ...m, itemType: 'movie' }))
    items.push(...kdramaMovies)

    items = items
      .filter(i => {
        const hasImage = i.itemType === 'series' ? (i.cover || i.stream_icon) : i.stream_icon
        return hasImage
      })
      .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
      .slice(0, 25)

    if (items.length === 0) return ''

    return `
      <div class="collection-row featured-row kdrama-row">
        <div class="collection-header">
          <h2 class="collection-title kdrama-title">
            <span class="kdrama-hangul">한국</span>
            K-Drama
            <span class="kdrama-heart">💕</span>
            <span class="kdrama-tagline">HALLYU WAVE 한류</span>
          </h2>
          <span class="collection-see-all" onclick="dashApp.showCollection('kdrama')">
            See All
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </div>
        <div class="collection-carousel" data-collection="kdrama">
          <button class="carousel-btn carousel-btn-left" onclick="dashApp.scrollCarousel('kdrama', -1)">‹</button>
          <div class="carousel-track">
            ${items.map(item => this.renderKDramaCard(item)).join('')}
          </div>
          <button class="carousel-btn carousel-btn-right" onclick="dashApp.scrollCarousel('kdrama', 1)">›</button>
        </div>
      </div>
    `
  }

  renderKDramaCard(item) {
    const isSeries = item.itemType === 'series'
    const id = isSeries ? item.series_id : item.stream_id
    const image = isSeries ? (item.cover || item.stream_icon) : item.stream_icon
    const rating = item.rating ? parseFloat(item.rating).toFixed(1) : ''
    const badge = isSeries ? '드라마' : '영화'
    const onClick = isSeries
      ? `dashApp.showDetails('${id}', 'series')`
      : `dashApp.showDetails('${id}', 'movie')`

    return `
      <div class="kdrama-card" onclick="${onClick}">
        <div class="kdrama-card-container">
          <img class="kdrama-card-image" src="${this.fixImageUrl(image)}" alt="${item.name}"
               onerror="this.onerror=null; this.src='/assets/placeholder.svg'">
          <div class="kdrama-card-petals"></div>
          <span class="kdrama-badge">${badge}</span>
          <div class="kdrama-card-gradient"></div>
          <div class="kdrama-card-info">
            <div class="kdrama-card-title">${item.name || 'Unknown'}</div>
            ${rating ? `<div class="kdrama-card-rating">★ ${rating}</div>` : ''}
          </div>
          <div class="kdrama-card-heart">♡</div>
        </div>
      </div>
    `
  }

  /**
   * Render a mixed collection row (movies + series)
   */
  renderMixedCollectionRow(key, title, icon) {
    const collection = this.collections?.[key]
    if (!collection) return ''

    // Get series items
    let seriesItems = []
    if (collection.series && collection.series.length > 0) {
      seriesItems = collection.series.map(id =>
        (this.localSeries || []).find(s => s.series_id === id || String(s.series_id) === String(id))
      ).filter(Boolean)
    }

    // Also search by keywords if provided (for African content)
    if (collection.keywords && collection.keywords.length > 0) {
      const keywordMatches = (this.localSeries || []).filter(s => {
        const name = (s.name || '').toLowerCase()
        const plot = (s.plot || '').toLowerCase()
        const category = (s.category_name || '').toLowerCase()
        return collection.keywords.some(kw => name.includes(kw) || plot.includes(kw) || category.includes(kw))
      })
      // Merge and dedupe
      const existingIds = new Set(seriesItems.map(s => s.series_id))
      keywordMatches.forEach(s => {
        if (!existingIds.has(s.series_id)) {
          seriesItems.push(s)
        }
      })
    }

    // Get movie items
    let movieItems = []
    if (collection.movies && collection.movies.length > 0) {
      movieItems = collection.movies.map(id =>
        (this.localMovies || []).find(m => m.stream_id === id || String(m.stream_id) === String(id))
      ).filter(Boolean)
    }

    // Combine and sort (prioritize items with images)
    const allItems = [
      ...seriesItems.map(s => ({ ...s, itemType: 'series', hasImage: !!(s.cover || s.stream_icon) })),
      ...movieItems.map(m => ({ ...m, itemType: 'movie', hasImage: !!(m.stream_icon || m.cover) }))
    ].sort((a, b) => (b.hasImage ? 1 : 0) - (a.hasImage ? 1 : 0))

    if (allItems.length === 0) return ''

    return `
      <div class="collection-row featured-row">
        <div class="collection-header">
          <h2 class="collection-title">
            ${this.getCollectionIcon(icon)}
            ${title}
          </h2>
          <span class="collection-see-all" onclick="dashApp.showCollection('${key}')">
            See All
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </div>
        <div class="collection-carousel" data-collection="${key}">
          <button class="carousel-btn carousel-btn-left" onclick="dashApp.scrollCarousel('${key}', -1)">‹</button>
          <div class="carousel-track">
            ${allItems.slice(0, 20).map(item => {
              if (item.itemType === 'series') {
                return this.renderSeriesCard(item)
              } else {
                return this.renderMovieCard(item)
              }
            }).join('')}
          </div>
          <button class="carousel-btn carousel-btn-right" onclick="dashApp.scrollCarousel('${key}', 1)">›</button>
        </div>
      </div>
    `
  }

  // ============================================
  // SMART RECOMMENDATIONS ENGINE
  // ============================================

  /**
   * Get recommendations based on watch history
   * "Because you watched X" - Netflix style
   */
  getRecommendations() {
    const history = this.loadWatchHistory()
    if (history.length === 0) return []

    // Get the most recently watched items
    const recentItems = history.slice(0, 5)

    // Build a genre/category profile from watch history
    const categoryProfile = {}
    recentItems.forEach(item => {
      const content = item.type === 'movie'
        ? (this.localMovies || []).find(m => String(m.stream_id) === String(item.id))
        : (this.localSeries || []).find(s => String(s.series_id) === String(item.id))

      if (content?.category_name) {
        const cat = content.category_name.toUpperCase()
        categoryProfile[cat] = (categoryProfile[cat] || 0) + 1
      }
    })

    // Get top categories
    const topCategories = Object.entries(categoryProfile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat)

    if (topCategories.length === 0) return []

    // Find similar content
    const watchedIds = new Set(history.map(h => String(h.id)))
    const recommendations = (this.localMovies || [])
      .filter(m => {
        const cat = (m.category_name || '').toUpperCase()
        return topCategories.some(tc => cat.includes(tc)) &&
               !watchedIds.has(String(m.stream_id)) &&
               m.stream_icon
      })
      .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
      .slice(0, 15)

    return recommendations
  }

  /**
   * Render "Because You Watched" row
   */
  renderRecommendationsRow() {
    const history = this.loadWatchHistory()
    if (history.length === 0) return ''

    const recommendations = this.getRecommendations()
    if (recommendations.length === 0) return ''

    // Get the name of the most recent watch for the title
    const recentName = history[0]?.name || 'your favorites'

    return `
      <div class="collection-row recommendations-row">
        <div class="collection-header">
          <h2 class="collection-title">
            <svg class="collection-title-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            Because You Watched "${recentName.substring(0, 25)}${recentName.length > 25 ? '...' : ''}"
          </h2>
        </div>
        <div class="collection-carousel" data-collection="recommendations">
          <button class="carousel-btn carousel-btn-left" onclick="dashApp.scrollCarousel('recommendations', -1)">‹</button>
          <div class="carousel-track">
            ${recommendations.map(movie => this.renderMovieCard(movie)).join('')}
          </div>
          <button class="carousel-btn carousel-btn-right" onclick="dashApp.scrollCarousel('recommendations', 1)">›</button>
        </div>
      </div>
    `
  }

  /**
   * Get "More Like This" suggestions for a specific content
   */
  getMoreLikeThis(id, type) {
    let sourceContent = null
    if (type === 'movie') {
      sourceContent = (this.localMovies || []).find(m => String(m.stream_id) === String(id))
    } else {
      sourceContent = (this.localSeries || []).find(s => String(s.series_id) === String(id))
    }

    if (!sourceContent) return []

    const sourceCategory = (sourceContent.category_name || '').toUpperCase()
    const sourceRating = parseFloat(sourceContent.rating) || 5

    // Find similar content by category and rating range
    const similar = (this.localMovies || [])
      .filter(m => {
        const cat = (m.category_name || '').toUpperCase()
        const rating = parseFloat(m.rating) || 0
        return cat === sourceCategory &&
               String(m.stream_id) !== String(id) &&
               Math.abs(rating - sourceRating) < 2 &&
               m.stream_icon
      })
      .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
      .slice(0, 10)

    return similar
  }

  /**
   * Render Top 10 Today row with Netflix-style numbered badges
   */
  renderTop10Row() {
    // Get top 10 movies by rating that have images
    const topMovies = (this.localMovies || [])
      .filter(m => m.stream_icon && m.rating)
      .sort((a, b) => {
        const ratingA = parseFloat(a.rating) || 0
        const ratingB = parseFloat(b.rating) || 0
        return ratingB - ratingA
      })
      .slice(0, 10)

    if (topMovies.length === 0) return ''

    return `
      <div class="collection-row top-10-row">
        <div class="collection-header">
          <h2 class="collection-title">
            <svg class="collection-title-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            Top 10 Today
          </h2>
        </div>
        <div class="collection-carousel top-10-carousel" data-collection="top10">
          <button class="carousel-btn carousel-btn-left" onclick="dashApp.scrollCarousel('top10', -1)">‹</button>
          <div class="carousel-track">
            ${topMovies.map((movie, index) => this.renderTop10Card(movie, index + 1)).join('')}
          </div>
          <button class="carousel-btn carousel-btn-right" onclick="dashApp.scrollCarousel('top10', 1)">›</button>
        </div>
      </div>
    `
  }

  /**
   * Render a Top 10 card with large number
   */
  renderTop10Card(movie, rank) {
    return `
      <div class="top-10-card" onclick="dashApp.showDetails('${movie.stream_id}', 'movie')">
        <div class="top-10-rank">${rank}</div>
        <div class="top-10-poster">
          <img src="${this.fixImageUrl(movie.stream_icon)}" alt="${movie.name}"
               onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=60'">
          <div class="top-10-info">
            <h4>${movie.name}</h4>
            ${movie.rating ? `<span class="top-10-rating">★ ${parseFloat(movie.rating).toFixed(1)}</span>` : ''}
          </div>
        </div>
      </div>
    `
  }

  /**
   * Render a series card for carousels
   */
  renderSeriesCard(series) {
    const image = series.cover || series.stream_icon || ''
    const rating = series.rating ? parseFloat(series.rating).toFixed(1) : ''
    const healthClass = this.getContentHealthClass(series.series_id, 'series')

    return `
      <div class="content-card series-card ${healthClass}" onclick="dashApp.showDetails('${series.series_id}', 'series')">
        <div class="card-image-container">
          ${image ? `
            <img class="card-image" src="${this.fixImageUrl(image)}" alt="${series.name}"
                 onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=60'">
          ` : `
            <div class="card-placeholder">
              <span>${series.name?.charAt(0) || 'S'}</span>
            </div>
          `}
          <div class="card-overlay">
            <span class="card-badge series-badge">SERIES</span>
          </div>
        </div>
        <div class="card-info">
          <h3 class="card-title">${series.name || 'Unknown Series'}</h3>
          <div class="card-meta">
            ${rating ? `<span class="card-rating">★ ${rating}</span>` : ''}
            ${series.category_name ? `<span class="card-category">${series.category_name}</span>` : ''}
          </div>
        </div>
      </div>
    `
  }

  showLoading() {
    this.elements.pageContainer.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    `
  }

  showError(message) {
    this.elements.pageContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Error</div>
        <div class="empty-state-description">${message}</div>
      </div>
    `
  }
}

// Initialize app when DOM is ready
let dashApp
document.addEventListener('DOMContentLoaded', () => {
  dashApp = new DashApp()
  window.dashApp = dashApp
})
