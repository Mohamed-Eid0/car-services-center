import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import {
  Car,
  Droplets,
  Wrench,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Users,
  Package
} from 'lucide-react'
import { kpis, reports, workOrders, clients, cars } from '../services/api'
import { useTranslation } from 'react-i18next'

const SuperAdminDashboard = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  
  const kpiCards = [
    {
      title: t('superAdminDashboard.carsWashedToday'),
      value: kpis.carsWashedToday,
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: t('superAdminDashboard.oilChangesToday'),
      value: kpis.carsOilChangedToday,
      icon: Droplets,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: t('superAdminDashboard.carsMaintainedToday'),
      value: kpis.carsMaintainedToday,
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: t('superAdminDashboard.carsInCenter'),
      value: kpis.carsCurrentlyInCenter,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: t('superAdminDashboard.pendingOrders'),
      value: kpis.carsPending,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: t('superAdminDashboard.completedToday'),
      value: kpis.carsCompleted,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    }
  ]

  const overallStats = [
    {
      title: t('superAdminDashboard.totalClients'),
      value: clients.length,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: t('superAdminDashboard.totalVehicles'),
      value: cars.length,
      icon: Car,
      color: 'text-green-600'
    },
    {
      title: t('superAdminDashboard.totalWorkOrders'),
      value: workOrders.length,
      icon: Wrench,
      color: 'text-orange-600'
    },
    {
      title: t('superAdminDashboard.monthlyRevenue'),
      value: '$12,450',
      icon: DollarSign,
      color: 'text-purple-600'
    }
  ]

  return (
    <Layout user={user} onLogout={onLogout} title={t('superAdminDashboard.title')}>
      <div className="space-y-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            {t('superAdminDashboard.welcomeBack', { first_name: user.first_name || user.username })}!
          </h2>
          <p className="text-purple-100">
            {t('superAdminDashboard.overviewDescription')}
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {overallStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Daily KPIs */}
        <Card>
          <CardHeader>
            <CardTitle>{t('superAdminDashboard.todayKpis')}</CardTitle>
            <CardDescription>
              {t('superAdminDashboard.realtimeMetrics')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {kpiCards.map((kpi, index) => {
                const Icon = kpi.icon
                return (
                  <div key={index} className="text-center">
                    <div className={`mx-auto w-12 h-12 ${kpi.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className={`h-6 w-6 ${kpi.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                    <p className="text-sm text-gray-600">{kpi.title}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Work Orders Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>{t('superAdminDashboard.workOrdersTrend')}</span>
              </CardTitle>
              <CardDescription>
                {t('superAdminDashboard.dailyWorkOrdersPastWeek')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reports.dailyWorkOrders}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Profit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>{t('superAdminDashboard.monthlyProfit')}</span>
              </CardTitle>
              <CardDescription>
                {t('superAdminDashboard.profitTrendsPastMonths')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reports.monthlyProfit}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, t('superAdminDashboard.profit')]} />
                  <Bar dataKey="profit" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Popular Services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular Oils */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Droplets className="h-5 w-5" />
                <span>{t('superAdminDashboard.mostPopularOils')}</span>
              </CardTitle>
              <CardDescription>
                {t('superAdminDashboard.topSellingOilBrands')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reports.popularOils} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="oil" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Wash Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="h-5 w-5" />
                <span>{t('superAdminDashboard.popularWashTypes')}</span>
              </CardTitle>
              <CardDescription>
                {t('superAdminDashboard.mostRequestedWashServices')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reports.washTypes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('superAdminDashboard.quickActions')}</CardTitle>
            <CardDescription>
              {t('superAdminDashboard.administrativeTools')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button 
                className="h-16 flex-col space-y-2"
                onClick={() => navigate('/user-management')}
              >
                <Users className="h-6 w-6" />
                <span>{t('superAdminDashboard.userManagement')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex-col space-y-2"
                onClick={() => navigate('/store')}
              >
                <Package className="h-6 w-6" />
                <span>{t('superAdminDashboard.inventory')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex-col space-y-2"
                onClick={() => navigate('/reports')}
              >
                <TrendingUp className="h-6 w-6" />
                <span>{t('superAdminDashboard.reports')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex-col space-y-2"
                onClick={() => navigate('/billing')}
              >
                <DollarSign className="h-6 w-6" />
                <span>{t('superAdminDashboard.financial')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default SuperAdminDashboard

