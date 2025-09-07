$headers = @{
    'Content-Type' = 'application/json'
}

# Test Case 1: 10:45 AM (should conflict - ends at 11:15, overlaps with 11:00-11:30)
Write-Host "=== Test Case 1: 10:45 AM (should conflict) ==="
$body1 = @{
    barber_id = "75cc9f55-0e9c-4633-84ca-b503b4092219"
    service_id = "7dbb7025-edf7-4cbf-b1d6-eb70d1d8569c"
    appointment_date = "2025-09-10"
    appointment_time = "10:45"
} | ConvertTo-Json

try {
    $response1 = Invoke-WebRequest -Uri "http://localhost:3000/api/booking/test-create" -Method POST -Headers $headers -Body $body1 -ErrorAction Stop
    Write-Host "UNEXPECTED SUCCESS - This should have been rejected!"
    $response1.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch {
    Write-Host "✅ CORRECTLY REJECTED - Status: $($_.Exception.Response.StatusCode)"
}

Write-Host ""
Write-Host "=== Test Case 2: 10:30 AM (should be allowed - ends at 11:00, no overlap) ==="
$body2 = @{
    barber_id = "75cc9f55-0e9c-4633-84ca-b503b4092219"
    service_id = "7dbb7025-edf7-4cbf-b1d6-eb70d1d8569c"
    appointment_date = "2025-09-10"
    appointment_time = "10:30"
} | ConvertTo-Json

try {
    $response2 = Invoke-WebRequest -Uri "http://localhost:3000/api/booking/test-create" -Method POST -Headers $headers -Body $body2 -ErrorAction Stop
    Write-Host "✅ CORRECTLY ALLOWED - Booking successful!"
    $result2 = $response2.Content | ConvertFrom-Json
    Write-Host "Confirmation code: $($result2.data.confirmation_code)"
} catch {
    Write-Host "❌ UNEXPECTED REJECTION - Status: $($_.Exception.Response.StatusCode)"
}

Write-Host ""
Write-Host "=== Test Case 3: 11:30 AM (should be allowed - starts when previous ends) ==="
$body3 = @{
    barber_id = "75cc9f55-0e9c-4633-84ca-b503b4092219"
    service_id = "7dbb7025-edf7-4cbf-b1d6-eb70d1d8569c"
    appointment_date = "2025-09-10"
    appointment_time = "11:30"
} | ConvertTo-Json

try {
    $response3 = Invoke-WebRequest -Uri "http://localhost:3000/api/booking/test-create" -Method POST -Headers $headers -Body $body3 -ErrorAction Stop
    Write-Host "✅ CORRECTLY ALLOWED - Booking successful!"
    $result3 = $response3.Content | ConvertFrom-Json
    Write-Host "Confirmation code: $($result3.data.confirmation_code)"
} catch {
    Write-Host "❌ UNEXPECTED REJECTION - Status: $($_.Exception.Response.StatusCode)"
}
