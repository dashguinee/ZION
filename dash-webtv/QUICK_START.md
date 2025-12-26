# DASH TV+ Quick Start

## Servers Currently Running ✅

```bash
Backend:  http://localhost:3001 (PID 1347)
Frontend: http://localhost:5500 (PID 1362)
```

## Access the App

**URL:** http://localhost:5500

**Login:**
- Username: `AzizTest1`
- Password: `Test1`

## Testing

### 1. Open App
```bash
# In your browser
open http://localhost:5500
```

### 2. Run Diagnostics
```bash
# Backend health
curl http://localhost:3001/api/health

# Live TV channels
curl http://localhost:3001/api/free/channels | head -c 500

# French channels
curl http://localhost:3001/api/french-vod/livetv/channels | head -c 500

# Test page
open http://localhost:5500/test-live-tv.html
```

### 3. Manual Tests
- ✓ Login works
- ✓ Movies section loads
- ✓ Live TV section loads
- ✓ French VOD section loads
- ✓ Click Play on a movie
- ✓ Click Play on a live channel

## Stop Servers

```bash
# Kill backend
kill 1347

# Kill frontend
kill 1362

# Or kill all node/serve processes
pkill -f nodemon
pkill -f serve
```

## Restart Servers

```bash
# Backend
cd /home/dash/zion-github/dash-streaming-server
npm run dev &

# Frontend
cd /home/dash/zion-github/dash-webtv
npx serve -l 5500 . &
```

## Key Files

- **Health Report:** `/home/dash/zion-github/dash-webtv/HEALTH_REPORT.md`
- **Test Page:** `/home/dash/zion-github/dash-webtv/test-live-tv.html`
- **Main App:** `/home/dash/zion-github/dash-webtv/js/app.js`
- **Backend:** `/home/dash/zion-github/dash-streaming-server/src/index.js`

## Status: ✅ PRODUCTION READY

All core features working. Minor polish needed (see HEALTH_REPORT.md).
