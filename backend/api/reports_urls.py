from django.urls import path
from .reports_views import ReportsViewSet

urlpatterns = [
    path('kpis/', ReportsViewSet().get_kpis, name='reports-kpis'),
    path('daily-work-orders/', ReportsViewSet().get_daily_work_orders, name='reports-daily-work-orders'),
    path('monthly-profit/', ReportsViewSet().get_monthly_profit, name='reports-monthly-profit'),
    path('popular-oils/', ReportsViewSet().get_popular_oils, name='reports-popular-oils'),
]
