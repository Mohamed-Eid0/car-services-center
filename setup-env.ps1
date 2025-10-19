# PowerShell script to set up environment files
Write-Host "Setting up environment files..." -ForegroundColor Green

# Create backend .env file
$backendEnv = @"
# Database Configuration
DATABASE_URL=sqlite:///./car_service.db

# JWT Configuration
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS Configuration
FRONTEND_URL=http://localhost:5173
BACKEND_CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"]

# Application Configuration
DEBUG=True
PROJECT_NAME=Car Service Center API
VERSION=1.0.0
"@

$backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8

# Create frontend .env file
$frontendEnv = @"
# Frontend Environment Variables
VITE_API_URL=http://localhost:8000/api
"@

$frontendEnv | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "Environment files created successfully!" -ForegroundColor Green
Write-Host "Backend .env: backend\.env" -ForegroundColor Yellow
Write-Host "Frontend .env: .env" -ForegroundColor Yellow
