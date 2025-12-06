# Meta-Prompt: French VOD Integration Completion

## Context
You are completing the French VOD integration for DASH WebTV. The audit showed 74% completion with working providers (Vixsrc, MP4Hydra) but missing UI polish and 8 non-functional providers.

## Project Location
- Backend: `/home/dash/zion-github/dash-streaming-server/`
- French VOD Service: `src/services/french-vod.service.js`
- Stream Extractor: `src/services/stream-extractor.service.js` (30,153 lines)
- Frontend: `/home/dash/zion-github/dash-webtv/js/app.js` (renderFrenchPage function)

## Current State

### Working Providers
| Provider | Method | Format | Speed |
|----------|--------|--------|-------|
| Vixsrc | HLS extraction | m3u8 | Fast |
| MP4Hydra | Direct download | MP4 | Medium |

### Non-Functional Providers (8)
Need to audit and either fix or remove:
1. StreamSB - API changed
2. Doodstream - Timeout
3. Mixdrop - CORS blocked
4. Upstream - SSL error
5. VidSrc - Rate limited
6. 2embed - Blocked
7. GogoAnime - Different format
8. Filemoon - Requires captcha

## Tasks

### 1. Add French Navigation Tab (CRITICAL)
**File**: `/home/dash/zion-github/dash-webtv/index.html`
**Issue**: French VOD section exists but NO navigation tab in HTML

```html
<!-- Add to navigation tabs -->
<nav class="nav-tabs" role="navigation">
  <button class="nav-tab" data-page="home">Home</button>
  <button class="nav-tab" data-page="movies">Movies</button>
  <button class="nav-tab" data-page="series">Series</button>
  <button class="nav-tab" data-page="live">Live TV</button>
  <button class="nav-tab" data-page="french">French TV</button>  <!-- ADD THIS -->
  <button class="nav-tab" data-page="search">Search</button>
</nav>
```

**Wire up in app.js**:
```javascript
// In navigation handler
case 'french':
  renderFrenchPage();
  break;
```

### 2. Improve French Movie Grid Layout
**File**: `/home/dash/zion-github/dash-webtv/js/app.js` - renderFrenchPage()
**Issue**: Basic UI, needs parity with main movie browse

**Current**:
```javascript
function renderFrenchPage() {
  // Basic implementation
}
```

**Improved**:
```javascript
async function renderFrenchPage() {
  const container = document.getElementById('mainContent');
  container.innerHTML = `
    <div class="french-vod-page">
      <header class="page-header">
        <h1>French Movies & TV</h1>
        <div class="french-filters">
          <select id="frenchGenre" class="filter-select">
            <option value="">All Genres</option>
            <option value="28">Action</option>
            <option value="35">Comedy</option>
            <option value="18">Drama</option>
            <option value="27">Horror</option>
            <option value="10749">Romance</option>
            <option value="878">Sci-Fi</option>
          </select>
          <select id="frenchYear" class="filter-select">
            <option value="">All Years</option>
            ${generateYearOptions()}
          </select>
          <input type="search" id="frenchSearch" placeholder="Search French movies..." class="search-input">
        </div>
      </header>

      <section class="trending-section">
        <h2>Trending in France</h2>
        <div class="movie-carousel" id="frenchTrending"></div>
      </section>

      <section class="browse-section">
        <h2>Browse All</h2>
        <div class="movie-grid" id="frenchMovieGrid"></div>
      </section>

      <div class="load-more-container">
        <button id="loadMoreFrench" class="load-more-btn">Load More</button>
      </div>
    </div>
  `;

  // Load initial content
  await loadFrenchTrending();
  await loadFrenchMovies(1);

  // Wire up filters
  document.getElementById('frenchGenre').onchange = () => filterFrenchMovies();
  document.getElementById('frenchYear').onchange = () => filterFrenchMovies();
  document.getElementById('frenchSearch').oninput = debounce(searchFrenchMovies, 500);
  document.getElementById('loadMoreFrench').onclick = loadMoreFrenchMovies;
}
```

### 3. Add French Movie Search
```javascript
async function searchFrenchMovies() {
  const query = document.getElementById('frenchSearch').value;
  if (query.length < 2) return;

  const grid = document.getElementById('frenchMovieGrid');
  grid.innerHTML = '<div class="loading">Searching...</div>';

  try {
    const response = await fetch(`/api/french-vod/search?query=${encodeURIComponent(query)}`);
    const results = await response.json();

    if (results.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No French movies found for "${query}"</h3>
          <p>Try different keywords</p>
        </div>
      `;
      return;
    }

    renderFrenchMovieGrid(results);
  } catch (error) {
    grid.innerHTML = '<div class="error">Search failed. Please try again.</div>';
  }
}
```

### 4. Improve Poster Loading
**Issue**: Posters load slowly, no placeholder

```javascript
function createFrenchMovieCard(movie) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : '/assets/no-poster.jpg';

  return `
    <div class="movie-card french-card" data-id="${movie.id}">
      <div class="poster-container">
        <img
          class="movie-poster"
          src="/assets/poster-placeholder.jpg"
          data-src="${posterUrl}"
          alt="${movie.title}"
          loading="lazy"
          onerror="this.src='/assets/no-poster.jpg'"
        >
        <div class="poster-overlay">
          <button class="play-btn" onclick="playFrenchMovie(${movie.id})">
            <svg class="play-icon">...</svg>
          </button>
        </div>
      </div>
      <div class="movie-info">
        <h3 class="movie-title">${movie.title}</h3>
        <div class="movie-meta">
          <span class="year">${movie.release_date?.split('-')[0] || 'N/A'}</span>
          <span class="rating">${movie.vote_average?.toFixed(1) || 'N/A'}</span>
        </div>
      </div>
    </div>
  `;
}

// Lazy load posters with Intersection Observer
function initPosterLazyLoad() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '100px' });

  document.querySelectorAll('.movie-poster[data-src]').forEach(img => {
    observer.observe(img);
  });
}
```

### 5. Add Category Filtering
```javascript
async function filterFrenchMovies() {
  const genre = document.getElementById('frenchGenre').value;
  const year = document.getElementById('frenchYear').value;

  const params = new URLSearchParams();
  if (genre) params.append('genre', genre);
  if (year) params.append('year', year);
  params.append('language', 'fr');

  const response = await fetch(`/api/french-vod/discover?${params}`);
  const movies = await response.json();

  renderFrenchMovieGrid(movies);
}
```

### 6. Fix Provider Fallback System
**File**: `/home/dash/zion-github/dash-streaming-server/src/services/french-vod.service.js`

```javascript
const PROVIDER_PRIORITY = [
  { name: 'vixsrc', enabled: true },
  { name: 'mp4hydra', enabled: true },
  { name: 'vidzee', enabled: false }, // Audit showed 0% success
  // ... others disabled
];

async function getStreamUrl(tmdbId) {
  for (const provider of PROVIDER_PRIORITY.filter(p => p.enabled)) {
    try {
      console.log(`[French VOD] Trying ${provider.name}...`);
      const result = await providers[provider.name].getStream(tmdbId);

      if (result && result.url) {
        // Verify URL actually works
        const testResponse = await fetch(result.url, { method: 'HEAD', timeout: 5000 });
        if (testResponse.ok) {
          console.log(`[French VOD] Success with ${provider.name}`);
          return { ...result, provider: provider.name };
        }
      }
    } catch (error) {
      console.log(`[French VOD] ${provider.name} failed: ${error.message}`);
      continue;
    }
  }

  throw new Error('No working provider found');
}
```

### 7. Add French Live TV Section
**Current**: 169 French channels from iptv-org
**Integrate into French page**:

```javascript
async function loadFrenchLiveTV() {
  const response = await fetch('/api/free/channels?country=FR');
  const channels = await response.json();

  const container = document.getElementById('frenchLiveTV');
  container.innerHTML = channels.map(ch => `
    <div class="live-channel-card" onclick="playLiveChannel('${ch.id}')">
      <img src="${ch.logo || '/assets/channel-placeholder.png'}" alt="${ch.name}">
      <span class="channel-name">${ch.name}</span>
      <span class="live-badge">LIVE</span>
    </div>
  `).join('');
}
```

### 8. Backend Endpoints to Verify/Create

```javascript
// /api/french-vod/search
router.get('/search', async (req, res) => {
  const { query } = req.query;
  const results = await tmdbService.searchFrenchMovies(query);
  res.json(results);
});

// /api/french-vod/discover
router.get('/discover', async (req, res) => {
  const { genre, year, page = 1 } = req.query;
  const results = await tmdbService.discoverFrenchMovies({ genre, year, page });
  res.json(results);
});

// /api/french-vod/trending
router.get('/trending', async (req, res) => {
  const results = await tmdbService.getFrenchTrending();
  res.json(results);
});

// /api/french-vod/stream/:tmdbId
router.get('/stream/:tmdbId', async (req, res) => {
  const { tmdbId } = req.params;
  const streamUrl = await frenchVodService.getStreamUrl(tmdbId);
  res.json(streamUrl);
});
```

## CSS Additions

```css
/* French VOD specific styles */
.french-vod-page {
  padding: 20px;
}

.french-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.filter-select {
  background: var(--surface-dark);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  border-radius: 4px;
}

.french-card {
  transition: transform 0.2s ease;
}

.french-card:hover {
  transform: scale(1.05);
}

.live-badge {
  background: #e50914;
  color: white;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: bold;
}
```

## Success Criteria
- [ ] French tab visible in navigation
- [ ] French movies load with proper posters
- [ ] Search works and shows results
- [ ] Genre/Year filters work
- [ ] Movie cards match main browse style
- [ ] Playback works through Vixsrc/MP4Hydra
- [ ] French live TV channels accessible
- [ ] Empty states for no results

## Testing
1. Click French tab - page loads
2. Search "Le" - results appear
3. Filter by Comedy - grid updates
4. Click movie - stream plays
5. Scroll - posters lazy load
6. Click Live TV channel - stream plays

## DO NOT
- Do not try to fix non-functional providers (just disable them)
- Do not modify TMDB API calls (they work)
- Do not change video player logic
- Do not add authentication to French VOD (free tier)

## Output
When complete, provide:
1. HTML changes to index.html
2. New/modified functions in app.js
3. CSS additions
4. Backend endpoints verified/created
5. Screenshot or description of French page layout
