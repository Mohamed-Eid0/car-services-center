# Quick Start Guide

## Option 1: Using SQLite (Easiest - No PostgreSQL needed)

### Step 1: Update Backend Configuration

Edit `backend\.env` and change the DATABASE_URL to use SQLite:

```env
DATABASE_URL=sqlite:///./car_service.db
```

### Step 2: Install Backend Dependencies

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Step 3: Initialize Database

```bash
python -m app.db.init_db
```

### Step 4: Start Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 5: Install Frontend Dependencies (New Terminal)

```bash
cd ..
npm install
```

### Step 6: Start Frontend

```bash
npm run dev
```

### Step 7: Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Demo Accounts:
- **Super Admin**: superadmin1 / admin123
- **Admin**: admin1 / admin123
- **Receptionist**: receptionist1 / rec123
- **Technician**: tech1 / tech123

---

## Option 2: Using PostgreSQL (Recommended for Production)

### Step 1: Install PostgreSQL

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer (remember the password for postgres user)
3. Default port: 5432

**Using Chocolatey (Windows):**
```bash
choco install postgresql
```

### Step 2: Create Database

```bash
# Open Command Prompt as Administrator
psql -U postgres

# In PostgreSQL prompt:
CREATE DATABASE car_service_db;
\q
```

### Step 3: Update Backend Configuration

Edit `backend\.env`:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/car_service_db
```

### Step 4: Follow Steps 2-7 from Option 1

---

## Automated Setup (Windows)

Simply run:
```bash
start-dev.bat
```

This will:
1. Create virtual environment
2. Install all dependencies
3. Initialize database
4. Start both backend and frontend servers

---

## Troubleshooting

### Backend won't start
- Check if Python is installed: `python --version`
- Activate virtual environment: `backend\venv\Scripts\activate`
- Check database connection in `.env`

### Frontend won't start
- Check if Node.js is installed: `node --version`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Database errors
- For SQLite: Make sure the backend folder is writable
- For PostgreSQL: Verify service is running and credentials are correct

### Port already in use
- Backend: Change port in start command: `--port 8001`
- Frontend: It will automatically suggest another port

---

## Next Steps

1. Login with demo accounts
2. Explore different role dashboards
3. Create clients and cars
4. Create work orders
5. Assign work orders to technicians
6. Complete work and generate bills
7. View reports and analytics

Enjoy using the Car Service Center Management System! 🚗
