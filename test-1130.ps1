$headers = @{
    'Content-Type' = 'application/json'
}
$body = @{
    barber_id = "75cc9f55-0e9c-4633-84ca-b503b4092219"
    service_id = "7dbb7025-edf7-4cbf-b1d6-eb70d1d8569c"
    appointment_date = "2025-09-10"
    appointment_time = "11:30"
} | ConvertTo-Json

Write-Host "Testing 11:30 AM booking (should start when 11:00 appointment ends)..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/booking/test-create" -Method POST -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "✅ SUCCESS - Booking allowed!"
    $result = $response.Content | ConvertFrom-Json
    Write-Host "Confirmation code: $($result.data.confirmation_code)"
    Write-Host "Time: $($result.data.appointment_time)"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error: $($responseBody)"
    }
}
