from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.db.models import Q, Count, Sum
from datetime import datetime, timedelta

from .models import (
    User, Client, Car, WorkOrder, TechReport, 
    StockItem, Service, Billing
)
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    ClientSerializer, CarSerializer, WorkOrderSerializer,
    TechReportSerializer, StockItemSerializer, StockItemQuantitySerializer,
    ServiceSerializer, BillingSerializer, LoginSerializer, RefreshTokenSerializer
)


# Authentication Views
class LoginView(APIView):
    """Login endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'token_type': 'bearer',
                'user': UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """Logout endpoint"""
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Logged out successfully'})
        except Exception:
            return Response({'message': 'Logged out successfully'})


class CurrentUserView(APIView):
    """Get current user endpoint"""
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class RefreshTokenView(APIView):
    """Refresh token endpoint"""
    
    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        if serializer.is_valid():
            try:
                refresh = RefreshToken(serializer.validated_data['refresh_token'])
                return Response({
                    'access_token': str(refresh.access_token),
                    'refresh_token': str(refresh),
                    'token_type': 'bearer'
                })
            except Exception:
                return Response(
                    {'error': 'Invalid refresh token'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Model ViewSets
class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for User model"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer


class ClientViewSet(viewsets.ModelViewSet):
    """ViewSet for Client model"""
    queryset = Client.objects.all()
    serializer_class = ClientSerializer


class CarViewSet(viewsets.ModelViewSet):
    """ViewSet for Car model"""
    queryset = Car.objects.select_related('client').all()
    serializer_class = CarSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        client_id = self.request.query_params.get('client_id')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        return queryset


class WorkOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for WorkOrder model"""
    queryset = WorkOrder.objects.select_related('client', 'car', 'technician').all()
    serializer_class = WorkOrderSerializer
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign work order to technician"""
        work_order = self.get_object()
        technician_id = request.data.get('technician_id')
        
        if not technician_id:
            return Response(
                {'error': 'technician_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            technician = User.objects.get(id=technician_id, role=User.Role.TECHNICIAN)
        except User.DoesNotExist:
            return Response(
                {'error': 'Technician not found'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        work_order.technician = technician
        work_order.status = WorkOrder.Status.ASSIGNED
        work_order.save()
        
        serializer = self.get_serializer(work_order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def start_work(self, request, pk=None):
        """Start work on assigned work order"""
        work_order = self.get_object()
        
        if not work_order.technician:
            return Response(
                {'error': 'Work order must be assigned to a technician first'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set other work orders for this technician to pending
        WorkOrder.objects.filter(
            technician=work_order.technician,
            status=WorkOrder.Status.IN_PROGRESS
        ).exclude(id=work_order.id).update(status=WorkOrder.Status.PENDING)
        
        work_order.status = WorkOrder.Status.IN_PROGRESS
        work_order.save()
        
        serializer = self.get_serializer(work_order)
        return Response(serializer.data)


class TechReportViewSet(viewsets.ModelViewSet):
    """ViewSet for TechReport model"""
    queryset = TechReport.objects.select_related('work_order', 'technician').all()
    serializer_class = TechReportSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        work_order_id = self.request.query_params.get('work_order_id')
        if work_order_id:
            queryset = queryset.filter(work_order_id=work_order_id)
        return queryset
    
    def perform_create(self, serializer):
        """Set technician to current user"""
        serializer.save(technician=self.request.user)


class StockItemViewSet(viewsets.ModelViewSet):
    """ViewSet for StockItem model"""
    queryset = StockItem.objects.all()
    serializer_class = StockItemSerializer
    
    @action(detail=False, methods=['get'])
    def oils(self, request):
        """Get all oil items"""
        oils = StockItem.objects.filter(is_oil=True)
        serializer = self.get_serializer(oils, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def quantity(self, request, pk=None):
        """Update stock item quantity"""
        stock_item = self.get_object()
        serializer = StockItemQuantitySerializer(stock_item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ServiceViewSet(viewsets.ModelViewSet):
    """ViewSet for Service model"""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active services only"""
        active_services = Service.objects.filter(is_active=True)
        serializer = self.get_serializer(active_services, many=True)
        return Response(serializer.data)


class BillingViewSet(viewsets.ModelViewSet):
    """ViewSet for Billing model"""
    queryset = Billing.objects.select_related('work_order').all()
    serializer_class = BillingSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        work_order_id = self.request.query_params.get('work_order_id')
        if work_order_id:
            queryset = queryset.filter(work_order_id=work_order_id)
        return queryset
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate billing from work order"""
        work_order_id = request.data.get('work_order_id')
        
        if not work_order_id:
            return Response(
                {'error': 'work_order_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            work_order = WorkOrder.objects.get(id=work_order_id)
        except WorkOrder.DoesNotExist:
            return Response(
                {'error': 'Work order not found'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tech_report = TechReport.objects.get(work_order=work_order)
        except TechReport.DoesNotExist:
            return Response(
                {'error': 'Tech report not found'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate costs
        parts_cost = 0
        if tech_report.used_parts:
            for used_part in tech_report.used_parts:
                part_id = used_part.get('partId', used_part) if isinstance(used_part, dict) else used_part
                quantity = used_part.get('quantity', 1) if isinstance(used_part, dict) else 1
                
                try:
                    part = StockItem.objects.get(id=part_id)
                    parts_cost += part.sell_price * quantity
                    
                    # Update stock quantity
                    if part.quantity >= quantity:
                        part.quantity -= quantity
                        part.save()
                except StockItem.DoesNotExist:
                    continue
        
        services_cost = 0
        if tech_report.services:
            for service_id in tech_report.services:
                try:
                    service = Service.objects.get(id=service_id)
                    services_cost += service.price
                except Service.DoesNotExist:
                    continue
        
        # Wash cost
        wash_types = {
            1: 30,  # غسيل داخلي
            2: 25,  # غسيل خارجي
            3: 50,  # غسيل شامل
            4: 75   # غسيل كيميائي
        }
        wash_cost = wash_types.get(tech_report.wash_type, 0)
        
        # Labor cost
        labor_cost = tech_report.time_spent * 50 if tech_report.time_spent else 0
        
        subtotal = parts_cost + services_cost + wash_cost + labor_cost
        tax = subtotal * 0.14  # 14% tax
        total = subtotal + tax - work_order.deposit
        
        # Create billing
        billing_data = {
            'work_order_id': work_order.id,
            'parts_cost': parts_cost,
            'services_cost': services_cost,
            'wash_cost': wash_cost,
            'labor_cost': labor_cost,
            'oil_change_cost': 0,
            'subtotal': subtotal,
            'tax': tax,
            'deposit': work_order.deposit,
            'total': total,
            'paid': False
        }
        
        serializer = self.get_serializer(data=billing_data)
        if serializer.is_valid():
            billing = serializer.save()
            
            # Update work order status
            work_order.status = WorkOrder.Status.COMPLETED
            work_order.completed_at = timezone.now()
            work_order.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
