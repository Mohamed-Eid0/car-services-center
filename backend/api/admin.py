from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, Client, Car, WorkOrder, TechReport, 
    StockItem, Service, Billing
)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Admin interface for User model"""
    list_display = ('username', 'first_name', 'last_name', 'role', 'is_active')
    list_filter = ('role', 'is_active', 'date_joined')
    search_fields = ('username', 'first_name', 'last_name')
    ordering = ('username',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Role', {'fields': ('role',)}),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role', {'fields': ('role',)}),
    )


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """Admin interface for Client model"""
    list_display = ('first_name', 'last_name', 'phone', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('first_name', 'last_name', 'phone')
    ordering = ('-created_at',)


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    """Admin interface for Car model"""
    list_display = ('plate', 'brand', 'model', 'client', 'counter', 'created_at')
    list_filter = ('brand', 'created_at')
    search_fields = ('plate', 'brand', 'model', 'client__first_name', 'client__last_name')
    ordering = ('-created_at',)


@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    """Admin interface for WorkOrder model"""
    list_display = ('id', 'car', 'client', 'status', 'technician', 'created_at')
    list_filter = ('status', 'created_at', 'technician__role')
    search_fields = ('car__plate', 'client__first_name', 'client__last_name', 'complaint')
    ordering = ('-created_at',)
    raw_id_fields = ('client', 'car', 'technician')


@admin.register(TechReport)
class TechReportAdmin(admin.ModelAdmin):
    """Admin interface for TechReport model"""
    list_display = ('id', 'work_order', 'technician', 'created_at')
    list_filter = ('created_at', 'technician__role')
    search_fields = ('work_order__car__plate', 'work_description')
    ordering = ('-created_at',)
    raw_id_fields = ('work_order', 'technician')


@admin.register(StockItem)
class StockItemAdmin(admin.ModelAdmin):
    """Admin interface for StockItem model"""
    list_display = ('item', 'serial', 'quantity', 'sell_price', 'is_oil', 'created_at')
    list_filter = ('is_oil', 'created_at')
    search_fields = ('item', 'serial', 'description')
    ordering = ('item',)


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    """Admin interface for Service model"""
    list_display = ('name', 'price', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)


@admin.register(Billing)
class BillingAdmin(admin.ModelAdmin):
    """Admin interface for Billing model"""
    list_display = ('id', 'work_order', 'total', 'paid', 'created_at')
    list_filter = ('paid', 'created_at')
    search_fields = ('work_order__car__plate', 'work_order__client__first_name')
    ordering = ('-created_at',)
    raw_id_fields = ('work_order',)
