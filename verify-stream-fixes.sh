#!/bin/bash
echo "=========================================="
echo "DASH WebTV - Stream Fixes Verification"
echo "=========================================="
echo ""

echo "1. Backend Retry Logic"
echo "   Location: dash-streaming-server/src/services/stream-extractor.service.js"
grep -c "retryWithBackoff" /home/dash/zion-github/dash-streaming-server/src/services/stream-extractor.service.js
echo "   retryWithBackoff calls found"
echo ""

echo "2. Backend Timeout Changes (15000ms → 30000ms)"
echo "   Location: dash-streaming-server/src/services/stream-extractor.service.js"
grep -c "timeout.*30000" /home/dash/zion-github/dash-streaming-server/src/services/stream-extractor.service.js
echo "   30-second timeouts found"
echo ""

echo "3. Frontend Timeout Changes"
echo "   Location: dash-webtv/js/app.js"
grep -c "xhr.timeout = 30000" /home/dash/zion-github/dash-webtv/js/app.js
echo "   HLS timeout increased"
echo ""

echo "4. Test Stream Extraction"
echo "   Testing Fight Club (TMDB ID 550)..."
curl -s http://localhost:3001/api/french-vod/stream/movie/550 | python3 -c "import sys, json; data=json.load(sys.stdin); print('   Success:', data['success']); print('   Provider:', data['stream']['provider']); print('   Format:', data['stream']['format'])"
echo ""

echo "5. Helper Files Created"
echo "   - /home/dash/zion-github/dash-webtv/js/stream-retry-helper.js"
ls -lh /home/dash/zion-github/dash-webtv/js/stream-retry-helper.js 2>/dev/null | awk '{print "     " $9 " (" $5 ")"}'
echo "   - /home/dash/zion-github/dash-webtv/STREAM_FIXES_PATCH.md"
ls -lh /home/dash/zion-github/dash-webtv/STREAM_FIXES_PATCH.md 2>/dev/null | awk '{print "     " $9 " (" $5 ")"}'
echo "   - /home/dash/zion-github/PRODUCTION_STREAM_FIXES_SUMMARY.md"
ls -lh /home/dash/zion-github/PRODUCTION_STREAM_FIXES_SUMMARY.md 2>/dev/null | awk '{print "     " $9 " (" $5 ")"}'
echo ""

echo "=========================================="
echo "Verification Complete!"
echo "=========================================="
