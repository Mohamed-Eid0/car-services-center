@echo off
echo Setting up Django Backend...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo Python found, creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt

echo Creating database migrations...
python manage.py makemigrations

echo Running migrations...
python manage.py migrate

echo Creating initial data...
python manage.py create_initial_data

echo.
echo Backend setup completed!
echo.
echo To start the server:
echo 1. Activate the virtual environment: venv\Scripts\activate.bat
echo 2. Run the server: python manage.py runserver
echo.
echo The API will be available at: http://localhost:8000/api/
echo Admin interface: http://localhost:8000/admin/
echo.
pause
