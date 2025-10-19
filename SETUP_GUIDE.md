# Car Service Center - Setup Guide

## Quick Start (Recommended)

### Option 1: Use the Automated Setup Script
```bash
# Run the setup script to create environment files
.\setup-env.bat

# Then start the development servers
.\start-dev.bat
```

### Option 2: Manual Setup

#### 1. Create Environment Files

**Backend Environment (backend/.env):**
```env
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
```

**Frontend Environment (.env):**
```env
# Frontend Environment Variables
VITE_API_URL=http://localhost:8000/api
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment (if not exists)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -m app.db.init_db

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Frontend Setup
```bash
# Install dependencies
npm install

# Start frontend development server
npm run dev
```

## Demo Accounts

After running the database initialization, you can use these accounts:

- **Super Admin**: `superadmin1` / `admin123`
- **Admin**: `admin1` / `admin123`
- **Receptionist**: `receptionist1` / `rec123`
- **Technician**: `tech1` / `tech123`

## Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Troubleshooting

### Common Issues

1. **Dependencies Installation Fails**
   - Make sure you have Python 3.8+ installed
   - Try using `pip install --upgrade pip` first
   - If Rust compilation fails, the updated requirements.txt should resolve this

2. **Database Connection Issues**
   - The app uses SQLite by default (no external database required)
   - Make sure the `backend/.env` file exists with correct DATABASE_URL

3. **Frontend Can't Connect to Backend**
   - Ensure backend is running on port 8000
   - Check that `VITE_API_URL` in `.env` matches your backend URL
   - Verify CORS settings in backend configuration

4. **Login Issues**
   - Make sure database is initialized with demo users
   - Check that usernames match exactly (case-sensitive)

### Manual Database Reset
```bash
cd backend
# Remove existing database
rm car_service.db
# Reinitialize
python -m app.db.init_db
```

## Development Notes

- The application uses SQLite for simplicity in development
- For production, update DATABASE_URL to use PostgreSQL
- All demo data is created during database initialization
- The frontend is configured for Arabic (RTL) by default
