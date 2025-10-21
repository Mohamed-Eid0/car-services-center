# Switching from Test API to Django Backend

This guide will help you switch your Car Service Center frontend from using the test API (localStorage) to the Django REST backend.

## Prerequisites

- Python 3.8 or higher installed
- Node.js and npm/pnpm installed (for frontend)

## Step 1: Setup Django Backend

### Windows Users:
1. Navigate to the backend directory:
   ```cmd
   cd backend
   ```

2. Run the setup script:
   ```cmd
   setup_backend.bat
   ```

### macOS/Linux Users:
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Make the setup script executable and run it:
   ```bash
   chmod +x setup_backend.sh
   ./setup_backend.sh
   ```

### Manual Setup (if scripts don't work):
1. Create virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate virtual environment:
   
   Windows:
   ```cmd
   venv\Scripts\activate
   ```
   
   macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create and run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. Create initial data:
   ```bash
   python manage.py create_initial_data
   ```

## Step 2: Start the Django Backend

1. Activate the virtual environment (if not already active):
   
   Windows:
   ```cmd
   venv\Scripts\activate
   ```
   
   macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

2. Start the Django server:
   ```bash
   python manage.py runserver
   ```

The backend will be available at `http://localhost:8000/api/`

## Step 3: Switch Frontend to Use Django Backend

1. Open `src/services/api.js`

2. Comment out the test API import:
   ```javascript
   // import {
   //   authApi,
   //   usersApi,
   //   clientsApi,
   //   carsApi,
   //   workOrdersApi,
   //   techReportsApi,
   //   stockApi,
   //   servicesApi,
   //   billingApi,
   //   reportsApi,
   //   adminApi,
   //   UserRole,
   //   WorkOrderStatus
   // } from './testApi';
   ```

3. Uncomment the Django backend import:
   ```javascript
   import {
     authApi,
     usersApi,
     clientsApi,
     carsApi,
     workOrdersApi,
     techReportsApi,
     stockApi,
     servicesApi,
     billingApi,
     reportsApi,
     adminApi,
     UserRole,
     WorkOrderStatus
   } from './djangoBackend';
   ```

4. Save the file.

## Step 4: Start the Frontend

1. In a new terminal, navigate to the project root:
   ```bash
   cd ..
   ```

2. Start the frontend development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

## Step 5: Test the Integration

1. Open your browser and go to `http://localhost:5173`

2. Try logging in with the default credentials:
   - **Super Admin**: `admin` / `admin123`
   - **Receptionist**: `receptionist` / `recep123`
   - **Technician 1**: `technician1` / `tech123`
   - **Technician 2**: `technician2` / `tech1234`

3. Test creating clients, cars, work orders, etc.

## Troubleshooting

### Backend Issues:

1. **Port 8000 already in use:**
   ```bash
   python manage.py runserver 8001
   ```
   Then update the API_BASE_URL in `src/services/djangoBackend.js` to `http://localhost:8001/api`

2. **Database errors:**
   ```bash
   python manage.py migrate --run-syncdb
   ```

3. **Permission errors:**
   Make sure you have write permissions in the backend directory.

### Frontend Issues:

1. **CORS errors:**
   - Make sure the Django backend is running
   - Check that `http://localhost:5173` is in `CORS_ALLOWED_ORIGINS` in `backend/car_service_backend/settings.py`

2. **API connection errors:**
   - Verify the backend is running on `http://localhost:8000`
   - Check the browser's developer console for error messages

3. **Authentication errors:**
   - Clear your browser's localStorage
   - Try logging in again

## Switching Back to Test API

If you need to switch back to the test API:

1. In `src/services/api.js`, reverse the import changes:
   ```javascript
   // Comment out Django import
   // import { ... } from './djangoBackend';
   
   // Uncomment test API import
   import { ... } from './testApi';
   ```

2. Save and refresh your frontend.

## Production Deployment

For production deployment:

1. Set up a production database (PostgreSQL recommended)
2. Configure environment variables
3. Set `DEBUG = False` in Django settings
4. Use a production WSGI server like Gunicorn
5. Set up reverse proxy with Nginx
6. Configure SSL/HTTPS
7. Update CORS settings for your production domain

## API Documentation

- Django REST Framework browsable API: `http://localhost:8000/api/`
- Django Admin: `http://localhost:8000/admin/`

## Default Users After Setup

After running `create_initial_data`, you'll have these users:

- **admin** / **admin123** (Super Admin)
- **receptionist** / **recep123** (Receptionist)
- **technician1** / **tech123** (Technician)
- **technician2** / **tech1234** (Technician)

## Support

If you encounter any issues:

1. Check the Django server logs for backend errors
2. Check the browser console for frontend errors
3. Verify all dependencies are installed correctly
4. Make sure both servers (Django and Vite) are running
