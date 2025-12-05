# Security Changes - December 2025

## REVERT GUIDE

If anything breaks, use this guide to revert changes.

---

## Summary of Changes

### 1. Provider URL Hidden from Frontend

**What Changed**:
- Removed hardcoded `starshare.cx` from `xtream-client.js`
- Provider URL now fetched at runtime from backend `/api/secure/patterns`

**Files Modified**:
- `/js/xtream-client.js` - Fetches patterns from backend
- `/api/login.js` - Uses `XTREAM_PROVIDER_URL` env var
- `/api/proxy.js` - Uses `XTREAM_PROVIDER_URL` env var

**To Revert**:
```bash
# Restore old xtream-client.js with hardcoded URL
git checkout 5e22312 -- js/xtream-client.js
git checkout 5e22312 -- api/login.js
git checkout 5e22312 -- api/proxy.js
```

### 2. Content Catalog Files Removed from Git

**What Changed**:
- Removed 51MB of JSON files from git (movies.json, series.json, live.json, etc.)
- Files still exist locally but excluded from deployment

**Files Removed**:
- `data/movies.json` (22MB)
- `data/series.json` (8MB)
- `data/live.json` (2MB)
- `data/movies_download_only.json`
- `data/mkv_only.json`
- `data/mkv_to_mp4.json`
- `data/episode_formats.json`
- `data/*_categories.json`

**To Revert** (if data files needed in git):
```bash
# Remove from .gitignore
nano .gitignore
# Delete the data/* lines

# Re-add files
git add data/*.json
git commit -m "Restore data files"
git push
```

### 3. Documentation Files Excluded

**What Changed**:
- Markdown files with provider details excluded from git
- Never deployed to public site

**Files Excluded**:
- SECURITY_ARCHITECTURE.md
- PLATFORM_ARCHITECTURE.md
- PROVIDER_RESEARCH.md
- ARCHITECTURE.md
- etc.

**To Revert**:
```bash
# Remove from .gitignore
nano .gitignore
# Delete the *.md lines

# Re-add files
git add *.md
git commit -m "Restore documentation"
git push
```

### 4. Free IPTV Integration Added (Backend)

**What Changed**:
- New service: `/src/services/free-iptv.service.js`
- New routes: `/src/routes/free-channels.js`
- Endpoints: `/api/free/*`

**To Revert**:
```bash
cd /home/dash/zion-github/dash-streaming-server

# Remove new files
git rm src/services/free-iptv.service.js
git rm src/routes/free-channels.js

# Revert index.js changes
git checkout e5e7d68~1 -- src/index.js

git commit -m "Remove free IPTV integration"
git push
```

---

## Commit History

| Commit | Description | Date |
|--------|-------------|------|
| `e5e7d68` | Add free IPTV integration | Dec 5, 2025 |
| `0b1fb17` | Security hardening - remove provider exposure | Dec 5, 2025 |
| `5e22312` | Last commit before security changes | Dec 5, 2025 |

---

## Environment Variables

### Vercel (dash-webtv.vercel.app)

**Added**:
```
XTREAM_PROVIDER_URL=https://starshare.cx
```

**To Remove** (if reverting):
```bash
vercel env rm XTREAM_PROVIDER_URL production
```

### Railway (dash-streaming-server)

No new env vars required - uses existing `STARSHARE_*` vars from config.

---

## Verification Commands

### Check Frontend Doesn't Expose Provider
```bash
curl -s "https://dash-webtv.vercel.app/js/xtream-client.js" | grep -c "starshare"
# Should return: 0
```

### Check Data Files Not Accessible
```bash
curl -s "https://dash-webtv.vercel.app/data/movies.json" | head -1
# Should return: "The page could not be found"
```

### Check Backend Secure Patterns
```bash
curl -s "https://zion-production-39d8.up.railway.app/api/secure/patterns"
# Should return URL patterns JSON
```

### Check Free IPTV Endpoints
```bash
curl -s "https://zion-production-39d8.up.railway.app/api/free/guinea"
# Should return Guinea channels JSON
```

---

## Rollback Commands (Full Revert)

To fully revert all December 2025 security changes:

```bash
# Frontend
cd /home/dash/zion-github/dash-webtv
git revert --no-commit 0b1fb17..HEAD
git commit -m "Revert security changes"
git push

# Backend
cd /home/dash/zion-github/dash-streaming-server
git revert --no-commit e5e7d68
git commit -m "Revert free IPTV integration"
git push

# Vercel env
vercel env rm XTREAM_PROVIDER_URL production
```

---

## What's Protected Now

| Asset | Before | After |
|-------|--------|-------|
| Provider URL | Hardcoded in JS | Fetched at runtime |
| Content catalog | In git repo | Local only |
| Documentation | In git repo | Local only |
| M3U export | Exposed provider | Disabled |

---

## Contact

If issues occur, check:
1. Railway logs: `railway logs`
2. Vercel logs: Vercel dashboard
3. Browser console for JS errors

---

*Document Created: December 5, 2025*
*Last Updated: December 5, 2025*
