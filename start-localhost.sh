#!/bin/bash

# ZION - Start All Servers for Localhost

echo "🚀 Starting ZION servers..."
echo ""

# Kill any existing processes
pkill -f "node.*server.js" 2>/dev/null
pkill -f "node.*vite" 2>/dev/null
sleep 1

# Start API server
echo "📡 Starting API server (port 3001)..."
cd /home/user/ZION/learning-api
node server.js > /tmp/zion-api.log 2>&1 &
API_PID=$!
echo "   API PID: $API_PID"

# Wait for API to start
sleep 2

# Start Web App
echo "🎨 Starting Web App (port 5173)..."
cd /home/user/ZION/web-app
npm run dev > /tmp/zion-web.log 2>&1 &
WEB_PID=$!
echo "   Web PID: $WEB_PID"

# Wait for servers to start
echo ""
echo "⏳ Waiting for servers to start..."
sleep 5

# Check if running
echo ""
echo "🔍 Checking status..."

if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API server: RUNNING (http://localhost:3001)"
else
    echo "❌ API server: FAILED"
    echo "   Check logs: tail -f /tmp/zion-api.log"
fi

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Web app: RUNNING (http://localhost:5173)"
else
    echo "❌ Web app: FAILED"
    echo "   Check logs: tail -f /tmp/zion-web.log"
fi

echo ""
echo "🎉 ZION is ready!"
echo ""
echo "📱 Open in browser: http://localhost:5173"
echo "📊 API endpoint: http://localhost:3001"
echo ""
echo "📝 View logs:"
echo "   API:  tail -f /tmp/zion-api.log"
echo "   Web:  tail -f /tmp/zion-web.log"
echo ""
echo "⏹️  To stop:"
echo "   pkill -f 'node.*server.js'"
echo "   pkill -f 'node.*vite'"
echo ""
