/**
 * DASH⚡ WebTV - Main Application
 */

class DashApp {
  constructor() {
    // Initialize Xtream Client
    this.client = new XtreamClient({
      baseUrl: 'https://starshare.cx',
      username: 'AzizTest1',
      password: 'Test1'
    })

    // App State
    this.state = {
      currentPage: 'home',
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
      pageContainer: document.getElementById('pageContainer'),
      navItems: document.querySelectorAll('.nav-item'),
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

  async init() {
    console.log('🚀 DASH WebTV initializing...')

    // Setup event listeners
    this.setupEventListeners()

    // Test connection in background (non-blocking)
    this.client.testConnection().then(result => {
      if (result.success) {
        console.log('✅ Connected to streaming server')
        console.log('📊 Account info:', result.info)
      } else {
        console.warn('⚠️ Connection test failed (might be cold start):', result.error)
      }
    }).catch(err => {
      console.warn('⚠️ Connection test error:', err)
    })

    // Load initial data (don't wait for connection test)
    await this.loadCategories()

    // Render home page
    this.navigate('home')
  }

  setupEventListeners() {
    // Navigation
    this.elements.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page
        this.navigate(page)
      })
    })

    // Logo click
    this.elements.logo.addEventListener('click', () => {
      this.navigate('home')
    })

    // Account button
    this.elements.accountBtn.addEventListener('click', () => {
      this.navigate('account')
    })

    // Search
    this.elements.searchInput.addEventListener('input', (e) => {
      this.state.searchQuery = e.target.value
      this.handleSearch()
    })

    // Close modal on overlay click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.closeModal()
      }
    })
  }

  async loadCategories() {
    try {
      console.log('📂 Loading categories...')

      // Load all categories (Focus on VOD, Live TV secondary)
      const [vodCats, seriesCats, liveCats] = await Promise.all([
        this.client.getVODCategories(),
        this.client.getSeriesCategories(),
        this.client.getLiveCategories()
      ])

      this.state.categories.vod = vodCats
      this.state.categories.series = seriesCats
      this.state.categories.live = liveCats

      console.log(`✅ Loaded ${vodCats.length} movie categories`)
      console.log(`✅ Loaded ${seriesCats.length} series categories`)
      console.log(`✅ Loaded ${liveCats.length} live TV categories (secondary)`)

    } catch (error) {
      console.error('❌ Failed to load categories:', error)
      this.showError('Failed to load categories')
    }
  }

  navigate(page) {
    // Update state
    this.state.currentPage = page

    // Update active nav item
    this.elements.navItems.forEach(item => {
      if (item.dataset.page === page) {
        item.classList.add('active')
      } else {
        item.classList.remove('active')
      }
    })

    // Render page
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

  async renderHomePage() {
    // Load featured content (first 20 movies and series)
    let featuredMovies = []
    let featuredSeries = []

    try {
      const [movies, series] = await Promise.all([
        this.client.getVODStreams(),
        this.client.getSeries()
      ])

      featuredMovies = movies.slice(0, 20)
      featuredSeries = series.slice(0, 20)
    } catch (error) {
      console.error('Failed to load featured content:', error)
    }

    return `
      <div class="fade-in">
        <!-- Hero Banner -->
        <div class="hero-banner">
          <div class="hero-banner-overlay"></div>
          <div class="hero-banner-content">
            <h1 class="hero-banner-title">Welcome to DASH⚡</h1>
            <p class="hero-banner-description">
              The African Super Hub - 57,000+ Movies, 14,000+ Series, and Live TV all in one place.
              Better than Netflix + Prime + HBO Max combined.
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

        <!-- Stats Section -->
        <div class="section">
          <div class="card card-glass p-lg text-center">
            <h2 style="margin-bottom: 1rem;">📊 The Numbers</h2>
            <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 2rem;">
              <div>
                <div style="font-size: 3rem; font-weight: bold; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">57,000+</div>
                <div style="color: var(--text-secondary);">Movies</div>
              </div>
              <div>
                <div style="font-size: 3rem; font-weight: bold; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">14,324</div>
                <div style="color: var(--text-secondary);">Series</div>
              </div>
              <div>
                <div style="font-size: 3rem; font-weight: bold; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Live TV</div>
                <div style="color: var(--text-secondary);">Channels</div>
              </div>
            </div>
            <button class="btn btn-primary mt-lg" style="font-size: 1.2rem;">
              🎁 Get Free Trial - 85 Leones/month
            </button>
          </div>
        </div>
      </div>
    `
  }

  async renderMoviesPage() {
    const categories = this.state.categories.vod

    // Load movies for selected category or all
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
          ${this.renderContentGrid(movies.slice(0, 100), 'movie')}
        </div>

        ${movies.length > 100 ? `
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
          ${this.renderContentGrid(series.slice(0, 100), 'series')}
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
          ${this.renderContentGrid(channels.slice(0, 100), 'live')}
        </div>
      </div>
    `
  }

  renderAccountPage() {
    return `
      <div class="fade-in">
        <h1>👤 Account</h1>

        <div class="card p-lg mt-md">
          <h3>Subscription Status</h3>
          <p style="color: var(--text-secondary);">DASH Light - Active</p>
          <div class="badge badge-new mt-sm">Trial Active</div>
        </div>

        <div class="card p-lg mt-md">
          <h3>Pricing</h3>
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">
            Enjoy unlimited access for just 85 Leones/month
          </p>
          <button class="btn btn-primary">Upgrade Now</button>
        </div>

        <div class="card p-lg mt-md">
          <h3>About DASH</h3>
          <p style="color: var(--text-secondary);">
            DASH⚡ - The African Super Hub<br>
            Sierra Leone's premier streaming platform<br><br>
            📧 Contact: support@dash.sl<br>
            📱 WhatsApp: +232 XX XXX XXXX
          </p>
        </div>
      </div>
    `
  }

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
      // Fallback to placeholder if no poster available
      const poster = item.stream_icon || item.cover || 'https://via.placeholder.com/300x450/1a1a2e/9d4edd?text=DASH+TV'
      const title = item.name || 'Untitled'
      const id = item.stream_id || item.series_id

      // Live TV should play directly, movies/series show details first
      const clickHandler = type === 'live'
        ? `dashApp.playContent('${id}', 'live')`
        : `dashApp.showDetails('${id}', '${type}')`;

      return `
        <div class="content-card" onclick="${clickHandler}">
          <img src="${poster}" alt="${title}" class="content-card-poster" loading="lazy"
               onerror="this.src='https://via.placeholder.com/300x450/1a1a2e/9d4edd?text=DASH+TV'">
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

    // Check category name for platform badges
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

    // Store container extension for playback
    const extension = details.info?.container_extension || details.movie_data?.container_extension || details.episodes?.[0]?.[0]?.container_extension || 'mp4'

    // Generate modal content based on type
    let modalContent = ''

    if (type === 'movie') {
      // Movie: Show simple Play button
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
    } else if (type === 'series' && details.episodes) {
      // Series: Show episodes by season
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
                    <div class="episode-card" onclick="dashApp.playContent('${id}', 'series', '${ep.container_extension || 'mp4'}', '${seasonNum}', '${ep.episode_num}')">
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
            <img src="${details.info?.cover || 'https://via.placeholder.com/300x450/1a1a2e/9d4edd?text=DASH+TV'}" alt="${details.info?.name}"
                 class="modal-header-bg">
            <div class="modal-header-overlay">
              <h1 class="modal-title">${details.info?.name || 'Untitled'}</h1>
              <div class="modal-meta">
                ${details.info?.releaseDate ? `<span>📅 ${details.info.releaseDate}</span>` : ''}
                ${details.info?.rating ? `<span>⭐ ${details.info.rating}</span>` : ''}
                ${type === 'series' ? `<span>📺 ${Object.keys(details.episodes || {}).length} Seasons</span>` : ''}
                ${details.info?.duration ? `<span>⏱️ ${details.info.duration}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="modal-body">
            <p class="modal-description">${details.info?.plot || 'No description available.'}</p>
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

  async playContent(id, type, extension = 'mp4', season = null, episode = null) {
    console.log(`Playing ${type}:`, id, `Format: ${extension}`, season ? `S${season}E${episode}` : '')

    // Browser-supported formats
    const supportedFormats = ['mp4', 'webm', 'ogg', 'm3u8', 'ts']
    const unsupportedFormats = ['mkv', 'avi', 'flv', 'wmv']

    let streamUrl = ''
    let finalExtension = extension

    if (type === 'movie') {
      // Check if format is browser-compatible
      if (unsupportedFormats.includes(extension.toLowerCase())) {
        console.warn(`⚠️ Format ${extension} not browser-compatible. Trying mp4 (some may work)...`)
        finalExtension = 'mp4'
        // Note: Server may or may not transcode - we try anyway
        // If it fails, error handler will show user-friendly message
      }
      streamUrl = this.client.buildVODUrl(id, finalExtension)
    } else if (type === 'series') {
      // Series playback requires season and episode
      if (!season || !episode) {
        console.error('❌ Series playback requires season and episode numbers')
        alert('Please select an episode to play')
        return
      }
      // Check if format is browser-compatible
      if (unsupportedFormats.includes(extension.toLowerCase())) {
        console.warn(`⚠️ Format ${extension} not browser-compatible. Trying mp4 (some may work)...`)
        finalExtension = 'mp4'
      }
      streamUrl = this.client.buildSeriesUrl(id, season, episode, finalExtension)
    } else if (type === 'live') {
      // Live TV streams - DIRECT connection (same as VOD!)
      console.log('🔴 Building DIRECT Live TV stream URL...')
      streamUrl = this.client.buildLiveStreamUrl(id, 'm3u8')
    }

    console.log('Stream URL:', streamUrl)
    this.closeModal()
    this.showVideoPlayer(streamUrl, type, extension !== finalExtension ? extension : null)
  }

  showVideoPlayer(streamUrl, type = 'movie', originalFormat = null) {
    console.log('🎬 Playing stream:', streamUrl)

    // Detect file format
    let format
    let mimeType

    // Special handling for Live TV streams (proxied through Railway backend HLS proxy)
    if (type === 'live' || streamUrl.includes('/api/live/') || streamUrl.includes('zion-production')) {
      console.log('🔴 Live TV HLS stream detected (Railway proxy with manifest rewriting)')
      format = 'm3u8'  // Backend serves HLS manifest with rewritten URLs
      mimeType = 'application/x-mpegURL'  // HLS format
    } else if (streamUrl.includes('.m3u8')) {
      // HLS streams
      format = 'm3u8'
      mimeType = 'application/x-mpegURL'
    } else {
      // Regular VOD/Series - extract format from URL
      format = streamUrl.split('.').pop().split('?')[0]

      // Set proper MIME type
      if (format === 'm3u8') {
        mimeType = 'application/x-mpegURL'  // HLS streams
      } else if (format === 'ts') {
        mimeType = 'video/mp2t'  // MPEG Transport Stream
      } else {
        mimeType = `video/${format}`  // Standard video formats (mp4, mkv, etc)
      }
    }

    console.log('📹 Format:', format)
    console.log('📹 MIME Type:', mimeType)

    // Show warning if we had to convert format
    if (originalFormat) {
      console.warn(`⚠️ Original format (${originalFormat}) converted to ${format} for browser compatibility`)
    }

    const playerHTML = `
      <div class="video-player-container">
        <button class="modal-close" onclick="dashApp.closeVideoPlayer()">×</button>
        <video id="dashPlayer" class="video-js vjs-big-play-centered" controls autoplay preload="auto" width="100%" height="100%">
          <source src="${streamUrl}" type="${mimeType}">
        </video>
      </div>
    `

    this.elements.videoPlayerContainer.innerHTML = playerHTML

    // Dispose of previous player if exists
    if (this.currentPlayer) {
      this.currentPlayer.dispose()
    }

    // Initialize Video.js player with better options
    if (typeof videojs !== 'undefined') {
      this.currentPlayer = videojs('dashPlayer', {
        fluid: true,
        responsive: true,
        controls: true,
        autoplay: true,
        preload: 'auto',
        html5: {
          vhs: {
            overrideNative: true
          },
          nativeVideoTracks: false,
          nativeAudioTracks: false,
          nativeTextTracks: false
        }
      })

      this.currentPlayer.ready(function() {
        console.log('✅ Video player ready!')
        this.play().catch(err => {
          console.error('❌ Playback error:', err)
          console.error('Format attempted:', format)
          console.error('Stream URL:', streamUrl)
        })
      })

      this.currentPlayer.on('error', (e) => {
        const error = this.currentPlayer.error()
        console.error('❌ Player error:', error)
        console.error('Error code:', error?.code)
        console.error('Error message:', error?.message)
        console.error('Format:', format)

        // Show user-friendly error
        let errorMessage = '⚠️ Unable to play this video.'
        if (originalFormat) {
          errorMessage = `⚠️ This video format (${originalFormat.toUpperCase()}) may not be supported.\n\nWe tried converting to MP4 but the server couldn't transcode it.\n\nTry another ${type === 'movie' ? 'movie' : 'video'}.`
        } else if (format === 'mkv' || format === 'avi') {
          errorMessage = `⚠️ This video format (${format.toUpperCase()}) is not supported by browsers.\n\nTry another ${type === 'movie' ? 'movie' : 'video'}.`
        } else if (error && error.code === 4) {
          errorMessage = '⚠️ Video format not supported by your browser.\n\nTry a different video.'
        }

        alert(errorMessage)
      })
    } else {
      console.error('❌ Video.js not loaded!')
    }
  }

  closeVideoPlayer() {
    // Properly dispose of Video.js player to stop playback
    if (this.currentPlayer) {
      console.log('🛑 Stopping and disposing video player...')
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

  async filterByCategory(categoryId, type) {
    this.state.selectedCategory = categoryId
    this.renderPage(this.state.currentPage)
  }

  handleSearch() {
    // TODO: Implement search functionality
    console.log('Search query:', this.state.searchQuery)
  }

  addToFavorites(id, type) {
    console.log('Added to favorites:', id, type)
    // TODO: Implement favorites
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
  window.dashApp = dashApp // Make available globally for onclick handlers
})
