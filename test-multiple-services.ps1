$headers = @{
    'Content-Type' = 'application/json'
}

Write-Host "=== Testing Multiple Services Booking ==="

# Test 1: Single service (legacy compatibility)
Write-Host "Test 1: Single service booking (legacy format)..."
$body1 = @{
    barber_id = "75cc9f55-0e9c-4633-84ca-b503b4092219"
    service_ids = @("7dbb7025-edf7-4cbf-b1d6-eb70d1d8569c")  # Beard Trim (30 min, 15 BHD)
    appointment_date = "2025-01-15"  # Different date to avoid conflicts
    appointment_time = "10:00"
} | ConvertTo-Json

try {
    $response1 = Invoke-WebRequest -Uri "http://localhost:3000/api/booking/test-create" -Method POST -Headers $headers -Body $body1 -ErrorAction Stop
    $result1 = $response1.Content | ConvertFrom-Json
    Write-Host "✅ SUCCESS - Single service booking"
    Write-Host "   Confirmation: $($result1.data.confirmation_code)"
    Write-Host "   Services: $($result1.data.services_summary)"
    Write-Host "   Duration: $($result1.data.total_duration) minutes"
    Write-Host "   Total: $($result1.data.total_amount) $($result1.data.currency)"
    Write-Host ""
} catch {
    Write-Host "❌ FAILED - Single service booking"
    Write-Host "   Error: $($_.Exception.Response.StatusCode)"
    Write-Host ""
}

# Test 2: Multiple services
Write-Host "Test 2: Multiple services booking..."
$body2 = @{
    barber_id = "75cc9f55-0e9c-4633-84ca-b503b4092219"
    service_ids = @(
        "7dbb7025-edf7-4cbf-b1d6-eb70d1d8569c",  # Beard Trim (30 min, 15 BHD)
        "26cb7e7a-1798-4de3-a311-8274e7ef5a0a",  # Mustache Trim (15 min, 10 BHD)
        "05f45136-094b-4bda-aee3-24cc63777c7e"   # Eyebrow Trim (15 min, 8 BHD)
    )
    appointment_date = "2025-01-15"
    appointment_time = "11:00"
} | ConvertTo-Json

try {
    $response2 = Invoke-WebRequest -Uri "http://localhost:3000/api/booking/test-create" -Method POST -Headers $headers -Body $body2 -ErrorAction Stop
    $result2 = $response2.Content | ConvertFrom-Json
    Write-Host "✅ SUCCESS - Multiple services booking"
    Write-Host "   Confirmation: $($result2.data.confirmation_code)"
    Write-Host "   Services: $($result2.data.services_summary)"
    Write-Host "   Count: $($result2.data.services_count) services"
    Write-Host "   Duration: $($result2.data.total_duration) minutes"
    Write-Host "   Total: $($result2.data.total_amount) $($result2.data.currency)"
    Write-Host ""
} catch {
    Write-Host "❌ FAILED - Multiple services booking"
    Write-Host "   Error: $($_.Exception.Response.StatusCode)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        $errorData = $responseBody | ConvertFrom-Json
        Write-Host "   Details: $($errorData.error)"
    }
    Write-Host ""
}

# Test 3: Check available services first
Write-Host "Test 3: Available services..."
try {
    $servicesResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/services" -Method GET -ErrorAction Stop
    $services = $servicesResponse.Content | ConvertFrom-Json
    Write-Host "Available services for multiple booking:"
    foreach ($service in $services.data) {
        Write-Host "   - $($service.name): $($service.duration_minutes) min, $($service.price) BHD (ID: $($service.id))"
    }
} catch {
    Write-Host "❌ Could not fetch services: $($_.Exception.Response.StatusCode)"
}
