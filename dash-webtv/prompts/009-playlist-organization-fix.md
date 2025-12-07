# Meta-Prompt: Playlist Organization and Loading Fixes

## Context
You are fixing ALL playlist issues in DASH WebTV - loading failures, poor organization, missing categories, and display problems.

## Project Location
- Frontend: `/home/dash/zion-github/dash-webtv/`
- Backend: `/home/dash/zion-github/dash-streaming-server/`
- Data: `/home/dash/zion-github/dash-webtv/data/`

## Critical Issues to Fix

### 1. Live TV Playlist Organization
**File:** `/home/dash/zion-github/dash-webtv/data/live.json`

**Problems:**
- 81,000+ channels in single file
- No category hierarchy
- Mixed quality channels
- Dead channels mixed with working ones
- Poor alphabetical sorting

**Tasks:**
1. Read current live.json structure
2. Create category-based organization:
   - Guinea Local (priority)
   - West Africa
   - French Channels
   - Sports
   - News
   - Entertainment
   - Kids
   - Religious
   - Music
3. Add quality indicators (HD, SD, 4K)
4. Add working status flag
5. Sort within categories alphabetically

### 2. Movies Playlist Organization
**File:** `/home/dash/zion-github/dash-webtv/data/movies.json`

**Tasks:**
1. Organize by genre
2. Add release year grouping
3. Add quality indicators
4. Add popularity sorting option
5. Ensure poster URLs are valid

### 3. Series Playlist Organization
**File:** `/home/dash/zion-github/dash-webtv/data/series.json`

**Tasks:**
1. Organize by genre
2. Add season/episode count
3. Group by completion status (Ongoing vs Complete)
4. Add popularity sorting

### 4. Frontend Category Display
**File:** `/home/dash/zion-github/dash-webtv/js/app.js`

**Problems:**
- Categories load but display is inconsistent
- No loading states
- Empty categories still shown
- Category counts are wrong

**Tasks:**
1. Find category rendering code
2. Add loading spinners
3. Hide empty categories
4. Fix category counts
5. Add "All" category that works
6. Add smooth transitions between categories

### 5. Backend Category Endpoints
**File:** `/home/dash/zion-github/dash-streaming-server/src/routes/secure-api.js`

**Tasks:**
1. Add category filtering endpoint
2. Add pagination support
3. Add sorting options (alphabetical, popularity, recent)
4. Cache category responses

### 6. Featured Content Section
**Frontend:** Add prominent featured section

**Tasks:**
1. Create "Featured Today" row
2. Create "Trending Now" row
3. Create "Continue Watching" row
4. Create "New Releases" row
5. Randomize featured content daily

### 7. Channel Icons and Posters
**Problems:**
- Many channels missing icons
- Broken image URLs
- No fallback images

**Tasks:**
1. Add fallback icon for missing channel logos
2. Add poster placeholder for movies/series
3. Lazy load images for performance
4. Add image error handling

## Data Structure Recommendations

### Live Channel Format:
```json
{
  "id": "channel_123",
  "name": "Africa 24",
  "category": "news",
  "region": "africa",
  "country": "gn",
  "language": "fr",
  "quality": "HD",
  "status": "working",
  "priority": 1,
  "logo": "https://...",
  "url": "https://..."
}
```

### Category Hierarchy:
```
Guinea Local (20 channels) - PRIORITY
├── RTG
├── Evasion TV
└── ...

West Africa (50 channels)
├── NCI
├── RTI
└── ...

French (169 channels)
├── TF1
├── France 2
└── ...

Sports (200 channels)
├── beIN Sports
├── ESPN
└── ...
```

## Implementation Order
1. Add loading states (immediate visual fix)
2. Hide empty categories
3. Fix category counts
4. Add image fallbacks
5. Reorganize data files
6. Add featured section

## Verification
1. Navigate to Live TV - all categories should load
2. Click each category - content should display
3. No "undefined" or broken entries
4. Images load or show placeholder
5. Category counts match actual content
6. Featured content displays properly

## Output
Return:
- Files modified
- Categories reorganized
- Image handling improved
- Loading states added
- Featured section implemented
