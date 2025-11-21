#!/bin/bash

# ZION v2.0 Deployment Test Script
# Tests all endpoints to verify deployment

BASE_URL="${1:-https://zion-production-7fea.up.railway.app}"

echo "🧪 ZION v2.0 Deployment Test"
echo "Base URL: $BASE_URL"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3

    echo -n "Testing $name... "
    response=$(curl -s "$url")

    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Expected: $expected"
        echo "  Got: $response"
        ((FAILED++))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏥 Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Health endpoint" \
    "$BASE_URL/health" \
    "zion-unified-backend"

test_endpoint "Soussou feature enabled" \
    "$BASE_URL/health" \
    '"soussou":true'

test_endpoint "Collaboration feature enabled" \
    "$BASE_URL/health" \
    '"collaboration":true'

test_endpoint "8978 words loaded" \
    "$BASE_URL/health" \
    '"soussou_words":8978'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🇬🇳 Soussou API Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "Lookup 'fa' (to give/come)" \
    "$BASE_URL/api/soussou/lookup?word=fa" \
    '"found":true'

test_endpoint "Lookup returns English translation" \
    "$BASE_URL/api/soussou/lookup?word=fa" \
    '"english":"to give; come"'

test_endpoint "Stats endpoint" \
    "$BASE_URL/api/soussou/stats" \
    '"total_words":8978'

test_endpoint "Stats shows variants" \
    "$BASE_URL/api/soussou/stats" \
    '"total_variants"'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤝 Collaboration API Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "List sessions" \
    "$BASE_URL/api/collaborate/sessions" \
    '"total"'

test_endpoint "Sessions returns array" \
    "$BASE_URL/api/collaborate/sessions" \
    '"sessions":\['

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📨 Congregation API Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Thread endpoint may return error if file doesn't exist yet - that's ok
response=$(curl -s "$BASE_URL/congregation/thread")
if echo "$response" | grep -q "messages\|error"; then
    echo -e "Testing congregation thread... ${GREEN}✓ PASS${NC} (endpoint responsive)"
    ((PASSED++))
else
    echo -e "Testing congregation thread... ${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! ZION v2.0 is operational.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Check deployment.${NC}"
    exit 1
fi
