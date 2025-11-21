import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../contexts/DataContext'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { FileText, TrendingUp, DollarSign, Calendar, Download, Filter } from 'lucide-react'
import { toast } from 'sonner'
import api, { reportsAPI } from '../services/api'

const Reports = ({ user, onLogout }) => {
  const { t:_t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({})
  const [dailyWorkOrders, setDailyWorkOrders] = useState([])
  const [monthlyProfits, setMonthlyProfits] = useState([])
  const [popularOils, setPopularOils] = useState([])
  const [washTypes, setWashTypes] = useState([])
  const [dateRange, setDateRange] = useState('last_30_days')
  const { lastUpdate } = useData()
  const stockLastUpdate = lastUpdate?.stock

  useEffect(() => {
    fetchReports()
  }, [dateRange, stockLastUpdate])

  const fetchReports = async () => {
    try {
      setLoading(true)
      // Fetch primary datasets from local test API (localStorage-backed)
      const [workOrdersData, clientsData, billingData, dailyData, profitData, oilData] = await Promise.all([
        api.getWorkOrders(),
        api.getClients(),
        api.getBilling(),
        reportsAPI.getDailyWorkOrders(),
        // reportsAPI method name is singular in the test API
        reportsAPI.getMonthlyProfit(),
        reportsAPI.getPopularOils(),
      ])

      // Compute KPIs locally (total revenue, total work orders, avg order value, active clients)
      const totalRevenue = Array.isArray(billingData) ? billingData.reduce((s, b) => s + (b.total || 0), 0) : 0
      const totalWorkOrders = Array.isArray(workOrdersData) ? workOrdersData.length : 0
      const averageOrderValue = billingData && billingData.length ? totalRevenue / billingData.length : 0
      const activeClients = Array.isArray(clientsData) ? clientsData.length : 0

      setKpis({
        total_revenue: totalRevenue,
        total_work_orders: totalWorkOrders,
        average_order_value: Number(averageOrderValue.toFixed(2)),
        active_clients: activeClients,
      })

      // Set charts data
      setDailyWorkOrders(Array.isArray(dailyData) ? dailyData : [])
      setMonthlyProfits(Array.isArray(profitData) ? profitData : [])

      // Popular oils may return { oil, count } — normalize to { name, count }
      const normalizedOils = Array.isArray(oilData)
        ? oilData.map((o) => ({ name: o.oil || o.name || 'Unknown', count: o.count || 0 }))
        : []
      setPopularOils(normalizedOils)

      // Compute wash types from work orders (fallback when reportsAPI doesn't provide wash types)
      const washCounts = {}
      if (Array.isArray(workOrdersData)) {
        workOrdersData.forEach((wo) => {
          const type = wo.wash_type || (wo.tech_report && wo.tech_report.wash_type) || null
          if (type) {
            const key = String(type)
            washCounts[key] = (washCounts[key] || 0) + 1
          } else if (Array.isArray(wo.services)) {
            // try detect wash service names
            wo.services.forEach((s) => {
              if (/wash|غسيل|غسل/i.test(String(s))) {
                const key = String(s)
                washCounts[key] = (washCounts[key] || 0) + 1
              }
            })
          }
        })
      }

      const washArray = Object.entries(washCounts).map(([type, count]) => ({ type, count }))
      setWashTypes(washArray)

      // inventory data is handled in Store; Reports no longer fetches stock here
      
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('خطأ في جلب التقارير')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = (type) => {
    toast.success(`تم تصدير تقرير ${type} بنجاح`)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout} title="التقارير">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout} title="التقارير">
      <div className="space-y-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">التقارير والتحليلات</h1>
            <p className="text-gray-600">تحليل شامل لأداء مركز الخدمة</p>
          </div>
          <div className="flex space-x-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="اختر الفترة الزمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_7_days">آخر 7 أيام</SelectItem>
                <SelectItem value="last_30_days">آخر 30 يوم</SelectItem>
                <SelectItem value="last_3_months">آخر 3 أشهر</SelectItem>
                <SelectItem value="last_year">آخر سنة</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => exportReport('شامل')}>
              <Download className="h-4 w-4 mr-2" />
              تصدير التقرير
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold">${kpis.total_revenue || 0}</p>
                  {/* <p className="text-xs text-green-600">+12% من الشهر الماضي</p> */}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">أوامر العمل</p>
                  <p className="text-2xl font-bold">{kpis.total_work_orders || 0}</p>
                  {/* <p className="text-xs text-blue-600">+8% من الشهر الماضي</p> */}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">متوسط قيمة الطلب</p>
                  <p className="text-2xl font-bold">${kpis.average_order_value || 0}</p>
                  {/* <p className="text-xs text-purple-600">+5% من الشهر الماضي</p> */}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">العملاء النشطون</p>
                  <p className="text-2xl font-bold">{kpis.active_clients || 0}</p>
                  {/* <p className="text-xs text-orange-600">+15% من الشهر الماضي</p> */}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="financial">التقارير المالية</TabsTrigger>
            <TabsTrigger value="operational">التقارير التشغيلية</TabsTrigger>
            {/* <TabsTrigger value="inventory">تقارير المخزون</TabsTrigger> */}
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Work Orders Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>أوامر العمل اليومية</CardTitle>
                  <CardDescription>عدد أوامر العمل المكتملة يومياً</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyWorkOrders}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Popular Oils Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>الزيوت الأكثر شيوعاً</CardTitle>
                  <CardDescription>أنواع الزيوت الأكثر استخداماً</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={popularOils}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {popularOils.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="financial">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Profits Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>الأرباح الشهرية</CardTitle>
                  <CardDescription>اتجاه الأرباح على مدار الأشهر</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyProfits}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="profit" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>تفصيل الإيرادات</CardTitle>
                  <CardDescription>مصادر الإيرادات المختلفة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>خدمات الصيانة</span>
                      <span className="font-bold">${(kpis.total_revenue * 0.6).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>تغيير الزيوت</span>
                      <span className="font-bold">${(kpis.total_revenue * 0.25).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>خدمات الغسيل</span>
                      <span className="font-bold">${(kpis.total_revenue * 0.15).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="operational">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Wash Types Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>أنواع الغسيل الشائعة</CardTitle>
                  <CardDescription>خدمات الغسيل الأكثر طلباً</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={washTypes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>مؤشرات الأداء</CardTitle>
                  <CardDescription>مقاييس الأداء التشغيلي</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>متوسط وقت الخدمة</span>
                      <span className="font-bold">2.5 ساعة</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>معدل رضا العملاء</span>
                      <span className="font-bold">95%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>معدل إكمال الطلبات</span>
                      <span className="font-bold">98%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>متوسط الانتظار</span>
                      <span className="font-bold">15 دقيقة</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          
        </Tabs>
      </div>
    </Layout>
  )
}

export default Reports
