$headers = @{
    'Content-Type' = 'application/json'
}

Write-Host "=== Testing User Bookings API ==="

# Test 1: Get all bookings (without token)
Write-Host "Test 1: Get all bookings (public access)..."
try {
    $response1 = Invoke-WebRequest -Uri "http://localhost:3001/api/bookings" -Method GET -Headers $headers -ErrorAction Stop
    $result1 = $response1.Content | ConvertFrom-Json
    Write-Host "✅ SUCCESS - Public bookings access"
    Write-Host "   Count: $($result1.count)"
    Write-Host "   User-specific: $($result1.user_bookings)"
    Write-Host ""
} catch {
    Write-Host "❌ FAILED - Public bookings access"
    Write-Host "   Error: $($_.Exception.Response.StatusCode)"
    Write-Host ""
}

# Test 2: Get bookings with invalid token
Write-Host "Test 2: Get bookings with invalid token..."
$headersWithToken = @{
    'Content-Type' = 'application/json'
    'Authorization' = 'Bearer invalid_token_here'
}
try {
    $response2 = Invoke-WebRequest -Uri "http://localhost:3001/api/bookings" -Method GET -Headers $headersWithToken -ErrorAction Stop
    $result2 = $response2.Content | ConvertFrom-Json
    Write-Host "✅ SUCCESS - Invalid token handled gracefully"
    Write-Host "   Count: $($result2.count)"
    Write-Host "   User-specific: $($result2.user_bookings)"
    Write-Host ""
} catch {
    Write-Host "❌ FAILED - Invalid token handling"
    Write-Host "   Error: $($_.Exception.Response.StatusCode)"
    Write-Host ""
}

# Test 3: Try the dedicated /my endpoint without token
Write-Host "Test 3: Try /api/bookings/my without token..."
try {
    $response3 = Invoke-WebRequest -Uri "http://localhost:3001/api/bookings/my" -Method GET -Headers $headers -ErrorAction Stop
    $result3 = $response3.Content | ConvertFrom-Json
    Write-Host "❌ UNEXPECTED SUCCESS - Should require authentication"
    Write-Host ""
} catch {
    Write-Host "✅ EXPECTED FAILURE - Authentication required"
    Write-Host "   Error: $($_.Exception.Response.StatusCode)"
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✓ Correct 401 Unauthorized response"
    }
    Write-Host ""
}

# Test 4: Check available bookings for confirmation code search
Write-Host "Test 4: Search by confirmation code (if any exist)..."
try {
    $allBookingsResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/bookings" -Method GET -Headers $headers -ErrorAction Stop
    $allBookings = ($allBookingsResponse.Content | ConvertFrom-Json).data
    
    if ($allBookings.Count -gt 0) {
        $firstBooking = $allBookings[0]
        if ($firstBooking.confirmation_code) {
            $searchResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/bookings?confirmation_code=$($firstBooking.confirmation_code)" -Method GET -Headers $headers -ErrorAction Stop
            $searchResult = $searchResponse.Content | ConvertFrom-Json
            Write-Host "✅ SUCCESS - Confirmation code search"
            Write-Host "   Found booking: $($searchResult.data.confirmation_code)"
        } else {
            Write-Host "ℹ️  No confirmation codes available for testing"
        }
    } else {
        Write-Host "ℹ️  No bookings available for testing"
    }
} catch {
    Write-Host "❌ FAILED - Confirmation code search"
    Write-Host "   Error: $($_.Exception.Response.StatusCode)"
}

Write-Host ""
Write-Host "=== API Behavior Summary ==="
Write-Host "• GET /api/bookings - Returns all bookings (public)"
Write-Host "• GET /api/bookings + Bearer token - Returns user's bookings only"
Write-Host "• GET /api/bookings/my + Bearer token - Dedicated user bookings endpoint"
Write-Host "• GET /api/bookings?confirmation_code=X - Find specific booking"
