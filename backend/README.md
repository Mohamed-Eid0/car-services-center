# Car Service Center Backend

A Django REST Framework backend for the Car Service Center management system.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **User Management**: Support for Super Admin, Admin, Receptionist, and Technician roles
- **Client Management**: Manage customer information and their vehicles
- **Work Orders**: Track service requests from creation to completion
- **Technical Reports**: Document work performed by technicians
- **Inventory Management**: Track stock items and parts
- **Billing System**: Generate invoices and track payments
- **Reports**: KPIs, daily work orders, monthly profits, and popular oils

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Get current user
- `POST /api/auth/refresh/` - Refresh token

### Users
- `GET /api/users/` - List all users
- `POST /api/users/` - Create user
- `GET /api/users/{id}/` - Get user details
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user

### Clients
- `GET /api/clients/` - List all clients
- `POST /api/clients/` - Create client
- `GET /api/clients/{id}/` - Get client details
- `PUT /api/clients/{id}/` - Update client
- `DELETE /api/clients/{id}/` - Delete client

### Cars
- `GET /api/cars/` - List all cars
- `GET /api/cars/?client_id={id}` - Get cars by client
- `POST /api/cars/` - Create car
- `GET /api/cars/{id}/` - Get car details
- `PUT /api/cars/{id}/` - Update car
- `DELETE /api/cars/{id}/` - Delete car

### Work Orders
- `GET /api/work-orders/` - List all work orders
- `POST /api/work-orders/` - Create work order
- `GET /api/work-orders/{id}/` - Get work order details
- `PUT /api/work-orders/{id}/` - Update work order
- `DELETE /api/work-orders/{id}/` - Delete work order
- `POST /api/work-orders/{id}/assign/` - Assign to technician
- `POST /api/work-orders/{id}/start_work/` - Start work

### Technical Reports
- `GET /api/tech-reports/` - List all tech reports
- `GET /api/tech-reports/?work_order_id={id}` - Get report by work order
- `POST /api/tech-reports/` - Create tech report
- `GET /api/tech-reports/{id}/` - Get report details
- `PUT /api/tech-reports/{id}/` - Update report
- `DELETE /api/tech-reports/{id}/` - Delete report

### Stock Items
- `GET /api/stock/` - List all stock items
- `GET /api/stock/oils/` - Get oil items only
- `POST /api/stock/` - Create stock item
- `GET /api/stock/{id}/` - Get stock item details
- `PUT /api/stock/{id}/` - Update stock item
- `PATCH /api/stock/{id}/quantity/` - Update quantity only
- `DELETE /api/stock/{id}/` - Delete stock item

### Services
- `GET /api/services/` - List all services
- `GET /api/services/active/` - Get active services only
- `POST /api/services/` - Create service
- `GET /api/services/{id}/` - Get service details
- `PUT /api/services/{id}/` - Update service
- `DELETE /api/services/{id}/` - Delete service

### Billing
- `GET /api/billing/` - List all billing records
- `GET /api/billing/?work_order_id={id}` - Get billing by work order
- `POST /api/billing/` - Create billing record
- `POST /api/billing/generate/` - Generate billing from work order
- `GET /api/billing/{id}/` - Get billing details
- `PUT /api/billing/{id}/` - Update billing
- `DELETE /api/billing/{id}/` - Delete billing

### Reports
- `GET /api/reports/kpis/` - Get KPIs for dashboard
- `GET /api/reports/daily-work-orders/` - Get daily work orders count
- `GET /api/reports/monthly-profit/` - Get monthly profit data
- `GET /api/reports/popular-oils/` - Get popular oil types

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   
   On Windows:
   ```bash
   venv\Scripts\activate
   ```
   
   On macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create initial data:**
   ```bash
   python manage.py create_initial_data
   ```

7. **Create a superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

8. **Run the development server:**
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/api/`

## Default Users

After running `create_initial_data`, you'll have these default users:

- **Super Admin**: `admin` / `admin123`
- **Receptionist**: `receptionist` / `recep123`
- **Technician 1**: `technician1` / `tech123`
- **Technician 2**: `technician2` / `tech1234`

## Database

The default setup uses SQLite for development. For production, you can configure PostgreSQL by:

1. Installing PostgreSQL
2. Installing `psycopg2-binary` (already in requirements.txt)
3. Updating the database settings in `settings.py`

## CORS Configuration

The backend is configured to allow requests from:
- `http://localhost:5173` (Vite default)
- `http://localhost:5174` (Vite alternative)

For production, update the `CORS_ALLOWED_ORIGINS` setting in `settings.py`.

## API Documentation

You can access the Django REST Framework browsable API at:
- `http://localhost:8000/api/`

## Admin Interface

Access the Django admin interface at:
- `http://localhost:8000/admin/`

Use your superuser credentials to log in.

## Testing

Run the test suite:
```bash
python manage.py test
```

## Production Deployment

For production deployment:

1. Set `DEBUG = False` in `settings.py`
2. Update `ALLOWED_HOSTS` with your domain
3. Configure a production database (PostgreSQL recommended)
4. Set up proper secret key and environment variables
5. Configure static file serving
6. Set up SSL/HTTPS
7. Use a production WSGI server like Gunicorn

## Environment Variables

Create a `.env` file in the backend directory for environment-specific settings:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Troubleshooting

### Common Issues

1. **Migration errors**: Delete the database file and run migrations again
2. **CORS errors**: Check that your frontend URL is in `CORS_ALLOWED_ORIGINS`
3. **Authentication errors**: Ensure JWT tokens are properly formatted in requests

### Getting Help

- Check Django logs for detailed error messages
- Use the Django shell for debugging: `python manage.py shell`
- Access the browsable API for testing endpoints

## License

This project is part of the Car Service Center management system.
