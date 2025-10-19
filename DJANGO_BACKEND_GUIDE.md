# Django Backend Implementation Guide

This guide shows you how to create a Django backend that matches the test API structure.

## API Structure Reference

Your Django backend should implement these exact endpoints to be compatible with the frontend:

### Authentication Endpoints

```python
# POST /api/auth/login
# Request: { "username": "string", "password": "string" }
# Response: { 
#   "access_token": "string",
#   "refresh_token": "string", 
#   "token_type": "bearer",
#   "user": { ... }
# }

# POST /api/auth/logout
# Response: { "message": "Logged out successfully" }

# GET /api/auth/me
# Response: { "id": int, "username": "string", "role": "string", ... }

# POST /api/auth/refresh
# Request: { "refresh_token": "string" }
# Response: { "access_token": "string", "refresh_token": "string" }
```

### Users Endpoints

```python
# GET /api/users/
# Response: [{ "id": 1, "username": "string", ... }, ...]

# GET /api/users/{id}
# Response: { "id": 1, "username": "string", ... }

# POST /api/users/
# Request: { "username": "string", "password": "string", "first_name": "string", ... }
# Response: { "id": 1, ... }

# PUT /api/users/{id}
# Request: { "first_name": "string", ... }
# Response: { "id": 1, ... }

# DELETE /api/users/{id}
# Response: { "message": "User deleted successfully" }
```

### Clients Endpoints

```python
# GET /api/clients/
# Response: [{ "id": 1, "first_name": "string", "last_name": "string", "phone": "string", ... }, ...]

# GET /api/clients/{id}
# Response: { "id": 1, ... }

# POST /api/clients/
# Request: { "first_name": "string", "last_name": "string", "phone": "string" }
# Response: { "id": 1, ... }

# PUT /api/clients/{id}
# Request: { "first_name": "string", ... }
# Response: { "id": 1, ... }

# DELETE /api/clients/{id}
# Response: { "message": "Client deleted successfully" }
```

### Cars Endpoints

```python
# GET /api/cars/
# Response: [{ "id": 1, "client_id": 1, "plate": "string", "brand": "string", ... }, ...]

# GET /api/cars/{id}
# Response: { "id": 1, ... }

# GET /api/cars/?client_id={id}
# Response: [{ "id": 1, ... }, ...]

# POST /api/cars/
# Request: { "client_id": 1, "plate": "string", "brand": "string", "model": "string", "counter": int }
# Response: { "id": 1, ... }

# PUT /api/cars/{id}
# Request: { "plate": "string", ... }
# Response: { "id": 1, ... }

# DELETE /api/cars/{id}
# Response: { "message": "Car deleted successfully" }
```

### Work Orders Endpoints

```python
# GET /api/work-orders/
# Response: [{ "id": 1, "client_id": 1, "car_id": 1, "status": "string", ... }, ...]

# GET /api/work-orders/{id}
# Response: { "id": 1, ... }

# POST /api/work-orders/
# Request: { 
#   "client_id": 1, 
#   "car_id": 1, 
#   "complaint": "string",
#   "deposit": float,
#   "services": ["string"],
#   "oil_change": "string"
# }
# Response: { "id": 1, ... }

# PUT /api/work-orders/{id}
# Request: { "status": "string", "technician_id": int, ... }
# Response: { "id": 1, ... }

# POST /api/work-orders/{id}/assign/{technician_id}
# Response: { "id": 1, ... }

# DELETE /api/work-orders/{id}
# Response: { "message": "Work order deleted successfully" }
```

### Stock Endpoints

```python
# GET /api/stock/
# Response: [{ "id": 1, "item": "string", "serial": "string", "quantity": int, ... }, ...]

# GET /api/stock/{id}
# Response: { "id": 1, ... }

# GET /api/stock/oils
# Response: [{ "id": 1, "item": "string", "is_oil": true, ... }, ...]

# POST /api/stock/
# Request: { "item": "string", "serial": "string", "buy_price": float, "sell_price": float, "quantity": int }
# Response: { "id": 1, ... }

# PUT /api/stock/{id}
# Request: { "quantity": int, ... }
# Response: { "id": 1, ... }

# PATCH /api/stock/{id}/quantity
# Request: { "quantity": int }  # New quantity value
# Response: { "id": 1, ... }

# DELETE /api/stock/{id}
# Response: { "message": "Stock item deleted successfully" }
```

### Services Endpoints

```python
# GET /api/services/
# Response: [{ "id": 1, "name": "string", "price": float, "is_active": bool, ... }, ...]

# GET /api/services/active
# Response: [{ "id": 1, "name": "string", ... }, ...]

# GET /api/services/{id}
# Response: { "id": 1, ... }

# POST /api/services/
# Request: { "name": "string", "description": "string", "price": float }
# Response: { "id": 1, ... }

# PUT /api/services/{id}
# Request: { "price": float, ... }
# Response: { "id": 1, ... }

# DELETE /api/services/{id}
# Response: { "message": "Service deleted successfully" }
```

### Tech Reports Endpoints

```python
# GET /api/tech-reports/
# Response: [{ "id": 1, "work_order_id": 1, "technician_id": 1, ... }, ...]

# GET /api/tech-reports/{id}
# Response: { "id": 1, ... }

# GET /api/tech-reports/work-order/{work_order_id}
# Response: { "id": 1, ... }

# POST /api/tech-reports/
# Request: { "work_order_id": 1, "work_description": "string", "time_spent": float, "spare_parts": ["string"] }
# Response: { "id": 1, ... }

# PUT /api/tech-reports/{id}
# Request: { "work_description": "string", ... }
# Response: { "id": 1, ... }

# DELETE /api/tech-reports/{id}
# Response: { "message": "Tech report deleted successfully" }
```

### Billing Endpoints

```python
# GET /api/billing/
# Response: [{ "id": 1, "work_order_id": 1, "total": float, ... }, ...]

# GET /api/billing/{id}
# Response: { "id": 1, ... }

# GET /api/billing/work-order/{work_order_id}
# Response: { "id": 1, ... }

# POST /api/billing/
# Request: { 
#   "work_order_id": 1,
#   "technician_fare": float,
#   "parts_total": float,
#   "oil_total": float,
#   "wash_total": float,
#   "total": float
# }
# Response: { "id": 1, ... }

# PUT /api/billing/{id}
# Request: { "total": float, ... }
# Response: { "id": 1, ... }

# DELETE /api/billing/{id}
# Response: { "message": "Billing deleted successfully" }
```

### Reports Endpoints

```python
# GET /api/reports/kpis
# Response: {
#   "cars_washed_today": int,
#   "cars_oil_changed_today": int,
#   "cars_maintained_today": int,
#   "cars_currently_in_center": int,
#   "cars_pending": int,
#   "cars_completed": int
# }

# GET /api/reports/daily-work-orders
# Response: [{ "date": "YYYY-MM-DD", "count": int }, ...]

# GET /api/reports/monthly-profit
# Response: [{ "month": "YYYY-MM", "profit": float }, ...]

# GET /api/reports/popular-oils
# Response: [{ "oil": "string", "count": int }, ...]
```

## Django Models Example

```python
# models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = 'SUPER_ADMIN'
        ADMIN = 'ADMIN'
        RECEPTIONIST = 'RECEPTIONIST'
        TECHNICIAN = 'TECHNICIAN'
    
    role = models.CharField(max_length=20, choices=Role.choices)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)

class Client(models.Model):
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Car(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    plate = models.CharField(max_length=20, unique=True)
    brand = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    counter = models.IntegerField()  # Mileage
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class WorkOrder(models.Model):
    class Status(models.TextChoices):
        WAITING = 'waiting'
        PENDING = 'pending'
        ASSIGNED = 'assigned'
        COMPLETED = 'completed'
    
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    car = models.ForeignKey(Car, on_delete=models.CASCADE)
    complaint = models.TextField()
    deposit = models.FloatField(default=0)
    services = models.JSONField(default=list)
    oil_change = models.CharField(max_length=100, blank=True)
    oil_confirmed = models.BooleanField(default=False)
    wash_confirmed = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.WAITING)
    technician = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True)

# ... add other models
```

## Django Serializers Example

```python
# serializers.py
from rest_framework import serializers

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'first_name', 'last_name', 'phone', 'created_at']

class CarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = ['id', 'client_id', 'plate', 'brand', 'model', 'counter', 'notes', 'created_at']

# ... add other serializers
```

## Django Views Example

```python
# views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

class CarViewSet(viewsets.ModelViewSet):
    queryset = Car.objects.all()
    serializer_class = CarSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        client_id = self.request.query_params.get('client_id')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        return queryset

# ... add other viewsets
```

## URLs Configuration

```python
# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'cars', CarViewSet)
router.register(r'work-orders', WorkOrderViewSet)
router.register(r'tech-reports', TechReportViewSet)
router.register(r'stock', StockViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'billing', BillingViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth/login', LoginView.as_view()),
    path('api/auth/logout', LogoutView.as_view()),
    path('api/auth/me', CurrentUserView.as_view()),
    path('api/reports/', include('reports.urls')),
]
```

## CORS Configuration

```python
# settings.py
INSTALLED_APPS = [
    ...
    'corsheaders',
    'rest_framework',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
]
```

## Important Notes

1. **Date Format**: Use ISO 8601 format (YYYY-MM-DDTHH:MM:SS.sssZ)
2. **Field Names**: Use snake_case (client_id, not clientId)
3. **Error Responses**: Return appropriate HTTP status codes
4. **Authentication**: Use JWT tokens in Authorization header
5. **Validation**: Match the validation rules from test API

## Testing Your Backend

Use the same test cases as the test API:

```python
# Test creating a client
response = client.post('/api/clients/', {
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "phone": "+201234567890"
})
assert response.status_code == 201

# Test duplicate phone number
response = client.post('/api/clients/', {
    "first_name": "Sara",
    "last_name": "Mohamed",
    "phone": "+201234567890"  # Same phone
})
assert response.status_code == 400
```

---

Once your Django backend matches this structure, you can switch the frontend to use it by following the instructions in FRONTEND_SETUP.md.
