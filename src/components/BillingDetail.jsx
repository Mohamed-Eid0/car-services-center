import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Car, User, Wrench, Clock, Package, DollarSign, Droplets, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import api from '../services/api'

const washTypes = [
  { id: 1, name: 'غسيل داخلي', price: 30 },
  { id: 2, name: 'غسيل خارجي', price: 25 },
  { id: 3, name: 'غسيل شامل', price: 50 },
  { id: 4, name: 'غسيل كيميائي', price: 75 }
]

const BillingDetail = ({ user, onLogout }) => {
  const { i18n } = useTranslation()
  const { workOrderId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [workOrder, setWorkOrder] = useState(null)
  const [techReport, setTechReport] = useState(null)
  const [client, setClient] = useState(null)
  const [car, setCar] = useState(null)
  const [stock, setStock] = useState([])
  const [services, setServices] = useState([])
  const [laborCost, setLaborCost] = useState(0)
  const [oilChangeCost, setOilChangeCost] = useState(0)

  const fetchData = async () => {
    try {
      // Fetch work order
      const woData = await api.getWorkOrder(parseInt(workOrderId))
      setWorkOrder(woData)

      // Fetch tech report
      const techReportData = await api.getTechReportByWorkOrder(parseInt(workOrderId))
      setTechReport(techReportData)

      // Calculate labor cost from time spent
      setLaborCost(techReportData.time_spent ? techReportData.time_spent * 50 : 0)

      // Fetch client and car
      const [clientData, carData] = await Promise.all([
        api.getClient(woData.client_id),
        api.getCar(woData.car_id)
      ])
      setClient(clientData)
      setCar(carData)

      // Fetch all stock and services for reference
      const [stockData, servicesData] = await Promise.all([
        api.getStock(),
        api.getServices()
      ])
      setStock(stockData)
      setServices(servicesData)

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrderId])

  const handleGenerateBilling = async () => {
    try {
      // Update labor cost and oil change cost in a custom billing
      const usedParts = techReport.used_parts || []
      const usedServices = techReport.services || []
      
      // Calculate parts cost
      let partsTotal = 0
      usedParts.forEach(usedPart => {
        const partId = usedPart.partId || usedPart
        const quantity = usedPart.quantity || 1
        const part = stock.find(s => s.id === partId)
        if (part) {
          partsTotal += part.sell_price * quantity
        }
      })

      // Calculate services cost
      let servicesTotal = 0
      usedServices.forEach(serviceId => {
        const service = services.find(s => s.id === serviceId)
        if (service) {
          servicesTotal += service.price
        }
      })

      // Wash cost
      const washType = washTypes.find(w => w.id === parseInt(techReport.wash_type))
      const washCost = washType ? washType.price : 0

      // Calculate totals
      const subtotal = partsTotal + servicesTotal + washCost + laborCost + oilChangeCost
      const tax = subtotal * 0.14
      const total = subtotal + tax - (workOrder.deposit || 0)

      // Create billing
      const billingData = {
        work_order_id: workOrder.id,
        parts_cost: partsTotal,
        services_cost: servicesTotal,
        wash_cost: washCost,
        labor_cost: laborCost,
        oil_change_cost: oilChangeCost,
        subtotal: subtotal,
        tax: tax,
        deposit: workOrder.deposit || 0,
        total: total,
        paid: false
      }

      await api.createBilling(billingData)

      // Update work order status if needed
      if (workOrder.status !== 'completed') {
        await api.updateWorkOrder(workOrder.id, {
          status: 'completed',
          completed_at: new Date().toISOString()
        })
      }

      // Note: Stock quantities are already deducted when technician created the work record
      // No need to deduct again here

      toast.success('تم إنشاء الفاتورة بنجاح')
      navigate('/billing')
    } catch (error) {
      console.error('Error generating billing:', error)
      toast.error('خطأ في إنشاء الفاتورة: ' + error.message)
    }
  }

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout} title="إنشاء فاتورة">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!workOrder || !techReport) {
    return (
      <Layout user={user} onLogout={onLogout} title="إنشاء فاتورة">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">لم يتم العثور على بيانات أمر العمل</p>
            <Button onClick={() => navigate('/billing')} className="mt-4">
              العودة إلى الفواتير
            </Button>
          </CardContent>
        </Card>
      </Layout>
    )
  }

  // Get used parts with details
  const usedPartsData = (techReport.used_parts || []).map(usedPart => {
    const partId = usedPart.partId || usedPart
    const quantity = usedPart.quantity || 1
    const part = stock.find(s => s.id === partId)
    return part ? { ...part, usedQuantity: quantity } : null
  }).filter(p => p !== null)

  const partsTotal = usedPartsData.reduce((sum, part) => sum + (part.sell_price * part.usedQuantity), 0)

  // Get used services with details
  const usedServicesData = (techReport.services || []).map(serviceId => 
    services.find(s => s.id === serviceId)
  ).filter(s => s !== null)

  const servicesTotal = usedServicesData.reduce((sum, service) => sum + service.price, 0)

  // Wash details
  const selectedWashType = washTypes.find(w => w.id === parseInt(techReport.wash_type))
  const washCost = selectedWashType ? selectedWashType.price : 0

  // Calculate totals
  const subtotal = partsTotal + servicesTotal + washCost + laborCost + oilChangeCost
  const tax = subtotal * 0.14
  const total = subtotal + tax - (workOrder.deposit || 0)

  return (
    <Layout user={user} onLogout={onLogout} title="إنشاء فاتورة">
      <div className="space-y-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Work Order Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">فاتورة أمر العمل #{workOrder.id.toString().padStart(4, '0')}</CardTitle>
                <CardDescription>تفاصيل العمل والتكاليف</CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800">
                مكتمل
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Client Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-5 w-5" />
                  <h3 className="font-semibold">معلومات العميل</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <Label>الاسم</Label>
                    <p>{client?.first_name} {client?.last_name}</p>
                  </div>
                  <div>
                    <Label>رقم الهاتف</Label>
                    <p>{client?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Car Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Car className="h-5 w-5" />
                  <h3 className="font-semibold">معلومات السيارة</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <Label>السيارة</Label>
                    <p>{car?.brand} {car?.model}</p>
                  </div>
                  <div>
                    <Label>رقم اللوحة</Label>
                    <p>{car?.plate}</p>
                  </div>
                  <div>
                    <Label>العداد</Label>
                    <p>{car?.counter} كم</p>
                  </div>
                </div>
              </div>

              {/* Work Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Wrench className="h-5 w-5" />
                  <h3 className="font-semibold">معلومات العمل</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <Label>الشكوى</Label>
                    <p>{workOrder.complaint}</p>
                  </div>
                  <div>
                    <Label>الوقت المستغرق</Label>
                    <p>{techReport.time_spent} ساعة</p>
                  </div>
                  <div>
                    <Label>الإيداع</Label>
                    <p>${workOrder.deposit || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tech Report Details */}
        <Card>
          <CardHeader>
            <CardTitle>تقرير الفني</CardTitle>
            <CardDescription>قطع الغيار والخدمات المستخدمة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Used Parts */}
            {usedPartsData.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">قطع الغيار المستخدمة</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>القطعة</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>سعر الوحدة</TableHead>
                      <TableHead>الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usedPartsData.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell>{part.item}</TableCell>
                        <TableCell>{part.usedQuantity}</TableCell>
                        <TableCell>${part.sell_price}</TableCell>
                        <TableCell className="font-semibold">${part.sell_price * part.usedQuantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Services */}
            {usedServicesData.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">الخدمات المقدمة</h3>
                </div>
                <div className="space-y-2">
                  {usedServicesData.map((service) => (
                    <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>{service.name}</span>
                      <span className="font-semibold">${service.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wash Type */}
            {selectedWashType && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Droplets className="h-5 w-5 text-cyan-600" />
                  <h3 className="font-semibold">خدمة الغسيل</h3>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>{selectedWashType.name}</span>
                  <span className="font-semibold">${selectedWashType.price}</span>
                </div>
              </div>
            )}

            {/* Notes */}
            {techReport.notes && (
              <div>
                <Label>ملاحظات الفني</Label>
                <p className="text-sm text-gray-600 mt-1">{techReport.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Form */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل الفاتورة</CardTitle>
            <CardDescription>قم بتعديل تكلفة العمالة وتغيير الزيت</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="laborCost">تكلفة العمالة (أجر الفني)</Label>
                <Input
                  id="laborCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={laborCost}
                  onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
                <p className="text-sm text-gray-500">
                  الوقت المستغرق: {techReport.time_spent} ساعة × $50/ساعة = ${techReport.time_spent * 50}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="oilChangeCost">تكلفة تغيير الزيت</Label>
                <Input
                  id="oilChangeCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={oilChangeCost}
                  onChange={(e) => setOilChangeCost(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
                <p className="text-sm text-gray-500">
                  أضف التكلفة إذا تم تغيير الزيت
                </p>
              </div>
            </div>

            <Separator />

            {/* Cost Breakdown */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">ملخص التكاليف</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>قطع الغيار:</span>
                  <span>${partsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>الخدمات:</span>
                  <span>${servicesTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>الغسيل:</span>
                  <span>${washCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>العمالة:</span>
                  <span>${laborCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>تغيير الزيت:</span>
                  <span>${oilChangeCost.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>المجموع الفرعي:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>الضريبة (14%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>الإيداع:</span>
                  <span>-${(workOrder.deposit || 0).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>الإجمالي:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleGenerateBilling}
                className="flex-1"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                إنشاء الفاتورة
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/billing')}
                size="lg"
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default BillingDetail
