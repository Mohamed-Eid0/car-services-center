@echo off
echo Setting up environment files...

REM Create backend .env file
echo # Database Configuration > backend\.env
echo DATABASE_URL=sqlite:///./car_service.db >> backend\.env
echo. >> backend\.env
echo # JWT Configuration >> backend\.env
echo SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7 >> backend\.env
echo ALGORITHM=HS256 >> backend\.env
echo ACCESS_TOKEN_EXPIRE_MINUTES=30 >> backend\.env
echo REFRESH_TOKEN_EXPIRE_DAYS=7 >> backend\.env
echo. >> backend\.env
echo # CORS Configuration >> backend\.env
echo FRONTEND_URL=http://localhost:5173 >> backend\.env
echo BACKEND_CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"] >> backend\.env
echo. >> backend\.env
echo # Application Configuration >> backend\.env
echo DEBUG=True >> backend\.env
echo PROJECT_NAME=Car Service Center API >> backend\.env
echo VERSION=1.0.0 >> backend\.env

REM Create frontend .env file
echo # Frontend Environment Variables > .env
echo VITE_API_URL=http://localhost:8000/api >> .env

echo Environment files created successfully!
echo.
echo Backend .env: backend\.env
echo Frontend .env: .env
echo.
pause
