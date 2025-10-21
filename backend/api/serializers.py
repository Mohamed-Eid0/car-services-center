from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import (
    User, Client, Car, WorkOrder, TechReport, 
    StockItem, Service, Billing
)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 
            'role', 'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']
    
    def validate_username(self, value):
        """Validate username uniqueness"""
        if self.instance and self.instance.username == value:
            return value
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users with password"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'password', 'password_confirm', 'first_name', 
            'last_name', 'role', 'is_active'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users with optional password"""
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    
    class Meta:
        model = User
        fields = [
            'username', 'password', 'first_name', 'last_name', 
            'role', 'is_active'
        ]
    
    def validate_username(self, value):
        if self.instance and self.instance.username == value:
            return value
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)


class ClientSerializer(serializers.ModelSerializer):
    """Serializer for Client model"""
    
    class Meta:
        model = Client
        fields = ['id', 'first_name', 'last_name', 'phone', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CarSerializer(serializers.ModelSerializer):
    """Serializer for Car model"""
    client_id = serializers.IntegerField(write_only=True)
    client = ClientSerializer(read_only=True)
    
    class Meta:
        model = Car
        fields = [
            'id', 'client_id', 'client', 'plate', 'brand', 'model', 
            'counter', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """Validate car plate uniqueness for the same client"""
        client_id = attrs.get('client_id')
        plate = attrs.get('plate')
        
        if self.instance:
            # Update case
            existing_car = Car.objects.filter(
                client_id=client_id, 
                plate=plate
            ).exclude(id=self.instance.id).first()
        else:
            # Create case
            existing_car = Car.objects.filter(
                client_id=client_id, 
                plate=plate
            ).first()
        
        if existing_car:
            raise serializers.ValidationError(
                "This client already has a car with this plate number"
            )
        
        return attrs


class WorkOrderSerializer(serializers.ModelSerializer):
    """Serializer for WorkOrder model"""
    client_id = serializers.IntegerField(write_only=True)
    car_id = serializers.IntegerField(write_only=True)
    client = ClientSerializer(read_only=True)
    car = CarSerializer(read_only=True)
    technician = UserSerializer(read_only=True)
    technician_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = WorkOrder
        fields = [
            'id', 'client_id', 'car_id', 'client', 'car', 'complaint',
            'deposit', 'services', 'oil_change', 'oil_confirmed',
            'wash_confirmed', 'status', 'technician', 'technician_id',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_at']
    
    def update(self, instance, validated_data):
        """Handle completed_at field when status changes to completed"""
        if validated_data.get('status') == WorkOrder.Status.COMPLETED and not instance.completed_at:
            from django.utils import timezone
            validated_data['completed_at'] = timezone.now()
        return super().update(instance, validated_data)


class TechReportSerializer(serializers.ModelSerializer):
    """Serializer for TechReport model"""
    work_order_id = serializers.IntegerField(write_only=True)
    work_order = WorkOrderSerializer(read_only=True)
    technician = UserSerializer(read_only=True)
    
    class Meta:
        model = TechReport
        fields = [
            'id', 'work_order_id', 'work_order', 'technician',
            'work_description', 'time_spent', 'used_parts', 'services',
            'wash_type', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StockItemSerializer(serializers.ModelSerializer):
    """Serializer for StockItem model"""
    
    class Meta:
        model = StockItem
        fields = [
            'id', 'item', 'serial', 'buy_price', 'sell_price',
            'quantity', 'is_oil', 'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_serial(self, value):
        """Validate serial uniqueness"""
        if self.instance and self.instance.serial == value:
            return value
        if StockItem.objects.filter(serial=value).exists():
            raise serializers.ValidationError("Serial number already exists")
        return value


class StockItemQuantitySerializer(serializers.ModelSerializer):
    """Serializer for updating stock item quantity only"""
    
    class Meta:
        model = StockItem
        fields = ['quantity']
    
    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Quantity cannot be negative")
        return value


class ServiceSerializer(serializers.ModelSerializer):
    """Serializer for Service model"""
    
    class Meta:
        model = Service
        fields = [
            'id', 'name', 'description', 'price', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BillingSerializer(serializers.ModelSerializer):
    """Serializer for Billing model"""
    work_order_id = serializers.IntegerField(write_only=True)
    work_order = WorkOrderSerializer(read_only=True)
    
    class Meta:
        model = Billing
        fields = [
            'id', 'work_order_id', 'work_order', 'parts_cost',
            'services_cost', 'wash_cost', 'labor_cost', 'oil_change_cost',
            'subtotal', 'tax', 'deposit', 'total', 'paid',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# Authentication Serializers
class LoginSerializer(serializers.Serializer):
    """Serializer for login"""
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include username and password')


class RefreshTokenSerializer(serializers.Serializer):
    """Serializer for token refresh"""
    refresh_token = serializers.CharField()
