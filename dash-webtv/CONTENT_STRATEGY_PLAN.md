# DASH WebTV Content Strategy & Organization Plan
## Target Market: Sierra Leone & English-Speaking West Africa

---

## MARKET RESEARCH SUMMARY

### What West Africa Watches (Based on Research)

**Competitors' Winning Strategy:**
- **Showmax** beat Netflix in Africa by focusing on **LOCAL CONTENT** - 7-9 of top 10 shows are African-produced
- **Key insight**: "Like everyone else, Africans want to hear their own languages and see themselves reflected in what they watch"
- Netflix/Prime both stopped commissioning Nollywood originals - opportunity gap!

**Popular Content Categories (Priority Order):**
1. **Nollywood/African Films** - Highest engagement (Everybody Loves Jenifa: 1.8B Naira)
2. **Hollywood Blockbusters** - Action, Thriller, Superhero (Marvel, Fast & Furious)
3. **Premium TV Series** - Game of Thrones, Breaking Bad, Squid Game, Money Heist
4. **Reality TV** - Love Island, Real Housewives of Lagos
5. **Sports Content** - Football is king in West Africa

**Top Trending Nollywood 2024:**
- Everybody Loves Jenifa (highest-grossing ever)
- A Tribe Called Judah
- Ajosepo
- Farmer's Bride
- Hijack '93
- Breath of Life (Prime Video #1)

**International Shows Popular in Africa:**
- Squid Game (Korean - massive hit)
- Money Heist (Spanish)
- Game of Thrones / House of Dragon
- Breaking Bad / Better Call Saul
- Stranger Things
- Wednesday
- The Last of Us

---

## CURRENT CONTENT AUDIT

### Movies (49,396 total)
| Category | Count | Priority |
|----------|-------|----------|
| English Content | 26,294 (53%) | HIGH |
| Indian Content | 19,999 (40%) | MEDIUM (classify separately) |
| Turkish Content | 1,630 (3%) | LOW |
| African Content | 0 | CRITICAL GAP |

### Series (14,483 total)
- Netflix: 2,344
- Amazon Prime: 1,511
- Turkish: 1,003
- African: ~11 (0.07%) - CRITICAL GAP

### Image Coverage
- With images: 93.5%
- Without images: 6.5% (3,200 items)

---

## THE ALGORITHM: Content Scoring System

### Priority Score Formula
```
PRIORITY_SCORE = (
    IMAGE_SCORE * 30 +           // Has poster image
    RATING_SCORE * 25 +          // High rating (7+)
    LANGUAGE_SCORE * 20 +        // English > Indian > Other
    YEAR_SCORE * 15 +            // Recent (2024-2025)
    POPULARITY_SCORE * 10        // In popular categories
)
```

### Image Score (30 points)
- Has high-quality TMDB image: 30
- Has any image: 20
- No image: 0

### Rating Score (25 points)
- Rating >= 8.0: 25
- Rating >= 7.0: 20
- Rating >= 6.0: 15
- Rating >= 5.0: 10
- No rating or < 5.0: 5

### Language Score (20 points)
- English (Hollywood/Netflix): 20
- African/Nollywood: 20 (same priority!)
- Turkish: 10
- Indian (Hindi/Tamil/Telugu): 8
- Other: 5

### Year Score (15 points)
- 2025: 15
- 2024: 12
- 2023: 10
- 2022: 8
- 2020-2021: 5
- Pre-2020: 3

### Popularity Boost (10 points)
- In "Blockbuster" category: +10
- In "Netflix" category: +10
- In "Oscar Winning": +8
- Has "4K" quality: +5

---

## COLLECTION REORGANIZATION

### NEW Collections Structure

**1. HERO BANNER (5-8 items)**
- Only highest-rated Hollywood 2024-2025
- Must have poster image
- Manually curated "best of best"

**2. Trending Now (Dynamic)**
- Top 30 by priority score
- Refreshes based on algorithm
- NO duplicates from other collections

**3. New Releases (2025)**
- All 2025 content
- Sorted by priority score
- English first

**4. Hollywood Hits**
- High-rated English movies
- Rating >= 7.0
- With images only

**5. Binge-Worthy Series**
- Popular TV series (GoT, Breaking Bad, etc.)
- Grouped by season
- English versions prioritized

**6. Action & Thrillers**
- Genre-filtered
- High-octane content

**7. Award Winners**
- Oscar, Emmy winners
- Premium quality content

**8. Marvel Universe**
- All superhero content
- In chronological order

**9. Netflix Originals**
- Netflix-exclusive content

**10. NEW: African Stories** (Create this!)
- Any African content found
- Real Housewives of Lagos
- Young, Famous & African
- Baddies Africa
- South African content

**11. NEW: Bollywood & Indian Cinema**
- Dedicated section for Indian content
- Not mixed with main feed
- Users who want it can find it

**12. NEW: Turkish Drama**
- Dedicated section
- Separate from main feed

**13. Kids & Family**
- Family-friendly content

**14. 4K Ultra HD**
- Premium quality

---

## VISUAL ORGANIZATION

### Neon Cards (No Image) Strategy

**Don't scatter - GROUP them intentionally:**

```
Layout Option 1: Neon Row
┌─────┬─────┬─────┬─────┐
│NEON │NEON │NEON │NEON │  <- Full row of neon cards
└─────┴─────┴─────┴─────┘

Layout Option 2: Neon Block (2x2)
┌─────┬─────┬───────────┐
│NEON │NEON │           │
├─────┼─────┤   IMAGE   │
│NEON │NEON │           │
└─────┴─────┴───────────┘
```

**Implementation:**
1. Separate content into `withImage[]` and `withoutImage[]`
2. Render `withImage` first (priority sorted)
3. After every 20 items with images, insert 4-item neon row
4. OR: Create "Hidden Gems" collection for no-image content

---

## IMPLEMENTATION PHASES

### Phase 1: Algorithm Implementation
- [ ] Create `scoreContent(item)` function in app.js
- [ ] Add scoring to movies and series
- [ ] Sort all content by priority score

### Phase 2: Collection Cleanup
- [ ] Remove duplicate IDs between collections
- [ ] Create "African Stories" collection (manual curation)
- [ ] Create "Bollywood" collection (move Indian content)
- [ ] Create "Turkish Drama" collection

### Phase 3: Visual Organization
- [ ] Implement neon card grouping
- [ ] "Load More" shows high-score content first
- [ ] Add "Images First" filter option

### Phase 4: Smart Recommendations
- [ ] "Because you watched X" (basic)
- [ ] "Popular in Sierra Leone" section
- [ ] Recently added sorting

---

## DOWNLOAD FEATURE - COMPETITIVE EDGE

**This is HUGE for West Africa:**
- Internet is unreliable/expensive
- People want to download during good connection
- Watch offline anytime

**Download Strategy:**
1. Highlight downloadable content with badge
2. "Download for Offline" collection
3. Quality selection for downloads (save data)
4. Clear storage management

---

## SUCCESS METRICS

1. **Content Discovery**: Users find what they want in <3 clicks
2. **No Dead Ends**: Every section has quality content
3. **Image Coverage**: 95%+ visible content has images
4. **Relevance**: English content surfaces first
5. **Downloads**: Track most downloaded content

---

## NEXT STEPS

1. **Implement scoring algorithm** in app.js
2. **Rebuild collections.json** with curated content
3. **Add African Stories** collection (manual research)
4. **Group neon cards** intentionally
5. **Test on mobile** (primary device in West Africa)

---

*Plan created: December 1, 2025*
*Target: Make DASH WebTV the go-to platform for Sierra Leone*
