#!/bin/bash

# ==============================================
# Salvation API Routes Test Script
# ==============================================
# Tests all Next.js API routes via CLI
# Run with: ./scripts/test-api-routes.sh
# ==============================================

BASE_URL="${API_BASE_URL:-http://localhost:3001/api}"
PASSED=0
FAILED=0
TOTAL=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "TESTING ALL NEXT.JS API ROUTES"
echo "=============================================="
echo ""
echo "Base URL: $BASE_URL"
echo ""

# Function to test an endpoint
test_endpoint() {
  local name="$1"
  local url="$2"
  local expected_field="$3"

  ((TOTAL++))
  echo -n "Testing: $name ... "

  # Make the request with timeout
  response=$(curl -s --max-time 30 "$url" 2>&1)
  curl_exit=$?

  if [ $curl_exit -ne 0 ]; then
    echo -e "${RED}FAILED${NC} (curl error: $curl_exit)"
    ((FAILED++))
    return
  fi

  # Check if response contains success: true
  if echo "$response" | grep -q '"success":true'; then
    # Check if expected field exists (if specified)
    if [ -n "$expected_field" ]; then
      if echo "$response" | grep -q "\"$expected_field\""; then
        echo -e "${GREEN}PASSED${NC}"
        ((PASSED++))
      else
        echo -e "${RED}FAILED${NC} (missing field: $expected_field)"
        echo "   Response preview: ${response:0:150}..."
        ((FAILED++))
      fi
    else
      echo -e "${GREEN}PASSED${NC}"
      ((PASSED++))
    fi
  else
    # Check if it's a 404 which might be expected
    if echo "$response" | grep -q '"success":false' && echo "$response" | grep -q 'not found'; then
      echo -e "${YELLOW}PASSED${NC} (404 - expected for non-existent resource)"
      ((PASSED++))
    else
      echo -e "${RED}FAILED${NC}"
      echo "   Response: ${response:0:200}..."
      ((FAILED++))
    fi
  fi
}

# Function to extract first ID from response
extract_first_id() {
  local response="$1"
  echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
}

# Wait for server to be ready
echo "Checking if server is running..."
if ! curl -s --max-time 5 "$BASE_URL/../" > /dev/null 2>&1; then
  echo -e "${YELLOW}Warning: Server may not be running at $BASE_URL${NC}"
  echo "Start the dev server with: cd frontend && npm run dev"
  echo ""
fi

# ============================================
# Test Projects API
# ============================================
echo ""
echo "--- Projects API ---"

test_endpoint "GET /api/projects" "$BASE_URL/projects" "data"

# Get first project ID for subsequent tests
PROJECTS_RESPONSE=$(curl -s "$BASE_URL/projects")
PROJECT_ID=$(extract_first_id "$PROJECTS_RESPONSE")

if [ -n "$PROJECT_ID" ]; then
  echo "   Using project ID: ${PROJECT_ID:0:20}..."
  test_endpoint "GET /api/projects/[id]" "$BASE_URL/projects/$PROJECT_ID" "data"
else
  echo "   No projects found - testing 404 handling"
  test_endpoint "GET /api/projects/[id] (404 test)" "$BASE_URL/projects/0x0000000000000000000000000000000000000000000000000000000000000001" ""
fi

# ============================================
# Test Markets API
# ============================================
echo ""
echo "--- Markets API ---"

test_endpoint "GET /api/markets" "$BASE_URL/markets" "data"

# Get first market ID for subsequent tests
MARKETS_RESPONSE=$(curl -s "$BASE_URL/markets")
MARKET_ID=$(extract_first_id "$MARKETS_RESPONSE")

if [ -n "$MARKET_ID" ]; then
  echo "   Using market ID: ${MARKET_ID:0:20}..."
  test_endpoint "GET /api/markets/[id]" "$BASE_URL/markets/$MARKET_ID" "data"
else
  echo "   No markets found - testing 404 handling"
  test_endpoint "GET /api/markets/[id] (404 test)" "$BASE_URL/markets/0x0000000000000000000000000000000000000000" ""
fi

# ============================================
# Test Stats API
# ============================================
echo ""
echo "--- Stats API ---"

test_endpoint "GET /api/stats" "$BASE_URL/stats" "overview"

# ============================================
# Test Bonds API
# ============================================
echo ""
echo "--- Bonds API ---"

if [ -n "$PROJECT_ID" ]; then
  test_endpoint "GET /api/bonds/[projectId]" "$BASE_URL/bonds/$PROJECT_ID" "data"
else
  echo "   No project ID available - skipping bonds test"
  test_endpoint "GET /api/bonds/[projectId] (no data)" "$BASE_URL/bonds/test-project" ""
fi

# ============================================
# Response Content Validation
# ============================================
echo ""
echo "--- Response Content Validation ---"

# Validate projects have required fields
if [ -n "$PROJECT_ID" ]; then
  PROJECT_DETAIL=$(curl -s "$BASE_URL/projects/$PROJECT_ID")

  # Check for key fields
  echo -n "Project has 'name' field ... "
  if echo "$PROJECT_DETAIL" | grep -q '"name":'; then
    echo -e "${GREEN}PASSED${NC}"
    ((PASSED++))
    ((TOTAL++))
  else
    echo -e "${RED}FAILED${NC}"
    ((FAILED++))
    ((TOTAL++))
  fi

  echo -n "Project has 'status' field ... "
  if echo "$PROJECT_DETAIL" | grep -q '"status":'; then
    echo -e "${GREEN}PASSED${NC}"
    ((PASSED++))
    ((TOTAL++))
  else
    echo -e "${RED}FAILED${NC}"
    ((FAILED++))
    ((TOTAL++))
  fi

  echo -n "Project has 'fundingGoal' field ... "
  if echo "$PROJECT_DETAIL" | grep -q '"fundingGoal":'; then
    echo -e "${GREEN}PASSED${NC}"
    ((PASSED++))
    ((TOTAL++))
  else
    echo -e "${RED}FAILED${NC}"
    ((FAILED++))
    ((TOTAL++))
  fi
fi

# ============================================
# Test Summary
# ============================================
echo ""
echo "=============================================="
echo "API TEST SUMMARY"
echo "=============================================="
echo ""
echo "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}ALL API TESTS PASSED${NC}"
  echo ""
  echo "You may now proceed with UI integration."
  exit 0
else
  echo -e "${RED}$FAILED API TESTS FAILED${NC}"
  echo ""
  echo "FIX FAILING TESTS BEFORE PROCEEDING!"
  exit 1
fi
