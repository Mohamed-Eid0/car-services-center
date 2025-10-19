import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, Plus, Eye, FileText, Search, Calendar, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { billingAPI, workOrdersAPI } from '../services/api'
import { useData } from '../contexts/DataContext'

const Billing = ({ user, onLogout }) => {
  const { i18n } = useTranslation()
  const { invalidateBilling, invalidateWorkOrders } = useData()
  const [billings, setBillings] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedBilling, setSelectedBilling] = useState(null)
  const [formData, setFormData] = useState({
    work_order_id: '',
    technician_fare: 0,
    parts_total: 0,
    oil_total: 0,
    wash_total: 0,
    total: 0
  })

  useEffect(() => {
    fetchBillings()
    fetchWorkOrders()
  }, [])

  const fetchBillings = async () => {
    try {
      setLoading(true)
      const data = await billingAPI.getAll()
      // Fetch related data for each billing
      const billingWithDetails = await Promise.all(
        (data || []).map(async (billing) => {
          try {
            const workOrder = await workOrdersAPI.getById(billing.work_order_id)
            return { ...billing, work_order: workOrder }
          } catch (error) {
            console.error(`Error fetching work order ${billing.work_order_id}:`, error)
            return billing
          }
        })
      )
      setBillings(billingWithDetails)
    } catch (error) {
      console.error('Error fetching billings:', error)
      toast.error('خطأ في جلب الفواتير')
      setBillings([])
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkOrders = async () => {
    try {
      const [ordersData, billingsData] = await Promise.all([
        workOrdersAPI.getAll(),
        billingAPI.getAll()
      ])
      
      // Filter completed work orders that don't have billing yet
      const completedOrders = (ordersData || []).filter(wo => 
        wo.status?.toLowerCase() === 'completed' &&
        !billingsData.find(b => b.work_order_id === wo.id)
      )
      
      setWorkOrders(completedOrders)
    } catch (error) {
      console.error('Error fetching work orders:', error)
      setWorkOrders([])
    }
  }

  const handleCreateBilling = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.work_order_id) {
      toast.error('الرجاء اختيار أمر العمل')
      return
    }
    
    // Calculate total
    const calculatedTotal = 
      parseFloat(formData.technician_fare || 0) +
      parseFloat(formData.parts_total || 0) +
      parseFloat(formData.oil_total || 0) +
      parseFloat(formData.wash_total || 0)
    
    if (calculatedTotal <= 0) {
      toast.error('الإجمالي يجب أن يكون أكبر من صفر')
      return
    }
    
    try {
      const billingData = {
        work_order_id: parseInt(formData.work_order_id),
        technician_fare: parseFloat(formData.technician_fare || 0),
        parts_total: parseFloat(formData.parts_total || 0),
        oil_total: parseFloat(formData.oil_total || 0),
        wash_total: parseFloat(formData.wash_total || 0),
        total: calculatedTotal
      }
      
      // Verify the total matches
      const verifyTotal = billingData.technician_fare + billingData.parts_total + billingData.oil_total + billingData.wash_total
      if (Math.abs(verifyTotal - billingData.total) > 0.01) {
        toast.error('خطأ في حساب الإجمالي')
        return
      }
      
      await billingAPI.create(billingData)
      toast.success('تم إنشاء الفاتورة بنجاح')
      invalidateBilling()
      invalidateWorkOrders() // Billing affects work order status
      setIsCreateDialogOpen(false)
      resetForm()
      fetchBillings()
      fetchWorkOrders()
    } catch (error) {
      console.error('Error creating billing:', error)
      toast.error(error.message || 'خطأ في إنشاء الفاتورة')
    }
  }

  const openViewDialog = (billing) => {
    setSelectedBilling(billing)
    setIsViewDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      work_order_id: '',
      technician_fare: 0,
      parts_total: 0,
      oil_total: 0,
      wash_total: 0,
      total: 0
    })
  }

  const calculateTotal = () => {
    return formData.technician_fare + formData.parts_total + formData.oil_total + formData.wash_total
  }

  const filteredBillings = billings.filter(billing =>
    billing.work_order?.client?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    billing.work_order?.client?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    billing.work_order?.car?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    billing.work_order?.car?.model?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalRevenue = billings.reduce((sum, billing) => sum + billing.total, 0)
  const averageBill = billings.length > 0 ? totalRevenue / billings.length : 0
  const thisMonthBillings = billings.filter(billing => {
    const billDate = new Date(billing.created_at)
    const now = new Date()
    return billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear()
  })
  const monthlyRevenue = thisMonthBillings.reduce((sum, billing) => sum + billing.total, 0)

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout} title="إدارة الفواتير">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout} title="إدارة الفواتير">
      <div className="space-y-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">عدد الفواتير</p>
                  <p className="text-2xl font-bold">{billings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">متوسط الفاتورة</p>
                  <p className="text-2xl font-bold">${averageBill.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">إيرادات الشهر</p>
                  <p className="text-2xl font-bold">${monthlyRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  <span>إدارة الفواتير</span>
                </CardTitle>
                <CardDescription>
                  إنشاء وإدارة فواتير أوامر العمل المكتملة
                </CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    إنشاء فاتورة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
                    <DialogDescription>
                      املأ تفاصيل الفاتورة لأمر العمل المكتمل
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateBilling}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="work_order" className="text-right">
                          أمر العمل
                        </Label>
                        <Select
                          value={formData.work_order_id}
                          onValueChange={(value) => setFormData({ ...formData, work_order_id: parseInt(value) })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="اختر أمر العمل" />
                          </SelectTrigger>
                          <SelectContent>
                            {workOrders.map((wo) => (
                              <SelectItem key={wo.id} value={wo.id.toString()}>
                                {`${wo.client?.first_name} ${wo.client?.last_name} - ${wo.car?.make} ${wo.car?.model}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="technician_fare" className="text-right">
                          أجرة الفني
                        </Label>
                        <Input
                          id="technician_fare"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.technician_fare}
                          onChange={(e) => setFormData({ ...formData, technician_fare: parseFloat(e.target.value) || 0 })}
                          className="col-span-3"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="parts_total" className="text-right">
                          قطع الغيار
                        </Label>
                        <Input
                          id="parts_total"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.parts_total}
                          onChange={(e) => setFormData({ ...formData, parts_total: parseFloat(e.target.value) || 0 })}
                          className="col-span-3"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="oil_total" className="text-right">
                          الزيوت
                        </Label>
                        <Input
                          id="oil_total"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.oil_total}
                          onChange={(e) => setFormData({ ...formData, oil_total: parseFloat(e.target.value) || 0 })}
                          className="col-span-3"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="wash_total" className="text-right">
                          الغسيل
                        </Label>
                        <Input
                          id="wash_total"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.wash_total}
                          onChange={(e) => setFormData({ ...formData, wash_total: parseFloat(e.target.value) || 0 })}
                          className="col-span-3"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right font-bold">
                          الإجمالي
                        </Label>
                        <div className="col-span-3 font-bold text-lg">
                          ${calculateTotal().toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button type="submit">إنشاء الفاتورة</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث في الفواتير..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">جميع الفواتير</TabsTrigger>
                <TabsTrigger value="recent">الفواتير الحديثة</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>السيارة</TableHead>
                      <TableHead>أجرة الفني</TableHead>
                      <TableHead>قطع الغيار</TableHead>
                      <TableHead>الزيوت</TableHead>
                      <TableHead>الغسيل</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBillings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <DollarSign className="h-12 w-12 mb-3 text-gray-400" />
                            <p className="text-lg font-medium">لا توجد فواتير</p>
                            <p className="text-sm mt-1">
                              {searchTerm ? 'لم يتم العثور على فواتير بهذا البحث' : 'ابدأ بإنشاء فاتورة جديدة'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBillings.map((billing) => (
                      <TableRow key={billing.id}>
                        <TableCell className="font-medium">#{billing.id}</TableCell>
                        <TableCell>
                          {billing.work_order?.client ? 
                            `${billing.work_order.client.first_name} ${billing.work_order.client.last_name}` : 
                            'غير محدد'
                          }
                        </TableCell>
                        <TableCell>
                          {billing.work_order?.car ? 
                            `${billing.work_order.car.make} ${billing.work_order.car.model}` : 
                            'غير محدد'
                          }
                        </TableCell>
                        <TableCell>${billing.technician_fare}</TableCell>
                        <TableCell>${billing.parts_total}</TableCell>
                        <TableCell>${billing.oil_total}</TableCell>
                        <TableCell>${billing.wash_total}</TableCell>
                        <TableCell className="font-bold">${billing.total}</TableCell>
                        <TableCell>
                          {new Date(billing.created_at).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewDialog(billing)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="recent">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {thisMonthBillings.slice(0, 10).map((billing) => (
                      <TableRow key={billing.id}>
                        <TableCell className="font-medium">#{billing.id}</TableCell>
                        <TableCell>
                          {billing.work_order?.client ? 
                            `${billing.work_order.client.first_name} ${billing.work_order.client.last_name}` : 
                            'غير محدد'
                          }
                        </TableCell>
                        <TableCell className="font-bold">${billing.total}</TableCell>
                        <TableCell>
                          {new Date(billing.created_at).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewDialog(billing)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* View Billing Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تفاصيل الفاتورة #{selectedBilling?.id}</DialogTitle>
              <DialogDescription>
                عرض تفاصيل الفاتورة الكاملة
              </DialogDescription>
            </DialogHeader>
            {selectedBilling && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">العميل</Label>
                    <p className="text-sm">
                      {selectedBilling.work_order?.client ? 
                        `${selectedBilling.work_order.client.first_name} ${selectedBilling.work_order.client.last_name}` : 
                        'غير محدد'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">السيارة</Label>
                    <p className="text-sm">
                      {selectedBilling.work_order?.car ? 
                        `${selectedBilling.work_order.car.make} ${selectedBilling.work_order.car.model}` : 
                        'غير محدد'
                      }
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">أجرة الفني</Label>
                    <p className="text-sm font-bold">${selectedBilling.technician_fare}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">قطع الغيار</Label>
                    <p className="text-sm font-bold">${selectedBilling.parts_total}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">الزيوت</Label>
                    <p className="text-sm font-bold">${selectedBilling.oil_total}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">الغسيل</Label>
                    <p className="text-sm font-bold">${selectedBilling.wash_total}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-lg font-bold">الإجمالي</Label>
                    <p className="text-lg font-bold text-green-600">${selectedBilling.total}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">تاريخ الإنشاء</Label>
                  <p className="text-sm">
                    {new Date(selectedBilling.created_at).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>إغلاق</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}

export default Billing
