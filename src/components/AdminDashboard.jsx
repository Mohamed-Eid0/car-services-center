import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DollarSign, Package, CheckCircle, Clock, Users, Car, User as UserIcon, Wrench, Droplets, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

const AdminDashboard = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [workOrders, setWorkOrders] = useState([])
  const [billing, setBilling] = useState([])
  const [stock, setStock] = useState([])
  const [users, setUsers] = useState([])
  const [clients, setClients] = useState([])
  const [cars, setCars] = useState([])
  const [kpis, setKpis] = useState({
    carsWashedToday: 0,
    carsOilChangedToday: 0,
    carsMaintainedToday: 0,
    carsCurrentlyInCenter: 0,
    carsPending: 0,
    carsCompleted: 0,
    totalClients: 0,
    totalVehicles: 0,
    totalWorkOrders: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [workOrdersData, billingData, stockData, usersData, clientsData, carsData, kpisData] = await Promise.all([
        api.getWorkOrders(),
        api.getBilling(),
        api.getStock(),
        api.getUsers(),
        api.getClients(),
        api.getCars(),
        api.getKPIs()
      ])
      setWorkOrders(workOrdersData)
      setBilling(billingData)
      setStock(stockData)
      setUsers(usersData)
      setClients(clientsData)
      setCars(carsData)
      
      // Transform KPIs from snake_case to camelCase
      setKpis({
        carsWashedToday: kpisData.cars_washed_today || 0,
        carsOilChangedToday: kpisData.cars_oil_changed_today || 0,
        carsMaintainedToday: kpisData.cars_maintained_today || 0,
        carsCurrentlyInCenter: kpisData.cars_currently_in_center || 0,
        carsPending: kpisData.cars_pending || 0,
        carsCompleted: kpisData.cars_completed || 0,
        totalClients: clientsData.length || 0,
        totalVehicles: carsData.length || 0,
        totalWorkOrders: workOrdersData.length || 0
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const completedOrders = (workOrders || []).filter(order => order.status?.toLowerCase() === 'completed')
  const pendingBilling = completedOrders.filter(order => 
    !billing.some(bill => bill.work_order_id === order.id)
  )
  
  const totalRevenue = billing.reduce((sum, bill) => sum + bill.total, 0)
  
  // Low stock items: quantity <= minimum_stock (or < 10 as default)
  const lowStockItems = stock.filter(item => {
    const threshold = item.minimum_stock || 10
    return item.quantity <= threshold
  })

  const stats = [
    {
      title: t('adminDashboard.pendingBills'),
      value: pendingBilling.length,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: t('adminDashboard.totalRevenue'),
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-blue-600'
    },
    {
      title: t('adminDashboard.lowStockItems'),
      value: lowStockItems.length,
      icon: Package,
      color: 'text-red-600'
    },
    {
      title: t('adminDashboard.systemUsers'),
      value: users.length,
      icon: Users,
      color: 'text-purple-600'
    }
  ]

  // KPI Cards Data
  const kpiCards = [
    {
      title: 'إجمالي العملاء',
      value: kpis.totalClients,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      path: '/recorded-clients'
    },
    {
      title: 'إجمالي المركبات',
      value: kpis.totalVehicles,
      icon: Car,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      path: '/recorded-clients'
    },
    {
      title: 'إجمالي أوامر العمل',
      value: kpis.totalWorkOrders,
      icon: Wrench,
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      path: '/work-orders'
    },
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

  return (
    <Layout user={user} onLogout={onLogout} title={t('adminDashboard.title')}>
      <div className="space-y-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            {t('adminDashboard.welcomeBack', { first_name: user.first_name || user.username })}!
          </h2>
          <p className="text-blue-100">
            {t('adminDashboard.manageDescription')}
          </p>
        </div>

        {/* KPI Cards - Today's Performance Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>مؤشرات الأداء الرئيسية اليوم</CardTitle>
            <CardDescription>مقاييس في الوقت الفعلي لعمليات اليوم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {kpiCards.map((kpi, index) => {
                const Icon = kpi.icon
                const CardWrapper = kpi.path ? 'button' : 'div'
                const clickProps = kpi.path ? {
                  onClick: () => navigate(kpi.path),
                  className: "flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:shadow-md transition-all hover:scale-105 cursor-pointer w-full"
                } : {
                  className: "flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                }
                
                return (
                  <CardWrapper key={index} {...clickProps}>
                    <div className={`p-3 rounded-full ${kpi.bgColor} mb-3`}>
                      <Icon className={`h-6 w-6 ${kpi.color}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</p>
                      <p className="text-xs text-gray-600 leading-tight">{kpi.title}</p>
                    </div>
                  </CardWrapper>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
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

        {/* Completed Work Orders Ready for Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>{t('adminDashboard.completedWorkOrdersReadyForBilling')}</span>
            </CardTitle>
            <CardDescription>
              إنشاء وإدارة فواتير أوامر العمل المكتملة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : pendingBilling.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {t('adminDashboard.noPendingBills')}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>السيارة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإيداع</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingBilling.map((order) => {
                    const client = clients.find(c => c.id === order.client_id)
                    const car = cars.find(c => c.id === order.car_id)
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          #{order.id.toString().padStart(4, '0')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                            <span>{client ? `${client.first_name} ${client.last_name}` : 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4 text-gray-500" />
                            <span>{car ? `${car.brand} ${car.model} (${car.plate})` : 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            مكتمل
                          </Badge>
                        </TableCell>
                        <TableCell>${order.deposit || 0}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => navigate(`/billing/${order.id}`)}
                          >
                            إنشاء فاتورة
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className={lowStockItems.length > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${lowStockItems.length > 0 ? 'text-red-700' : ''}`}>
              <Package className="h-5 w-5" />
              <span>تنبيه المخزون المنخفض</span>
            </CardTitle>
            <CardDescription className={lowStockItems.length > 0 ? "text-red-600" : ""}>
              العناصر التي تحتاج إلى إعادة تخزين
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">لا توجد عناصر منخفضة المخزون</p>
                <p className="text-sm text-gray-500 mt-1">جميع العناصر فوق الحد الأدنى</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {lowStockItems.map((item) => {
                    const threshold = item.minimum_stock || 10
                    const percentage = (item.quantity / threshold) * 100
                    const isVeryLow = item.quantity === 0
                    const isCritical = item.quantity > 0 && item.quantity <= threshold / 2
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-3 rounded border ${
                          isVeryLow ? 'bg-red-100 border-red-300' : 
                          isCritical ? 'bg-orange-50 border-orange-200' : 
                          'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">{item.item}</p>
                            {isVeryLow && (
                              <Badge variant="destructive" className="text-xs">
                                نفذ من المخزون
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">الرقم التسلسلي: {item.serial}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]">
                              <div 
                                className={`h-2 rounded-full ${
                                  isVeryLow ? 'bg-red-600' : 
                                  isCritical ? 'bg-orange-500' : 
                                  'bg-yellow-500'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {item.quantity} / {threshold}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={isVeryLow ? "destructive" : "secondary"}
                            className={isCritical ? 'bg-orange-500 text-white' : ''}
                          >
                            {item.quantity} متبقي
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {lowStockItems.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => navigate('/store')}
                  >
                    عرض جميع العناصر في المخزن
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default AdminDashboard

