from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Sum, Q
from datetime import datetime, timedelta

from .models import WorkOrder, Billing


class ReportsViewSet(APIView):
    """Reports endpoint"""
    
    def get_kpis(self, request):
        """Get KPIs for dashboard"""
        today = datetime.now().date()
        
        # Today's work orders
        today_orders = WorkOrder.objects.filter(
            created_at__date=today
        )
        
        # Cars washed today
        cars_washed_today = today_orders.filter(wash_confirmed=True).count()
        
        # Cars oil changed today
        cars_oil_changed_today = today_orders.filter(oil_confirmed=True).count()
        
        # Cars maintained today
        cars_maintained_today = today_orders.filter(
            status=WorkOrder.Status.COMPLETED
        ).count()
        
        # Cars currently in center
        cars_currently_in_center = WorkOrder.objects.filter(
            status__in=[WorkOrder.Status.ASSIGNED, WorkOrder.Status.PENDING, WorkOrder.Status.IN_PROGRESS]
        ).count()
        
        # Cars pending
        cars_pending = WorkOrder.objects.filter(
            status=WorkOrder.Status.WAITING
        ).count()
        
        # Cars completed
        cars_completed = WorkOrder.objects.filter(
            status=WorkOrder.Status.COMPLETED
        ).count()
        
        return Response({
            'cars_washed_today': cars_washed_today,
            'cars_oil_changed_today': cars_oil_changed_today,
            'cars_maintained_today': cars_maintained_today,
            'cars_currently_in_center': cars_currently_in_center,
            'cars_pending': cars_pending,
            'cars_completed': cars_completed
        })
    
    def get_daily_work_orders(self, request):
        """Get daily work orders count"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = WorkOrder.objects.all()
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=start_date)
            except ValueError:
                return Response(
                    {'error': 'Invalid start_date format. Use YYYY-MM-DD'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=end_date)
            except ValueError:
                return Response(
                    {'error': 'Invalid end_date format. Use YYYY-MM-DD'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Group by date
        daily_counts = queryset.extra(
            select={'date': 'date(created_at)'}
        ).values('date').annotate(count=Count('id')).order_by('date')
        
        return Response([
            {'date': item['date'], 'count': item['count']} 
            for item in daily_counts
        ])
    
    def get_monthly_profit(self, request):
        """Get monthly profit data"""
        monthly_profits = Billing.objects.extra(
            select={'month': "strftime('%%Y-%%m', created_at)"}
        ).values('month').annotate(profit=Sum('total')).order_by('month')
        
        return Response([
            {'month': item['month'], 'profit': float(item['profit'] or 0)} 
            for item in monthly_profits
        ])
    
    def get_popular_oils(self, request):
        """Get popular oil types"""
        oil_counts = WorkOrder.objects.filter(
            oil_change__isnull=False,
            oil_confirmed=True
        ).values('oil_change').annotate(count=Count('id')).order_by('-count')
        
        return Response([
            {'oil': item['oil_change'], 'count': item['count']} 
            for item in oil_counts
        ])
