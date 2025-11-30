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

    // MKV to MP4 fallback mapping (loaded at init)
    this.mkvToMp4Map = null

    // Collections for Netflix-style UI
    this.collections = null

    // Local data cache (from JSON files)
    this.localMovies = null
    this.localSeries = null
    this.localLive = null

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

    // Load MKV to MP4 fallback mapping
    await this.loadMkvToMp4Map()

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

  async loadMkvToMp4Map() {
    try {
      const response = await fetch('data/mkv_to_mp4.json')
      if (response.ok) {
        this.mkvToMp4Map = await response.json()
        console.log(`📀 Loaded MKV→MP4 fallback map: ${Object.keys(this.mkvToMp4Map).length} alternatives available`)
      }
    } catch (err) {
      console.warn('⚠️ Could not load MKV fallback map:', err.message)
      this.mkvToMp4Map = {}
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
    } catch (err) {
      console.error('❌ Failed to load local data:', err)
    }
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

    const movieIds = collection.movies.slice(0, limit)
    return movieIds.map(id => this.getMovieById(id)).filter(Boolean)
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
      location.reload()
    }
  }

  async loadAppContent() {
    console.log('📂 Loading app content...')

    // Load local data files (movies, series, collections)
    await this.loadLocalData()

    // Load categories from API
    await this.loadCategories()

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

    // Get hero movies for rotation (top 5 from different collections for variety)
    const heroMovies = [
      ...this.getCollectionMovies('top_rated', 2),
      ...this.getCollectionMovies('new_releases', 2),
      ...this.getCollectionMovies('blockbusters', 1)
    ].filter(m => m?.stream_icon).slice(0, 5)

    // Build collection rows with SVG icons
    const collectionRows = [
      { key: 'trending', title: 'Trending Now', icon: 'fire' },
      { key: 'new_releases', title: 'New Releases', icon: 'star' },
      { key: 'top_rated', title: 'Top Rated', icon: 'award' },
      { key: 'blockbusters', title: 'Blockbusters', icon: 'zap' },
      { key: 'genre_action', title: 'Action Movies', icon: 'target' },
      { key: 'genre_comedy', title: 'Comedy', icon: 'smile' },
      { key: 'genre_horror', title: 'Horror', icon: 'moon' },
      { key: 'genre_drama', title: 'Drama', icon: 'heart' },
      { key: 'genre_animation', title: 'Animation & Kids', icon: 'palette' },
      { key: 'hidden_gems', title: 'Hidden Gems', icon: 'gem' },
      { key: 'lang_english', title: 'English Movies', icon: 'globe' },
      { key: 'lang_hindi', title: 'Bollywood', icon: 'film' },
      { key: 'lang_tamil', title: 'Tamil Cinema', icon: 'video' },
      { key: 'lang_korean', title: 'Korean Movies', icon: 'flag' },
      { key: 'decade_2020s', title: '2020s Hits', icon: 'calendar' },
      { key: 'decade_2010s', title: '2010s Classics', icon: 'clock' },
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

        <!-- Collection Rows (Netflix Style) -->
        ${collectionRows.map(row => {
          const movies = this.filterAdultContent(this.getCollectionMovies(row.key, 20))
          if (movies.length === 0) return ''
          return `
            <div class="collection-row">
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

    return `
      <div class="movie-card" onclick="dashApp.showDetails('${id}', 'movie')">
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

    const movies = this.filterAdultContent(
      collection.movies.map(id => this.getMovieById(id)).filter(Boolean)
    )

    return `
      <div class="fade-in">
        <div class="page-header">
          <button class="btn btn-back" onclick="dashApp.navigate('home')">← Back</button>
          <h1>${collection.title}</h1>
          <p class="page-description">${collection.description}</p>
        </div>
        <div class="content-grid">
          ${this.renderContentGrid(movies, 'movie')}
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

    // Use local JSON data instead of API
    let series = this.localSeries || []

    // Filter by category if selected
    if (this.state.selectedCategory) {
      series = series.filter(s => String(s.category_id) === String(this.state.selectedCategory))
    }

    // Filter adult content
    series = this.filterAdultContent(series)

    const totalSeries = this.localSeries?.length || 0
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

          <div class="browse-stats">
            <div class="browse-stat">
              <div class="browse-stat-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49"/></svg>
              </div>
              <div class="browse-stat-info">
                <span class="browse-stat-value">${totalChannels.toLocaleString()}</span>
                <span class="browse-stat-label">Channels</span>
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
              <div class="badge badge-new mt-sm">Premium Access</div>
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

    return items.map(item => {
      const poster = this.fixImageUrl(item.stream_icon || item.cover)
      const title = item.name || 'Untitled'
      const id = item.stream_id || item.series_id

      const clickHandler = type === 'live'
        ? `dashApp.playContent('${id}', 'live')`
        : `dashApp.showDetails('${id}', '${type}')`

      return `
        <div class="content-card" onclick="${clickHandler}">
          <img src="${poster}" alt="${title}" class="content-card-poster" loading="lazy"
               onerror="this.onerror=null;this.src='/assets/placeholder.svg'">
          <div class="content-card-overlay">
            <div class="content-card-title">${title}</div>
            <div class="content-card-meta">
              ${this.renderBadges(item)}
            </div>
          </div>
        </div>
      `
    }).join('')
  }

  renderBadges(item) {
    let badges = ''
    const categoryName = (item.category_name || '').toLowerCase()

    if (categoryName.includes('netflix')) {
      badges += '<span class="badge badge-netflix">Netflix</span>'
    }
    if (categoryName.includes('prime') || categoryName.includes('amazon')) {
      badges += '<span class="badge badge-prime">Prime</span>'
    }
    if (categoryName.includes('hbo')) {
      badges += '<span class="badge badge-hbo">HBO</span>'
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
      const poster = this.fixImageUrl(item.stream_icon || item.cover)
      const title = item.name || 'Untitled'
      const id = item.stream_id || item.series_id
      const year = item.year || item.releaseDate?.slice(0, 4) || ''
      const rating = item.rating || item.rating_5based

      return `
        <div class="browse-card" onclick="dashApp.showDetails('${id}', '${type}')">
          <div class="browse-card-poster-wrap">
            <img src="${poster}" alt="${title}" class="browse-card-poster" loading="lazy"
                 onerror="this.onerror=null;this.src='/assets/placeholder.svg'">
            <div class="browse-card-overlay">
              <div class="browse-card-play">
                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
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

      return `
        <div class="live-card ${hasLogo ? '' : 'live-card-glow'}" onclick="dashApp.playContent('${id}', 'live')"
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

        modalContent = `
          <div class="series-episodes">
            ${seasons.map(seasonNum => {
              const episodes = details.episodes[seasonNum]
              return `
                <div class="season-section">
                  <h3>Season ${seasonNum}</h3>
                  <div class="episode-list">
                    ${episodes.map(ep => `
                      <div class="episode-card" onclick="dashApp.playEpisode('${ep.id}', '${ep.container_extension || 'mp4'}')">
                        <div class="episode-number">E${ep.episode_num}</div>
                        <div class="episode-info">
                          <div class="episode-title">${ep.title || `Episode ${ep.episode_num}`}</div>
                          <div class="episode-meta">${ep.duration || ''}</div>
                        </div>
                        <div class="episode-play">▶️</div>
                      </div>
                    `).join('')}
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

  async playContent(id, type, extension = 'mp4') {
    console.log(`Playing ${type}:`, id, `Original format: ${extension}`)

    let streamUrl = ''
    let finalExtension = extension
    let playableId = id

    // Formats that browsers can't play natively
    const unsupportedFormats = ['mkv', 'avi', 'flv', 'wmv', 'mov', 'webm']

    if (type === 'movie') {
      // Check if format needs special handling
      if (unsupportedFormats.includes(extension.toLowerCase())) {
        // FIRST: Check if we have an MP4 alternative for this MKV
        const alternative = this.mkvToMp4Map?.[id]
        if (alternative) {
          console.log(`✨ Found MP4 alternative! MKV ${id} → MP4 ${alternative.mp4_id} (${alternative.name})`)
          playableId = alternative.mp4_id
          finalExtension = 'mp4'
        } else {
          // No alternative - try HLS transcode (usually fails but worth trying)
          console.log(`⚠️ ${extension.toUpperCase()} detected, no MP4 alternative - trying HLS transcode...`)
          finalExtension = 'm3u8'
        }
      } else {
        console.log('🎬 Using direct stream (MP4 compatible)')
        finalExtension = 'mp4'
      }
      streamUrl = this.client.buildVODUrl(playableId, finalExtension)
    } else if (type === 'live') {
      // Live TV: Hybrid approach - Safari uses HLS, others use MPEG-TS
      console.log('🔴 Building Live TV stream URL...')
      const liveStream = this.client.buildLiveStreamUrl(id, 'ts')
      streamUrl = liveStream.url
      // Pass the stream type to player (hls-native or mpegts)
      console.log(`📡 Live stream type: ${liveStream.type}`)
      this.closeModal()
      this.showVideoPlayer(streamUrl, type, liveStream.type)
      return
    }

    console.log('Stream URL:', streamUrl)
    this.closeModal()
    this.showVideoPlayer(streamUrl, type)
  }

  playEpisode(episodeId, extension = 'mp4') {
    console.log(`📺 Playing episode: ${episodeId}, Original format: ${extension}`)

    // ALWAYS use MP4 extension - Starshare serves video/mp4 content-type
    // HLS transcode (m3u8) returns empty content on this provider
    // The server may still stream MKV content but browser handles it
    const finalExtension = 'mp4'
    console.log('📺 Using MP4 stream (server handles format)')

    const streamUrl = this.client.buildSeriesUrl(episodeId, finalExtension)
    console.log('📺 Stream URL:', streamUrl)

    this.closeModal()
    this.showVideoPlayer(streamUrl, 'series')
  }

  showVideoPlayer(streamUrl, type = 'movie', streamType = null) {
    console.log('🎬 Playing stream:', streamUrl)

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

    // Create player HTML
    const playerHTML = `
      <div class="video-player-container">
        <button class="modal-close" onclick="dashApp.closeVideoPlayer()">×</button>
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

      this.mpegtsPlayer = mpegts.createPlayer({
        type: 'mse',
        isLive: true,
        url: streamUrl
      }, {
        // Worker for better performance
        enableWorker: true,
        workerForMSE: true,

        // Buffer settings - balanced for stability + responsiveness
        enableStashBuffer: true,
        stashInitialSize: 384 * 1024,   // 384KB initial stash
        autoCleanupSourceBuffer: true,
        autoCleanupMaxBackwardDuration: 30,
        autoCleanupMinBackwardDuration: 15,

        // Lazy loading - moderate buffer
        lazyLoad: true,
        lazyLoadMaxDuration: 45,        // 45 sec buffer (good balance)
        lazyLoadRecoverDuration: 15,

        // Live stream optimization
        liveBufferLatencyChasing: true,
        liveBufferLatencyMaxLatency: 2.0,   // Allow 2 sec behind live
        liveBufferLatencyMinRemain: 0.5,    // Keep 0.5 sec buffer min
        liveSync: true,
        liveSyncMaxLatency: 3,

        // Seek type for live
        seekType: 'range',
        fixAudioTimestampGap: true,
        accurateSeek: false,
      })

      this.mpegtsPlayer.attachMediaElement(video)
      this.mpegtsPlayer.load()

      // METRIC: First byte received
      this.mpegtsPlayer.on(mpegts.Events.LOADING_COMPLETE, () => {
        if (!metrics.firstByteTime) {
          metrics.firstByteTime = performance.now()
          console.log(`📊 METRIC: First byte in ${(metrics.firstByteTime - metrics.startTime).toFixed(0)}ms`)
        }
        video.play().catch(err => {
          console.warn('⚠️ Autoplay blocked:', err.message)
          if (loadingEl) loadingEl.innerHTML = '<div>Click video to play</div>'
        })
      })

      // METRIC: Track statistics
      this.mpegtsPlayer.on(mpegts.Events.STATISTICS_INFO, (stats) => {
        metrics.bytesReceived = stats.totalBytes || 0
        const speedKbps = stats.speed ? (stats.speed / 1024).toFixed(1) : 0
        // Update UI with live stats (optional debug)
        if (window.DASH_DEBUG) {
          console.log(`📊 Speed: ${speedKbps} KB/s | Buffered: ${stats.videoRange?.end || 0}s`)
        }
      })

      this.mpegtsPlayer.on(mpegts.Events.ERROR, (errorType, errorDetail, errorInfo) => {
        console.error('❌ MPEG-TS Error:', errorType, errorDetail, errorInfo)
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

      // METRIC: Buffer events (stalls)
      video.addEventListener('waiting', () => {
        metrics.bufferEvents++
        metrics.lastBufferStart = performance.now()
        console.log(`📊 METRIC: Buffer stall #${metrics.bufferEvents}`)
      })

      video.addEventListener('playing', () => {
        if (metrics.lastBufferStart) {
          const stallDuration = (performance.now() - metrics.lastBufferStart).toFixed(0)
          console.log(`📊 METRIC: Stall duration: ${stallDuration}ms`)
          metrics.lastBufferStart = null
        }
      })

      // Store metrics for external access
      this.currentMetrics = metrics

      // Start playback immediately
      video.play().catch(err => {
        console.warn('⚠️ Initial autoplay blocked:', err.message)
      })

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
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  async filterByCategory(categoryId, type) {
    this.state.selectedCategory = categoryId
    this.renderPage(this.state.currentPage)
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
        <div class="fade-in">
          <div class="browse-header">
            <div class="browse-title-row">
              <div class="browse-icon">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <h1 class="browse-title">Search</h1>
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

    // Search movies
    const movieResults = (this.localMovies || [])
      .filter(m => m.name?.toLowerCase().includes(query))
      .slice(0, 30)

    // Search series
    const seriesResults = (this.localSeries || [])
      .filter(s => s.name?.toLowerCase().includes(query))
      .slice(0, 20)

    // Search live channels
    const liveResults = (this.localLive || [])
      .filter(c => c.name?.toLowerCase().includes(query))
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
