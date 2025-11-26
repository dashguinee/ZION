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

    if (type === 'movie') {
      // Movies: Always use MP4 - server handles format conversion
      // Server redirects with CORS headers and serves the content
      console.log('🎬 Using MP4 stream (server handles conversion)')
      streamUrl = this.client.buildVODUrl(id, 'mp4')
    } else if (type === 'live') {
      // Live TV: Use MPEG-TS (.ts) format with mpegts.js
      console.log('🔴 Building Live TV MPEG-TS stream URL...')
      streamUrl = this.client.buildLiveStreamUrl(id, 'ts')
    }

    console.log('Stream URL:', streamUrl)
    this.closeModal()
    this.showVideoPlayer(streamUrl, type)
  }

  playEpisode(episodeId, extension = 'mp4') {
    console.log(`📺 Playing episode: ${episodeId}, Original format: ${extension}`)

    // Always request as MP4 - server handles format conversion
    // The server redirects with CORS headers and serves the content
    const streamUrl = this.client.buildSeriesUrl(episodeId, 'mp4')
    console.log('📺 Using MP4 stream (server handles conversion):', streamUrl)

    this.closeModal()
    this.showVideoPlayer(streamUrl, 'series')
  }

  showVideoPlayer(streamUrl, type = 'movie') {
    console.log('🎬 Playing stream:', streamUrl)

    const isHLS = streamUrl.includes('.m3u8') || type === 'live'
    console.log('📹 Stream type:', isHLS ? 'HLS' : 'Direct', '| URL:', streamUrl)

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

    // Detect stream type
    const isMpegTS = streamUrl.includes('.ts') || type === 'live'
    const isHLS = streamUrl.includes('.m3u8')

    if (isMpegTS) {
      this.playMpegTS(video, streamUrl, loadingEl)
    } else if (isHLS) {
      this.playHLS(video, streamUrl, loadingEl)
    } else {
      this.playDirect(video, streamUrl, loadingEl)
    }
  }

  playMpegTS(video, streamUrl, loadingEl) {
    console.log('📡 Using mpegts.js for MPEG-TS stream:', streamUrl)

    // Check if mpegts.js is available and supported
    if (typeof mpegts !== 'undefined' && mpegts.getFeatureList().mseLivePlayback) {
      console.log('✅ mpegts.js supported - using it')

      this.mpegtsPlayer = mpegts.createPlayer({
        type: 'mse',
        isLive: true,
        url: streamUrl,
        enableWorker: true,
        lazyLoadMaxDuration: 3 * 60,
        seekType: 'range'
      })

      this.mpegtsPlayer.attachMediaElement(video)
      this.mpegtsPlayer.load()

      this.mpegtsPlayer.on(mpegts.Events.LOADING_COMPLETE, () => {
        console.log('✅ MPEG-TS stream loaded')
        video.play().catch(err => {
          console.warn('⚠️ Autoplay blocked:', err.message)
          if (loadingEl) loadingEl.innerHTML = '<div>Click video to play</div>'
        })
      })

      this.mpegtsPlayer.on(mpegts.Events.ERROR, (errorType, errorDetail, errorInfo) => {
        console.error('❌ MPEG-TS Error:', errorType, errorDetail, errorInfo)
        if (loadingEl) loadingEl.innerHTML = '<div>Stream error. Try another channel.</div>'
      })

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
