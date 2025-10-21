from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator


class User(AbstractUser):
    """Custom User model with role-based permissions"""
    
    class Role(models.TextChoices):
        SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
        ADMIN = 'ADMIN', 'Admin'
        RECEPTIONIST = 'RECEPTIONIST', 'Receptionist'
        TECHNICIAN = 'TECHNICIAN', 'Technician'
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.RECEPTIONIST
    )
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.username})"


class Client(models.Model):
    """Client model for car service center customers"""
    
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Car(models.Model):
    """Car model for client vehicles"""
    
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='cars')
    plate = models.CharField(max_length=20)
    brand = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    counter = models.IntegerField(validators=[MinValueValidator(0)])  # Mileage
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        # Allow same plate for different clients (car sold to new owner)
        # But prevent same client having multiple cars with same plate
        constraints = [
            models.UniqueConstraint(
                fields=['client', 'plate'],
                name='unique_client_plate'
            )
        ]
    
    def __str__(self):
        return f"{self.plate} - {self.brand} {self.model}"


class WorkOrder(models.Model):
    """Work Order model for service requests"""
    
    class Status(models.TextChoices):
        WAITING = 'waiting', 'Waiting'
        PENDING = 'pending', 'Pending'
        ASSIGNED = 'assigned', 'Assigned'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
    
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='work_orders')
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='work_orders')
    complaint = models.TextField()
    deposit = models.FloatField(default=0, validators=[MinValueValidator(0)])
    services = models.JSONField(default=list)  # List of service names
    oil_change = models.CharField(max_length=100, blank=True)
    oil_confirmed = models.BooleanField(default=False)
    wash_confirmed = models.BooleanField(default=False)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.WAITING
    )
    technician = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_work_orders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"WO-{self.id} - {self.car.plate} ({self.status})"


class TechReport(models.Model):
    """Technical Report model for work order documentation"""
    
    work_order = models.OneToOneField(
        WorkOrder,
        on_delete=models.CASCADE,
        related_name='tech_report'
    )
    technician = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='tech_reports'
    )
    work_description = models.TextField()
    time_spent = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0)])
    used_parts = models.JSONField(default=list)  # List of part IDs with quantities
    services = models.JSONField(default=list)  # List of service IDs
    wash_type = models.IntegerField(null=True, blank=True)  # Wash type ID
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Report-{self.id} for WO-{self.work_order.id}"


class StockItem(models.Model):
    """Stock Item model for inventory management"""
    
    item = models.CharField(max_length=100)
    serial = models.CharField(max_length=100, unique=True)
    buy_price = models.FloatField(validators=[MinValueValidator(0)])
    sell_price = models.FloatField(validators=[MinValueValidator(0)])
    quantity = models.IntegerField(validators=[MinValueValidator(0)])
    is_oil = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['item']
    
    def __str__(self):
        return f"{self.item} ({self.serial})"


class Service(models.Model):
    """Service model for available services"""
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.FloatField(validators=[MinValueValidator(0)])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - ${self.price}"


class Billing(models.Model):
    """Billing model for work order invoices"""
    
    work_order = models.OneToOneField(
        WorkOrder,
        on_delete=models.CASCADE,
        related_name='billing'
    )
    parts_cost = models.FloatField(default=0, validators=[MinValueValidator(0)])
    services_cost = models.FloatField(default=0, validators=[MinValueValidator(0)])
    wash_cost = models.FloatField(default=0, validators=[MinValueValidator(0)])
    labor_cost = models.FloatField(default=0, validators=[MinValueValidator(0)])
    oil_change_cost = models.FloatField(default=0, validators=[MinValueValidator(0)])
    subtotal = models.FloatField(validators=[MinValueValidator(0)])
    tax = models.FloatField(validators=[MinValueValidator(0)])
    deposit = models.FloatField(default=0, validators=[MinValueValidator(0)])
    total = models.FloatField(validators=[MinValueValidator(0)])
    paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Bill-{self.id} for WO-{self.work_order.id} - ${self.total}"
