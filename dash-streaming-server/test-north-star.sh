#!/bin/bash
# Test script for DASH WebTV North Star Features
# Run after server is deployed to test all endpoints

BASE_URL="${1:-https://zion-production-39d8.up.railway.app}"
USERNAME="testuser"

echo "🧪 Testing DASH WebTV North Star Features"
echo "📡 Base URL: $BASE_URL"
echo ""

# Test 1: Get Categories
echo "1️⃣ Testing GET /api/packages/categories"
curl -s "$BASE_URL/api/packages/categories" | jq '.categories[] | {id, name, price}'
echo ""

# Test 2: Create Package
echo "2️⃣ Testing POST /api/packages/create"
curl -s -X POST "$BASE_URL/api/packages/create" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"selectedCategories\": [\"sports\", \"french\", \"kdrama\"]}" | jq
echo ""

# Test 3: Get User Package
echo "3️⃣ Testing GET /api/packages/$USERNAME"
curl -s "$BASE_URL/api/packages/$USERNAME" | jq
echo ""

# Test 4: Get Wallet
echo "4️⃣ Testing GET /api/wallet/$USERNAME"
curl -s "$BASE_URL/api/wallet/$USERNAME" | jq
echo ""

# Test 5: Top-up Wallet (Admin Confirmed)
echo "5️⃣ Testing POST /api/wallet/$USERNAME/topup"
curl -s -X POST "$BASE_URL/api/wallet/$USERNAME/topup" \
  -H "Content-Type: application/json" \
  -d "{\"amount\": 250000, \"note\": \"Test top-up\", \"adminConfirmed\": true}" | jq
echo ""

# Test 6: Get Transaction History
echo "6️⃣ Testing GET /api/wallet/$USERNAME/history"
curl -s "$BASE_URL/api/wallet/$USERNAME/history?limit=5" | jq
echo ""

# Test 7: Monthly Deduction
echo "7️⃣ Testing POST /api/wallet/$USERNAME/deduct"
curl -s -X POST "$BASE_URL/api/wallet/$USERNAME/deduct" \
  -H "Content-Type: application/json" \
  -d "{\"amount\": 45000, \"note\": \"Monthly subscription\"}" | jq
echo ""

# Test 8: Check Balance After Deduction
echo "8️⃣ Testing GET /api/wallet/$USERNAME (after deduction)"
curl -s "$BASE_URL/api/wallet/$USERNAME" | jq '.wallet | {balance, balanceFormatted, balanceStatus}'
echo ""

echo "✅ All tests complete!"
echo ""
echo "To run against local server: ./test-north-star.sh http://localhost:3000"
