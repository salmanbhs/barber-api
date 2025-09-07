$headers = @{
    'Content-Type' = 'application/json'
}
$loginBody = @{
    phone = "+973-1234-5678"
    password = "password123"
} | ConvertTo-Json

Write-Host "Getting authentication token..."
$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers $headers -Body $loginBody
$loginData = $loginResponse.Content | ConvertFrom-Json

if ($loginData.success) {
    $token = $loginData.data.token
    Write-Host "Token obtained successfully!"
    
    # Now test the booking
    $bookingHeaders = @{
        'Content-Type' = 'application/json'
        'Authorization' = "Bearer $token"
    }
    $bookingBody = @{
        barber_id = "75cc9f55-0e9c-4633-84ca-b503b4092219"
        service_id = "7dbb7025-edf7-4cbf-b1d6-eb70d1d8569c"
        appointment_date = "2025-09-10"
        appointment_time = "11:00"
    } | ConvertTo-Json

    Write-Host "Testing booking with UTC fix..."
    $bookingResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/bookings" -Method POST -Headers $bookingHeaders -Body $bookingBody
    $bookingResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} else {
    Write-Host "Login failed:"
    $loginData | ConvertTo-Json -Depth 10
}
