$headers = @{
    'Content-Type' = 'application/json'
}
$body = @{
    barber_id = "75cc9f55-0e9c-4633-84ca-b503b4092219"
    service_id = "7dbb7025-edf7-4cbf-b1d6-eb70d1d8569c"
    appointment_date = "2025-09-10"
    appointment_time = "11:00"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/booking/test-validation" -Method POST -Headers $headers -Body $body
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
