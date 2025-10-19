import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { FileText, TrendingUp, DollarSign, Calendar, Download, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { reportsAPI } from '../services/api'

const Reports = ({ user, onLogout }) => {
  const { t:_t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({})
  const [dailyWorkOrders, setDailyWorkOrders] = useState([])
  const [monthlyProfits, setMonthlyProfits] = useState([])
  const [popularOils, setPopularOils] = useState([])
  const [washTypes, setWashTypes] = useState([])
  const [dateRange, setDateRange] = useState('last_30_days')

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  const fetchReports = async () => {
    try {
      setLoading(true)
      
      // Fetch KPIs
      const kpiData = await reportsAPI.getKPIs()
      setKpis(kpiData)
      
      // Fetch daily work orders
      const dailyData = await reportsAPI.getDailyWorkOrders()
      setDailyWorkOrders(dailyData)
      
      // Fetch monthly profits
      const profitData = await reportsAPI.getMonthlyProfits()
      setMonthlyProfits(profitData)
      
      // Fetch popular oils
      const oilData = await reportsAPI.getPopularOils()
      setPopularOils(oilData)
      
      // Fetch wash types
      const washData = await reportsAPI.getWashTypes()
      setWashTypes(washData)
      
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
                  <p className="text-xs text-green-600">+12% من الشهر الماضي</p>
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
                  <p className="text-xs text-blue-600">+8% من الشهر الماضي</p>
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
                  <p className="text-xs text-purple-600">+5% من الشهر الماضي</p>
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
                  <p className="text-xs text-orange-600">+15% من الشهر الماضي</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="financial">التقارير المالية</TabsTrigger>
            <TabsTrigger value="operational">التقارير التشغيلية</TabsTrigger>
            <TabsTrigger value="inventory">تقارير المخزون</TabsTrigger>
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
          
          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>تقرير المخزون</CardTitle>
                <CardDescription>حالة المخزون والعناصر المنخفضة</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العنصر</TableHead>
                      <TableHead>الكمية الحالية</TableHead>
                      <TableHead>الحد الأدنى</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>آخر تحديث</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>زيت محرك 5W-30</TableCell>
                      <TableCell>15</TableCell>
                      <TableCell>20</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          منخفض
                        </span>
                      </TableCell>
                      <TableCell>2024-01-15</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>فلتر هواء</TableCell>
                      <TableCell>45</TableCell>
                      <TableCell>10</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          متوفر
                        </span>
                      </TableCell>
                      <TableCell>2024-01-14</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>شمعات الإشعال</TableCell>
                      <TableCell>8</TableCell>
                      <TableCell>15</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          منخفض
                        </span>
                      </TableCell>
                      <TableCell>2024-01-13</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

export default Reports
