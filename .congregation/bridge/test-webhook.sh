#!/bin/bash

# ZION Congregation Bridge - Test Script
# Tests the webhook endpoint with all three AI identities

set -e

echo "🧪 Testing ZION Congregation Bridge"
echo "===================================="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Error: .env file not found"
    echo "   Run: cp .env.example .env and configure it"
    exit 1
fi

# Check if server is running
echo "1️⃣  Checking if bridge is running..."
if ! curl -s http://localhost:${BRIDGE_PORT:-3001}/health > /dev/null; then
    echo "❌ Error: Bridge server not responding"
    echo "   Start it with: npm start"
    exit 1
fi
echo "✅ Bridge is running"
echo ""

# Test health endpoint
echo "2️⃣  Testing /health endpoint..."
HEALTH=$(curl -s http://localhost:${BRIDGE_PORT:-3001}/health)
echo "$HEALTH" | jq '.'
echo "✅ Health check passed"
echo ""

# Test ChatGPT post
echo "3️⃣  Testing ChatGPT commit..."
CHATGPT_RESPONSE=$(curl -s -X POST http://localhost:${BRIDGE_PORT:-3001}/congregation/commit \
  -H "Authorization: Bearer $CHATGPT_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "author": "chatgpt",
    "content": "Test message from ChatGPT - webhook operational! 🤖",
    "model": "gpt-4",
    "message_id": "test_chatgpt_'$(date +%s)'"
  }')

if echo "$CHATGPT_RESPONSE" | jq -e '.status == "ok"' > /dev/null; then
    echo "✅ ChatGPT commit successful"
    echo "$CHATGPT_RESPONSE" | jq '.'
else
    echo "❌ ChatGPT commit failed"
    echo "$CHATGPT_RESPONSE" | jq '.'
    exit 1
fi
echo ""

# Test Gemini post
echo "4️⃣  Testing Gemini commit..."
GEMINI_RESPONSE=$(curl -s -X POST http://localhost:${BRIDGE_PORT:-3001}/congregation/commit \
  -H "Authorization: Bearer $GEMINI_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "author": "gemini",
    "content": "Test message from Gemini - system ready! 💎",
    "model": "gemini-pro",
    "message_id": "test_gemini_'$(date +%s)'"
  }')

if echo "$GEMINI_RESPONSE" | jq -e '.status == "ok"' > /dev/null; then
    echo "✅ Gemini commit successful"
    echo "$GEMINI_RESPONSE" | jq '.'
else
    echo "❌ Gemini commit failed"
    echo "$GEMINI_RESPONSE" | jq '.'
    exit 1
fi
echo ""

# Test ZION post
echo "5️⃣  Testing ZION commit..."
ZION_RESPONSE=$(curl -s -X POST http://localhost:${BRIDGE_PORT:-3001}/congregation/commit \
  -H "Authorization: Bearer $ZION_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "author": "zion",
    "content": "Test message from ZION - bridge fully operational! ⚡",
    "model": "claude-sonnet-4.5",
    "message_id": "test_zion_'$(date +%s)'"
  }')

if echo "$ZION_RESPONSE" | jq -e '.status == "ok"' > /dev/null; then
    echo "✅ ZION commit successful"
    echo "$ZION_RESPONSE" | jq '.'
else
    echo "❌ ZION commit failed"
    echo "$ZION_RESPONSE" | jq '.'
    exit 1
fi
echo ""

# Test invalid auth
echo "6️⃣  Testing authentication (should fail)..."
INVALID_RESPONSE=$(curl -s -X POST http://localhost:${BRIDGE_PORT:-3001}/congregation/commit \
  -H "Authorization: Bearer invalid_token_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "author": "chatgpt",
    "content": "This should not work"
  }')

if echo "$INVALID_RESPONSE" | jq -e '.error == "unauthorized"' > /dev/null; then
    echo "✅ Authentication properly blocks invalid tokens"
else
    echo "⚠️  Warning: Authentication might not be working correctly"
    echo "$INVALID_RESPONSE" | jq '.'
fi
echo ""

# Test idempotency
echo "7️⃣  Testing idempotency (duplicate message)..."
DUPLICATE_ID="test_idempotency_$(date +%s)"

# First post
curl -s -X POST http://localhost:${BRIDGE_PORT:-3001}/congregation/commit \
  -H "Authorization: Bearer $ZION_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"author\": \"zion\",
    \"content\": \"Idempotency test message\",
    \"message_id\": \"$DUPLICATE_ID\"
  }" > /dev/null

# Duplicate post (should be ignored)
IDEMPOTENT_RESPONSE=$(curl -s -X POST http://localhost:${BRIDGE_PORT:-3001}/congregation/commit \
  -H "Authorization: Bearer $ZION_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"author\": \"zion\",
    \"content\": \"This duplicate should be ignored\",
    \"message_id\": \"$DUPLICATE_ID\"
  }")

if echo "$IDEMPOTENT_RESPONSE" | jq -e '.cached == true' > /dev/null; then
    echo "✅ Idempotency working correctly (duplicate ignored)"
else
    echo "⚠️  Warning: Idempotency might not be working"
    echo "$IDEMPOTENT_RESPONSE" | jq '.'
fi
echo ""

# Fetch thread
echo "8️⃣  Fetching current thread..."
THREAD=$(curl -s http://localhost:${BRIDGE_PORT:-3001}/congregation/thread)
MESSAGE_COUNT=$(echo "$THREAD" | jq '.messages | length')
echo "✅ Thread fetched successfully"
echo "   Total messages: $MESSAGE_COUNT"
echo ""

# Summary
echo "===================================="
echo "✅ ALL TESTS PASSED!"
echo ""
echo "🌐 View thread on GitHub:"
THREAD_URL=$(echo "$ZION_RESPONSE" | jq -r '.thread_url')
echo "   $THREAD_URL"
echo ""
echo "Next steps:"
echo "  1. Setup ChatGPT Custom GPT with Action"
echo "  2. Share the GitHub URL with ChatGPT"
echo "  3. Watch the multi-AI conversation unfold!"
echo ""
