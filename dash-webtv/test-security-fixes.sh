#!/bin/bash
# Security Fixes Test Script
# Tests all 5 security fixes for DASH WebTV

echo "========================================="
echo "DASH WebTV Security Fixes Test Suite"
echo "========================================="
echo ""

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
ADMIN_KEY="${ADMIN_API_KEY:-test_admin_key}"

echo "Backend URL: $BACKEND_URL"
echo ""

# Test 1: XSS Prevention (frontend test - manual)
echo "Test 1: XSS Prevention in Search"
echo "---------------------------------"
echo "✓ Manual Test Required:"
echo "  1. Open frontend in browser"
echo "  2. Search for: <script>alert('xss')</script>"
echo "  3. Verify text is escaped (shows as &lt;script&gt;...)"
echo ""

# Test 2: Config Validation
echo "Test 2: Hardcoded Credentials Removed"
echo "--------------------------------------"
grep -n "AzizTest1\|Test1" /home/dash/zion-github/dash-streaming-server/src/config.js
if [ $? -eq 0 ]; then
    echo "✗ FAIL: Hardcoded credentials still present!"
else
    echo "✓ PASS: No hardcoded credentials found"
fi
echo ""

# Test 3: Admin Key Security
echo "Test 3: Admin Endpoints Security"
echo "---------------------------------"

# Test without admin key
echo "3a. Testing admin endpoint WITHOUT admin key..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/admin/stats")
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "503" ]; then
    echo "✓ PASS: Rejected (HTTP $RESPONSE)"
else
    echo "✗ FAIL: Should return 401/503, got HTTP $RESPONSE"
fi

# Test with wrong admin key
echo "3b. Testing admin endpoint WITH WRONG admin key..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "x-admin-key: wrongkey" "$BACKEND_URL/api/admin/stats")
if [ "$RESPONSE" = "401" ]; then
    echo "✓ PASS: Rejected (HTTP $RESPONSE)"
else
    echo "✗ FAIL: Should return 401, got HTTP $RESPONSE"
fi

# Test with correct admin key (if set)
if [ -n "$ADMIN_API_KEY" ]; then
    echo "3c. Testing admin endpoint WITH CORRECT admin key..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "x-admin-key: $ADMIN_KEY" "$BACKEND_URL/api/admin/stats")
    if [ "$RESPONSE" = "200" ]; then
        echo "✓ PASS: Accepted (HTTP $RESPONSE)"
    else
        echo "✗ FAIL: Should return 200, got HTTP $RESPONSE"
    fi
else
    echo "3c. SKIP: ADMIN_API_KEY not set"
fi
echo ""

# Test 4: Stream Authentication
echo "Test 4: Stream Endpoint Authentication"
echo "---------------------------------------"

# Test without username
echo "4a. Testing stream endpoint WITHOUT username..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/stream/vod/12345")
if [ "$RESPONSE" = "401" ]; then
    echo "✓ PASS: Rejected (HTTP $RESPONSE)"
else
    echo "✗ FAIL: Should return 401, got HTTP $RESPONSE"
fi

# Test with invalid username
echo "4b. Testing stream endpoint WITH INVALID username..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Username: fake_user_12345" "$BACKEND_URL/api/stream/vod/12345")
if [ "$RESPONSE" = "401" ]; then
    echo "✓ PASS: Rejected (HTTP $RESPONSE)"
else
    echo "✗ FAIL: Should return 401, got HTTP $RESPONSE"
fi

# Test live streaming endpoint
echo "4c. Testing live endpoint WITHOUT username..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/live/54321")
if [ "$RESPONSE" = "401" ]; then
    echo "✓ PASS: Rejected (HTTP $RESPONSE)"
else
    echo "✗ FAIL: Should return 401, got HTTP $RESPONSE"
fi
echo ""

# Test 5: Wallet Admin Security
echo "Test 5: Wallet Admin Endpoint Security"
echo "---------------------------------------"

# Test without admin key
echo "5a. Testing wallet admin endpoint WITHOUT admin key..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/wallet/admin/all")
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "503" ]; then
    echo "✓ PASS: Rejected (HTTP $RESPONSE)"
else
    echo "✗ FAIL: Should return 401/503, got HTTP $RESPONSE"
fi

# Test with correct admin key (if set)
if [ -n "$ADMIN_API_KEY" ]; then
    echo "5b. Testing wallet admin endpoint WITH CORRECT admin key..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "x-admin-key: $ADMIN_KEY" "$BACKEND_URL/api/wallet/admin/all")
    if [ "$RESPONSE" = "200" ]; then
        echo "✓ PASS: Accepted (HTTP $RESPONSE)"
    else
        echo "✗ FAIL: Should return 200, got HTTP $RESPONSE"
    fi
else
    echo "5b. SKIP: ADMIN_API_KEY not set"
fi
echo ""

# Summary
echo "========================================="
echo "Test Suite Complete"
echo "========================================="
echo ""
echo "Notes:"
echo "- Frontend XSS test requires manual browser testing"
echo "- Full authentication tests require valid users in system"
echo "- Set ADMIN_API_KEY environment variable for admin tests"
echo ""
echo "To run:"
echo "  export BACKEND_URL=https://your-backend.railway.app"
echo "  export ADMIN_API_KEY=your_admin_key"
echo "  bash test-security-fixes.sh"
echo ""
