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

    this.init()
  }

  // ============================================
  // INITIALIZATION & SESSION MANAGEMENT
  // ============================================

  async init() {
    console.log('🚀 DASH WebTV initializing...')

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
    const username = document.getElementById('login-username').value
    const password = document.getElementById('login-password').value
    const btn = this.elements.loginBtn
    const errorEl = this.elements.loginError

    // Clear previous error
    errorEl.textContent = ''

    // Show loading state
    btn.textContent = 'CONNECTING...'
    btn.disabled = true

    await this.attemptLogin(username, password, false)

    // Reset button
    btn.textContent = 'ENTER UNIVERSE'
    btn.disabled = false
  }

  async attemptLogin(username, password, isAutoLogin) {
    const result = await this.client.login(username, password)

    if (result.success) {
      // Save credentials for session persistence
      localStorage.setItem('dash_user', username)
      localStorage.setItem('dash_pass', password)

      console.log('✅ Login successful!')
      this.showAppUI()
    } else {
      if (!isAutoLogin) {
        // Show error to user
        this.elements.loginError.textContent = result.error || 'Invalid credentials'
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

    // Load categories
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
      console.log('📂 Loading categories...')

      const [vodCats, seriesCats, liveCats] = await Promise.all([
        this.client.getVODCategories(),
        this.client.getSeriesCategories(),
        this.client.getLiveCategories()
      ])

      this.state.categories.vod = vodCats || []
      this.state.categories.series = seriesCats || []
      this.state.categories.live = liveCats || []

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
      default:
        content = '<div class="empty-state"><h2>Page not found</h2></div>'
    }

    this.elements.pageContainer.innerHTML = content
  }

  // ============================================
  // PAGE RENDERERS
  // ============================================

  async renderHomePage() {
    let featuredMovies = []
    let featuredSeries = []

    try {
      const [movies, series] = await Promise.all([
        this.client.getVODStreams(),
        this.client.getSeries()
      ])

      featuredMovies = (movies || []).slice(0, 20)
      featuredSeries = (series || []).slice(0, 20)
    } catch (error) {
      console.error('Failed to load featured content:', error)
    }

    const username = localStorage.getItem('dash_user') || 'User'

    return `
      <div class="fade-in">
        <!-- Hero Banner -->
        <div class="hero-banner">
          <div class="hero-banner-overlay"></div>
          <div class="hero-banner-content">
            <h1 class="hero-banner-title">Welcome, ${username}!</h1>
            <p class="hero-banner-description">
              The African Super Hub - 57,000+ Movies, 14,000+ Series, and Live TV all in one place.
            </p>
            <div class="hero-banner-actions">
              <button class="btn btn-primary" onclick="dashApp.navigate('movies')">
                🎬 Browse Movies
              </button>
              <button class="btn btn-secondary" onclick="dashApp.navigate('series')">
                📺 Browse Series
              </button>
            </div>
          </div>
        </div>

        <!-- Featured Movies -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Featured Movies</h2>
            <span class="section-link" onclick="dashApp.navigate('movies')">See all →</span>
          </div>
          <div class="content-grid">
            ${this.renderContentGrid(featuredMovies, 'movie')}
          </div>
        </div>

        <!-- Featured Series -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Featured Series</h2>
            <span class="section-link" onclick="dashApp.navigate('series')">See all →</span>
          </div>
          <div class="content-grid">
            ${this.renderContentGrid(featuredSeries, 'series')}
          </div>
        </div>
      </div>
    `
  }

  async renderMoviesPage() {
    const categories = this.state.categories.vod

    let movies = []
    try {
      movies = await this.client.getVODStreams(this.state.selectedCategory)
    } catch (error) {
      console.error('Failed to load movies:', error)
    }

    return `
      <div class="fade-in">
        <h1>🎬 Movies</h1>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">
          Browse through 57,000+ movies including the latest releases
        </p>

        <!-- Category Filter -->
        <div class="category-filter">
          <div class="category-chip ${!this.state.selectedCategory ? 'active' : ''}"
               onclick="dashApp.filterByCategory(null, 'vod')">
            All Movies
          </div>
          ${categories.map(cat => `
            <div class="category-chip ${this.state.selectedCategory === cat.category_id ? 'active' : ''}"
                 onclick="dashApp.filterByCategory('${cat.category_id}', 'vod')">
              ${cat.category_name}
            </div>
          `).join('')}
        </div>

        <!-- Movies Grid -->
        <div class="content-grid">
          ${this.renderContentGrid((movies || []).slice(0, 100), 'movie')}
        </div>

        ${(movies || []).length > 100 ? `
          <div class="text-center mt-lg">
            <button class="btn btn-outline" onclick="dashApp.loadMore()">
              Load More
            </button>
          </div>
        ` : ''}
      </div>
    `
  }

  async renderSeriesPage() {
    const categories = this.state.categories.series

    let series = []
    try {
      series = await this.client.getSeries(this.state.selectedCategory)
    } catch (error) {
      console.error('Failed to load series:', error)
    }

    return `
      <div class="fade-in">
        <h1>📺 Series</h1>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">
          14,324 Series - Netflix, Prime, HBO Max and more
        </p>

        <!-- Category Filter -->
        <div class="category-filter">
          <div class="category-chip ${!this.state.selectedCategory ? 'active' : ''}"
               onclick="dashApp.filterByCategory(null, 'series')">
            All Series
          </div>
          ${categories.map(cat => `
            <div class="category-chip ${this.state.selectedCategory === cat.category_id ? 'active' : ''}"
                 onclick="dashApp.filterByCategory('${cat.category_id}', 'series')">
              ${cat.category_name}
            </div>
          `).join('')}
        </div>

        <!-- Series Grid -->
        <div class="content-grid">
          ${this.renderContentGrid((series || []).slice(0, 100), 'series')}
        </div>
      </div>
    `
  }

  async renderLiveTVPage() {
    const categories = this.state.categories.live

    let channels = []
    try {
      channels = await this.client.getLiveStreams(this.state.selectedCategory)
    } catch (error) {
      console.error('Failed to load live TV:', error)
    }

    return `
      <div class="fade-in">
        <h1>📡 Live TV</h1>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">
          Watch live TV channels from around the world
        </p>

        <!-- Category Filter -->
        <div class="category-filter">
          <div class="category-chip ${!this.state.selectedCategory ? 'active' : ''}"
               onclick="dashApp.filterByCategory(null, 'live')">
            All Channels
          </div>
          ${categories.map(cat => `
            <div class="category-chip ${this.state.selectedCategory === cat.category_id ? 'active' : ''}"
                 onclick="dashApp.filterByCategory('${cat.category_id}', 'live')">
              ${cat.category_name}
            </div>
          `).join('')}
        </div>

        <!-- Channels Grid -->
        <div class="content-grid">
          ${this.renderContentGrid((channels || []).slice(0, 100), 'live')}
        </div>
      </div>
    `
  }

  renderAccountPage() {
    const username = localStorage.getItem('dash_user') || 'User'

    return `
      <div class="fade-in">
        <h1>👤 Account</h1>

        <div class="card p-lg mt-md">
          <h3>Logged in as</h3>
          <p style="color: var(--primary-purple); font-size: 1.5rem; font-weight: bold;">${username}</p>
        </div>

        <div class="card p-lg mt-md">
          <h3>Subscription Status</h3>
          <p style="color: var(--text-secondary);">Active</p>
          <div class="badge badge-new mt-sm">Premium Access</div>
        </div>

        <div class="card p-lg mt-md">
          <h3>Session</h3>
          <button class="btn btn-outline" onclick="dashApp.logout()" style="margin-top: 1rem;">
            🚪 Logout
          </button>
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
      const poster = item.stream_icon || item.cover || '/assets/placeholder.svg'
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

  // ============================================
  // CONTENT DETAILS & PLAYBACK
  // ============================================

  async showDetails(id, type) {
    console.log(`Showing details for ${type}:`, id)

    let details = null

    try {
      if (type === 'movie') {
        details = await this.client.getVODInfo(id)
      } else if (type === 'series') {
        details = await this.client.getSeriesInfo(id)
      }
    } catch (error) {
      console.error('Failed to load details:', error)
      this.showError('Failed to load content details')
      return
    }

    const extension = details?.info?.container_extension || details?.movie_data?.container_extension || 'mp4'

    let modalContent = ''

    if (type === 'movie') {
      modalContent = `
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="dashApp.playContent('${id}', 'movie', '${extension}')">
            ▶️ Play Now
          </button>
          <button class="btn btn-outline" onclick="dashApp.addToFavorites('${id}', 'movie')">
            ❤️ Add to Favorites
          </button>
        </div>
      `
    } else if (type === 'series' && details?.episodes) {
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
    }

    const modalHTML = `
      <div class="modal-overlay">
        <div class="modal">
          <button class="modal-close" onclick="dashApp.closeModal()">×</button>

          <div class="modal-header">
            <img src="${details?.info?.cover || '/assets/placeholder.svg'}" alt="${details?.info?.name}"
                 class="modal-header-bg" onerror="this.onerror=null;this.src='/assets/placeholder.svg'">
            <div class="modal-header-overlay">
              <h1 class="modal-title">${details?.info?.name || 'Untitled'}</h1>
              <div class="modal-meta">
                ${details?.info?.releaseDate ? `<span>📅 ${details.info.releaseDate}</span>` : ''}
                ${details?.info?.rating ? `<span>⭐ ${details.info.rating}</span>` : ''}
                ${type === 'series' ? `<span>📺 ${Object.keys(details?.episodes || {}).length} Seasons</span>` : ''}
                ${details?.info?.duration ? `<span>⏱️ ${details.info.duration}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="modal-body">
            <p class="modal-description">${details?.info?.plot || 'No description available.'}</p>
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

    // ALWAYS use HLS (.m3u8) for cross-browser compatibility
    // Server will transcode on-demand if needed
    if (type === 'movie') {
      console.log('🎬 Using HLS stream for movie (universal browser support)')
      streamUrl = this.client.buildVODUrl(id, 'm3u8')
    } else if (type === 'live') {
      console.log('🔴 Building Live TV HLS stream URL...')
      streamUrl = this.client.buildLiveStreamUrl(id, 'm3u8')
    }

    console.log('Stream URL:', streamUrl)
    this.closeModal()
    this.showVideoPlayer(streamUrl, type)
  }

  playEpisode(episodeId, extension = 'mp4') {
    console.log(`📺 Playing episode: ${episodeId}, Original format: ${extension}`)

    // ALWAYS use HLS (.m3u8) for cross-browser compatibility
    console.log('📺 Using HLS stream for episode (universal browser support)')
    const streamUrl = this.client.buildSeriesUrl(episodeId, 'm3u8')
    console.log('Stream URL:', streamUrl)

    this.closeModal()
    this.showVideoPlayer(streamUrl, 'series')
  }

  showVideoPlayer(streamUrl, type = 'movie', originalFormat = null) {
    console.log('🎬 Playing stream:', streamUrl)

    const isHLS = streamUrl.includes('.m3u8') || type === 'live'

    console.log('📹 Stream type:', isHLS ? 'HLS' : 'Direct', '| URL:', streamUrl)

    const playerHTML = `
      <div class="video-player-container">
        <button class="modal-close" onclick="dashApp.closeVideoPlayer()">×</button>
        <video id="dashPlayer" class="video-js vjs-big-play-centered vjs-default-skin" controls autoplay playsinline width="100%" height="100%">
        </video>
      </div>
    `

    this.elements.videoPlayerContainer.innerHTML = playerHTML

    // Dispose previous player if exists
    if (this.currentPlayer) {
      try {
        this.currentPlayer.dispose()
      } catch (e) {
        console.warn('Player dispose warning:', e)
      }
      this.currentPlayer = null
    }

    const videoEl = document.getElementById('dashPlayer')

    if (typeof videojs !== 'undefined') {
      // Initialize Video.js with cross-browser settings
      this.currentPlayer = videojs('dashPlayer', {
        fluid: true,
        responsive: true,
        controls: true,
        autoplay: true,
        preload: 'auto',
        techOrder: ['html5'],
        html5: {
          vhs: {
            overrideNative: !videojs.browser.IS_SAFARI,
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            handlePartialData: true
          },
          nativeVideoTracks: videojs.browser.IS_SAFARI,
          nativeAudioTracks: videojs.browser.IS_SAFARI,
          nativeTextTracks: videojs.browser.IS_SAFARI
        },
        sources: [{
          src: streamUrl,
          type: isHLS ? 'application/x-mpegURL' : 'video/mp4'
        }]
      })

      this.currentPlayer.ready(() => {
        console.log('✅ Video.js player ready!')
        this.currentPlayer.play().catch(err => {
          console.warn('⚠️ Autoplay blocked:', err.message)
        })
      })

      // Error handling with fallback
      this.currentPlayer.on('error', () => {
        const error = this.currentPlayer.error()
        console.error('❌ Player error:', error)

        // Try fallback: native HTML5 video
        if (error && !isHLS) {
          console.log('🔄 Trying native HTML5 fallback...')
          this.tryNativePlayer(streamUrl)
        } else {
          alert('⚠️ Unable to play this video. The stream may be unavailable.')
        }
      })
    } else {
      // Fallback: pure HTML5 video
      this.tryNativePlayer(streamUrl)
    }
  }

  tryNativePlayer(streamUrl) {
    console.log('🎬 Using native HTML5 player for:', streamUrl)

    const playerHTML = `
      <div class="video-player-container">
        <button class="modal-close" onclick="dashApp.closeVideoPlayer()">×</button>
        <video id="nativePlayer" controls autoplay playsinline style="width:100%;height:100%;background:#000;">
          <source src="${streamUrl}" type="video/mp4">
          Your browser does not support video playback.
        </video>
      </div>
    `
    this.elements.videoPlayerContainer.innerHTML = playerHTML

    const video = document.getElementById('nativePlayer')
    video.onerror = () => {
      console.error('❌ Native player also failed')
      alert('⚠️ Unable to play this video. Try a different title.')
    }
  }

  closeVideoPlayer() {
    if (this.currentPlayer) {
      try {
        this.currentPlayer.pause()
        this.currentPlayer.dispose()
        this.currentPlayer = null
      } catch (error) {
        console.error('Error disposing player:', error)
      }
    }
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
    console.log('Search query:', this.state.searchQuery)
  }

  addToFavorites(id, type) {
    console.log('Added to favorites:', id, type)
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
