# Simple PowerShell script to test the Django API login
Write-Host "Testing Django API Login..." -ForegroundColor Green

# Test login endpoint
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login/" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host "User: $($response.user.username)" -ForegroundColor Yellow
    Write-Host "Role: $($response.user.role)" -ForegroundColor Yellow
    Write-Host "Token received: $($response.access_token.Substring(0, 20))..." -ForegroundColor Yellow
    
    # Test protected endpoint
    $headers = @{
        "Authorization" = "Bearer $($response.access_token)"
        "Content-Type" = "application/json"
    }
    
    Write-Host "`nTesting protected endpoint..." -ForegroundColor Green
    $userInfo = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/me/" -Method GET -Headers $headers
    Write-Host "Current user info retrieved successfully!" -ForegroundColor Green
    Write-Host "User ID: $($userInfo.id)" -ForegroundColor Yellow
    Write-Host "Username: $($userInfo.username)" -ForegroundColor Yellow
    Write-Host "Full Name: $($userInfo.first_name) $($userInfo.last_name)" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "`nTest completed!" -ForegroundColor Green
