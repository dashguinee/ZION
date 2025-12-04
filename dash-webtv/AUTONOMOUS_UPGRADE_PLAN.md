# DASH WebTV - Autonomous Deep Upgrade Plan
## Mission: Catch up to Netflix in one session

---

## PHASE 1: DEEP CONTENT AUDIT (30 min)
**Goal**: Mine the 74K+ database for every valuable collection

### Tasks:
1. Extract ALL unique genres from movies and series
2. Find blockbuster franchises (Fast & Furious, John Wick, Mission Impossible)
3. Identify documentary content
4. Find sports/football content (HUGE in Africa)
5. Map out reality TV (Love Island, Big Brother, etc.)
6. Find music/concert content
7. Identify anime collection
8. Find faith-based/religious content
9. Map language distribution accurately

### Deliverable:
- New collections.json with 20+ curated collections
- Each collection with real IDs, not placeholders

---

## PHASE 2: SMART RECOMMENDATIONS (45 min)
**Goal**: "Because you watched X" like Netflix

### Tasks:
1. Build genre-similarity algorithm
2. Implement "More Like This" on detail pages
3. Create "Popular in [category]" sections
4. Add "Top 10 Today" dynamic collection
5. Implement viewing history tracking (localStorage)
6. Create "Continue Watching" section

### Technical:
- Store watch history in localStorage
- Track: movie_id, timestamp, progress percentage
- Algorithm: match by genre, cast, director, rating range

---

## PHASE 3: HOMEPAGE REDESIGN (60 min)
**Goal**: Netflix-level visual hierarchy

### Current Issues:
- Collections don't have clear visual hierarchy
- No "Top 10" numbering like Netflix
- Hero banner rotation not optimal

### Tasks:
1. Implement "Top 10" numbered badges
2. Add category quick-links (Movies, Series, Kids, etc.)
3. Create "Featured Today" spotlight section
4. Implement smooth infinite scroll on carousels
5. Add "New Episodes" for series
6. Create genre-based rows with smart ordering

### Visual:
- Large hero card with play button
- Numbered top 10 row
- Standard collection rows
- Special "African Stories" highlighted row

---

## PHASE 4: SEARCH ENHANCEMENT (30 min)
**Goal**: Find anything in 3 keystrokes

### Tasks:
1. Add search suggestions/autocomplete
2. Implement category filters in search
3. Add "Search by genre" quick buttons
4. Improve fuzzy matching
5. Add "No results? Try these" suggestions
6. Voice search prep (Web Speech API structure)

---

## PHASE 5: PERFORMANCE (30 min)
**Goal**: Fast on 3G networks (West Africa reality)

### Tasks:
1. Implement image lazy loading with blur placeholder
2. Add skeleton loading states
3. Implement virtual scrolling for large lists
4. Cache API responses in localStorage
5. Preload next page content
6. Optimize bundle size

---

## PHASE 6: MOBILE POLISH (30 min)
**Goal**: 80% of West Africa uses mobile

### Tasks:
1. Add swipe gestures for carousels
2. Improve touch targets (44px minimum)
3. Add pull-to-refresh
4. Optimize for slow connections
5. Add "Save for offline" prominent button
6. Bottom navigation refinement

---

## PHASE 7: QUALITY OF LIFE (30 min)
**Goal**: Keep users coming back

### Tasks:
1. "Continue Watching" with progress bar
2. "My List" / Watchlist feature
3. Episode progress tracking
4. "New Episodes" notification badges
5. Recently added section
6. "Last Watched" quick access

---

## EXECUTION ORDER:

1. **Phase 1** - CRITICAL - Know what we have
2. **Phase 7** - Quick wins - Continue watching, watchlist
3. **Phase 3** - Visual impact - Homepage redesign
4. **Phase 2** - Stickiness - Recommendations
5. **Phase 4** - Usability - Search
6. **Phase 6** - Reach - Mobile
7. **Phase 5** - Speed - Performance

---

## SUCCESS METRICS:
- [ ] 20+ functional collections
- [ ] Continue Watching working
- [ ] My List working
- [ ] Top 10 visual
- [ ] African Stories prominent
- [ ] Kids section accessible
- [ ] K-Drama discoverable
- [ ] Search finds content in <500ms
- [ ] Mobile swipe working

---

*Plan created: December 1, 2025*
*Estimated autonomous runtime: 3-4 hours*
*Model: Claude Opus 4.5*
