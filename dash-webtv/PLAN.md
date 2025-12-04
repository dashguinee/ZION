# DASH WebTV - Home Page & Collections Enhancement Plan

## Executive Summary
After deep diving the app, I found several issues with the home page collections and identified areas for UX improvement. This plan outlines all fixes and enhancements needed.

---

## PART 1: CRITICAL FIXES

### 1.1 Fast & Furious Collection - COMPLETELY BROKEN
**Issue**: All 20 movie IDs in `collections.json` are WRONG
- Current IDs match: "The Simpsons: The Past and the Furious", "Vietnam: Fast Forward", "Breakfast at Tiffany's", etc.
- These are NOT Fast & Furious movies!

**Fix**:
- Search movies.json for correct Fast & Furious titles
- Update `data/collections.json` with correct movie IDs
- Search terms: "fast and furious", "furious 7", "furious 8", "fate of the furious", "fast five", "fast x", "tokyo drift", "hobbs and shaw"

### 1.2 Duplicate Movies in Collections
**Issue**: Marvel "See All" page shows duplicate entries (same movie 3x)
- "Guardians of the Galaxy Vol. 3" appears 3 times
- "Avengers Endgame" appears 3 times

**Fix**:
- Add deduplication by movie name (not just stream_id) in `getCollectionMovies()`
- Multiple IDs in database for same movie with different qualities (4K, HD, Hindi dub, etc.)
- Filter duplicates based on base movie name before display

### 1.3 Wizarding World - Missing Posters (Fallbacks)
**Issue**: 2 fallback images showing "DASH WebTV" placeholder
**Fix**: Check if those movie IDs have stream_icon set, otherwise find better IDs

---

## PART 2: HOME PAGE UX IMPROVEMENTS

### 2.1 Top 10 Today Row
**Issue**: 60% fallback rate (6 of 10 images are placeholders)
**Fix**:
- Curate Top 10 with movies that have good poster images
- Add image check before including in Top 10

### 2.2 Collections with High Broken Image Rates
**Issue**: These collections have 18-20 broken images (nearly 100%):
- 007 Collection
- Netflix Originals
- 4K Ultra HD
- Horror, Comedy, Romance, Documentaries
- Bollywood, Turkish Drama, Award Winners

**Root Cause**: The movie IDs in collections.json point to movies without valid `stream_icon` URLs

**Fix**:
- Re-generate collections.json with IDs that have valid posters
- OR rely purely on keyword search (remove bad IDs, let search fill)
- Add poster validation before displaying cards

---

## PART 3: STARSHARE CONNECTION LIMITS INVESTIGATION

### 3.1 Research Questions - ANSWERED
1. How many concurrent streams does one Starshare account support? **1 connection**
2. Can the same test account be used on multiple devices simultaneously? **NO - only 1**
3. Is there a connection limit enforced by Starshare API? **YES, enforced**

### 3.2 API Response (AzizTest1 Account)
```json
{
  "user_info": {
    "username": "AzizTest1",
    "auth": 1,
    "status": "Active",
    "exp_date": "1766767764",  // ~Feb 2026
    "is_trial": "0",
    "active_cons": "0",
    "max_connections": "1",    // KEY FINDING!
    "allowed_output_formats": ["ts"]
  }
}
```

### 3.3 Key Findings
- **max_connections: 1** - Only ONE device/stream at a time
- **active_cons: 0** - Shows current active connections (0 when tested)
- **is_trial: 0** - Not a trial account
- **allowed_output_formats: ["ts"]** - Only TS format officially supported
- **Expiry**: Account valid until ~Feb 2026

### 3.4 Implications for DASH WebTV
- Each subscriber needs their OWN Starshare credentials
- Cannot share one account across multiple users/devices
- Streaming will fail if max_connections exceeded
- Consider displaying connection status in UI
- Could add check for active_cons before streaming

---

## PART 4: IMPLEMENTATION ORDER

### Phase 1: Quick Wins (30 min)
1. Fix Fast & Furious collection IDs
2. Add movie name deduplication
3. Remove/fix broken poster IDs

### Phase 2: Collection Cleanup (1 hour)
1. Audit and fix all collections with broken images
2. Re-curate Top 10 with quality posters
3. Test "See All" pages for each collection

### Phase 3: Starshare Investigation (30 min)
1. Check API response for max_connections
2. Test multi-device streaming
3. Document findings for trial strategy

---

## Files to Modify

1. `data/collections.json` - Fix movie IDs for all broken collections
2. `js/app.js` - Add deduplication logic in getCollectionMovies()
3. Documentation - Record Starshare connection findings

---

## Success Criteria

- [x] All home page collections show relevant content (no "Breakfast at Tiffany's" in Fast & Furious) - FIXED
- [x] No duplicate movies within a collection row - ADDED DEDUPLICATION
- [x] Less than 10% fallback images across all collections - ALL COLLECTIONS 100% IMAGES
- [x] Clear understanding of Starshare multi-device support - MAX 1 CONNECTION
- [ ] "See All" pages load with proper content and images - TO TEST
