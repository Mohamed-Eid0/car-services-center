#!/bin/bash

echo "Setting up Django Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ and try again"
    exit 1
fi

echo "Python found, creating virtual environment..."
python3 -m venv venv

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Creating database migrations..."
python manage.py makemigrations

echo "Running migrations..."
python manage.py migrate

echo "Creating initial data..."
python manage.py create_initial_data

echo ""
echo "Backend setup completed!"
echo ""
echo "To start the server:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Run the server: python manage.py runserver"
echo ""
echo "The API will be available at: http://localhost:8000/api/"
echo "Admin interface: http://localhost:8000/admin/"
echo ""
