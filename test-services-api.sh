#!/bin/bash

# Services API Test Script - OPTIMIZED VERSION
# Run this after setting up the database and starting the server

API_BASE="http://localhost:3000/api"
ADMIN_TOKEN="" # Set your admin token here

echo "🧪 Testing Services API (Cache Optimized)"
echo "========================================"

# Test 1: Get all services (public) - SHOULD CACHE
echo "📝 Test 1: GET /api/services (public - cached)"
echo "🔄 First request (should be MISS):"
curl -s -D headers1.txt -X GET "$API_BASE/services" | jq '.'
grep -i x-vercel-cache headers1.txt || echo "⚠️  X-Vercel-Cache header not found (local dev)"
echo ""
echo "🔄 Second request (should be HIT):"
curl -s -D headers2.txt -X GET "$API_BASE/services" | jq '.message'
grep -i x-vercel-cache headers2.txt || echo "⚠️  X-Vercel-Cache header not found (local dev)"
echo ""

# Test 2: Get services by category  
echo "📝 Test 2: GET /api/services/category/haircut"
curl -s -X GET "$API_BASE/services/category/haircut" | jq '.'
echo ""

# Test 3: Get single service
echo "📝 Test 3: GET /api/services/[first-service-id]"
SERVICE_ID=$(curl -s "$API_BASE/services" | jq -r '.data.services[0].id')
if [ "$SERVICE_ID" != "null" ]; then
    curl -s -X GET "$API_BASE/services/$SERVICE_ID" | jq '.'
else
    echo "⚠️  No services found, run database setup first"
fi
echo ""

# Admin/Staff tests (require token)
if [ -n "$ADMIN_TOKEN" ]; then
    echo "🔐 Admin/Staff Tests (authenticated)"
    echo "=================================="
    
    # Test 4: Get all services including inactive (staff)
    echo "📝 Test 4: GET /api/services/all (staff - no cache)"
    curl -s -X GET "$API_BASE/services/all" \
        -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
    echo ""
    
    # Test 5: Create new service
    echo "📝 Test 5: POST /api/services (admin)"
    curl -s -X POST "$API_BASE/services" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d '{
            "name": "Test Service - Cache Test",
            "description": "A test service to verify cache invalidation",
            "price": 20.00,
            "duration_minutes": 30,
            "category": "test"
        }' | jq '.'
    echo ""
    
    # Test 6: Verify cache invalidation
    echo "📝 Test 6: GET /api/services (verify cache invalidation after POST)"
    curl -s -D headers3.txt -X GET "$API_BASE/services" | jq '.data.count'
    grep -i x-vercel-cache headers3.txt || echo "⚠️  X-Vercel-Cache header not found (local dev)"
    echo ""
    
else
    echo "⚠️  Set ADMIN_TOKEN variable to test admin/staff endpoints"
fi

echo "✅ Cache optimization tests completed!"
echo ""
echo "📊 Cache Expectations:"
echo "- First GET /api/services: X-Vercel-Cache: MISS"
echo "- Second GET /api/services: X-Vercel-Cache: HIT"  
echo "- After POST (create): X-Vercel-Cache: MISS (cache invalidated)"
echo "- GET /api/services/all: Never cached (force-dynamic)"
