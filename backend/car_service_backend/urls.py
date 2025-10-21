"""
URL configuration for car_service_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    UserViewSet, ClientViewSet, CarViewSet, WorkOrderViewSet,
    TechReportViewSet, StockItemViewSet, ServiceViewSet, BillingViewSet,
    LoginView, LogoutView, CurrentUserView, RefreshTokenView
)

# Create router for API endpoints
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'cars', CarViewSet)
router.register(r'work-orders', WorkOrderViewSet)
router.register(r'tech-reports', TechReportViewSet)
router.register(r'stock', StockItemViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'billing', BillingViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    # Authentication endpoints
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
    path('api/auth/me/', CurrentUserView.as_view(), name='current_user'),
    path('api/auth/refresh/', RefreshTokenView.as_view(), name='refresh_token'),
    
    # Reports endpoints
    path('api/reports/', include('api.reports_urls')),
]
