import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { DollarSign, Search, Wrench, Car, User, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import api from '../services/api'
import { useData } from '../contexts/DataContext'

const washTypes = [
  { id: 1, name: 'غسيل داخلي', price: 30 },
  { id: 2, name: 'غسيل خارجي', price: 25 },
  { id: 3, name: 'غسيل شامل', price: 50 },
  { id: 4, name: 'غسيل كيميائي', price: 75 }
]

const RecordWork = ({ user, onLogout, isEdit = false }) => {
  const {t: _t, i18n} = useTranslation()
  const { invalidateWorkOrders, invalidateStock, invalidateTechReports } = useData()
  const { workOrderId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [workOrder, setWorkOrder] = useState(null)
  const [spareParts, setSpareParts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedParts, setSelectedParts] = useState([]) // Array of { partId, quantity }
  const [formData, setFormData] = useState({
    washType: '',
    timeSpent: 0,
    notes: '',
    services: []
  })
  const [services, setServices] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchWorkOrder()
        await fetchSpareParts()
        await fetchServices()
        
        if (isEdit && workOrder?.tech_report) {
          // Load existing data when editing
          setFormData({
            washType: workOrder.tech_report.wash_type || '',
            timeSpent: workOrder.tech_report.time_spent || 0,
            notes: workOrder.tech_report.notes || '',
            services: workOrder.tech_report.services || []
          })
          setSelectedParts(workOrder.tech_report.used_parts || [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('خطأ في تحميل البيانات')
      }
    }
    
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrderId, isEdit])

  const fetchServices = async () => {
    try {
      const response = await api.getServices()
      setServices(response || [])
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error('خطأ في جلب الخدمات')
    }
  }

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => {
      const services = prev.services || []
      if (services.includes(serviceId)) {
        return { ...prev, services: services.filter(id => id !== serviceId) }
      }
      return { ...prev, services: [...services, serviceId] }
    })
  }

  const fetchWorkOrder = async () => {
    try {
      const response = await api.getWorkOrder(workOrderId)
      
      // Fetch client and car details
      const [clientData, carData] = await Promise.all([
        api.getClient(response.client_id),
        api.getCar(response.car_id)
      ])
      
      setWorkOrder({
        ...response,
        client: clientData,
        car: carData
      })
    } catch (error) {
      console.error('Error fetching work order:', error)
      toast.error('خطأ في جلب تفاصيل أمر العمل')
    }
  }

  const fetchSpareParts = async () => {
    try {
      setLoading(true)
      const response = await api.getStock()
      setSpareParts(response || [])
    } catch (error) {
      console.error('Error fetching spare parts:', error)
      toast.error('خطأ في جلب قطع الغيار')
    } finally {
      setLoading(false)
    }
  }

  const handlePartSelection = (partId) => {
    setSelectedParts(prev => {
      const existing = prev.find(p => p.partId === partId)
      if (existing) {
        return prev.filter(p => p.partId !== partId)
      }
      return [...prev, { partId, quantity: 1 }]
    })
  }

  const handlePartQuantityChange = (partId, quantity) => {
    setSelectedParts(prev => 
      prev.map(p => p.partId === partId ? { ...p, quantity: Math.max(1, parseInt(quantity) || 1) } : p)
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const techReportData = {
        work_order_id: parseInt(workOrderId), // Ensure it's an integer
        technician_id: user.id,
        time_spent: formData.timeSpent,
        notes: formData.notes,
        used_parts: selectedParts,
        wash_type: formData.washType,
        services: formData.services
      }

      if (isEdit) {
        await api.updateTechReport(workOrder.tech_report.id, techReportData)
        toast.success('تم تحديث العمل بنجاح')
        invalidateTechReports()
        invalidateWorkOrders()
        navigate('/work-orders')
      } else {
        // Create tech report and mark work order as ready for billing
        const createdReport = await api.createTechReport(techReportData)
        console.log('Tech report created:', createdReport)
        
        // Deduct used spare parts from stock immediately
        const stock = await api.getStock()
        for (const usedPart of selectedParts) {
          const partId = usedPart.partId
          const quantity = usedPart.quantity || 1
          const stockItem = stock.find(s => s.id === partId)
          
          if (stockItem && stockItem.quantity >= quantity) {
            await api.updateStockItem(partId, {
              quantity: stockItem.quantity - quantity
            })
            console.log(`Deducted ${quantity} of part ${partId} from stock`)
          } else {
            console.warn(`Insufficient stock for part ${partId}`)
          }
        }
        
        // Update work order status to completed (ready for admin billing)
        await api.updateWorkOrder(parseInt(workOrderId), { 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        
        invalidateTechReports()
        invalidateWorkOrders()
        invalidateStock() // Stock was deducted
        
        toast.success('تم تسجيل العمل بنجاح - جاهز للفوترة')
        
        // Navigate back to work orders
        navigate('/work-orders')
      }
    } catch (error) {
      console.error('Error submitting work record:', error)
      toast.error('خطأ في تسجيل العمل: ' + error.message)
    }
  }

  const filteredParts = spareParts.filter(part =>
    part.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.serial.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedWashType = washTypes.find(type => type.id === parseInt(formData.washType))
  const selectedPartsData = selectedParts.map(sp => ({
    ...spareParts.find(part => part.id === sp.partId),
    quantity: sp.quantity
  })).filter(p => p.id) // Filter out any undefined parts
  
  const selectedServices = services.filter(service => formData.services.includes(service.id))
  const partsTotal = selectedPartsData.reduce((sum, part) => sum + (part.sell_price * part.quantity), 0)
  const servicesTotal = selectedServices.reduce((sum, service) => sum + service.price, 0)
  const washTotal = selectedWashType ? selectedWashType.price : 0
  const total = partsTotal + washTotal + servicesTotal

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout} title="تسجيل العمل">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout} title="تسجيل العمل">
      <div className="space-y-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Order Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="h-6 w-6 text-orange-600" />
              <span>تفاصيل أمر العمل #{workOrderId}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Car Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  معلومات السيارة
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الماركة</Label>
                    <p className="text-sm">{workOrder?.car?.brand}</p>
                  </div>
                  <div>
                    <Label>الموديل</Label>
                    <p className="text-sm">{workOrder?.car?.model}</p>
                  </div>
                  <div>
                    <Label>رقم اللوحة</Label>
                    <p className="text-sm">{workOrder?.car?.plate}</p>
                  </div>
                  <div>
                    <Label>العداد</Label>
                    <p className="text-sm">{workOrder?.car?.counter} كم</p>
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  معلومات المالك
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الاسم</Label>
                    <p className="text-sm">{`${workOrder?.client?.first_name} ${workOrder?.client?.last_name}`}</p>
                  </div>
                  <div>
                    <Label>رقم الهاتف</Label>
                    <p className="text-sm">{workOrder?.client?.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Record Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>تسجيل العمل</CardTitle>
              <CardDescription>سجل قطع الغيار المستخدمة والخدمات المقدمة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Spare Parts Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">قطع الغيار المستخدمة</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث عن قطع الغيار..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>القطعة</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المنشأ</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>المتوفر</TableHead>
                      <TableHead>الكمية</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParts.map((part) => {
                      const selectedPart = selectedParts.find(sp => sp.partId === part.id)
                      const isSelected = !!selectedPart
                      
                      return (
                        <TableRow key={part.id}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handlePartSelection(part.id)}
                              disabled={!part.quantity}
                            />
                          </TableCell>
                          <TableCell>{part.item}</TableCell>
                          <TableCell>{part.is_oil ? 'زيت' : 'قطعة غيار'}</TableCell>
                          <TableCell>{part.origin}</TableCell>
                          <TableCell>${part.sell_price}</TableCell>
                          <TableCell>{part.quantity}</TableCell>
                          <TableCell>
                            {isSelected && (
                              <Input
                                type="number"
                                min="1"
                                max={part.quantity}
                                value={selectedPart.quantity}
                                onChange={(e) => handlePartQuantityChange(part.id, e.target.value)}
                                className="w-20"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Car Wash Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">خدمة الغسيل</h3>
                <Select
                  value={formData.washType}
                  onValueChange={(value) => setFormData({ ...formData, washType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الغسيل" />
                  </SelectTrigger>
                  <SelectContent>
                    {washTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {`${type.name} - $${type.price}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time Spent */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  الوقت المستغرق
                </h3>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={formData.timeSpent}
                    onChange={(e) => setFormData({ ...formData, timeSpent: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-32"
                  />
                  <span>ساعات</span>
                </div>
              </div>

              {/* Extra Services */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">الخدمات الإضافية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2 rounded-lg border p-4">
                      <Checkbox
                        checked={formData.services.includes(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-sm text-gray-500">{service.description}</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold">${service.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">ملاحظات إضافية</h3>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أضف أي ملاحظات إضافية هنا..."
                />
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-gray-50 p-4 space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  ملخص التكاليف
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>قطع الغيار ({selectedPartsData.length}):</span>
                    <span>${partsTotal}</span>
                  </div>
                  {selectedPartsData.length > 0 && (
                    <div className="text-sm text-gray-600 mr-4">
                      {selectedPartsData.map(part => (
                        <div key={part.id} className="flex justify-between">
                          <span>- {part.item} (×{part.quantity})</span>
                          <span>${part.sell_price * part.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>خدمة الغسيل:</span>
                    <span>${washTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الخدمات الإضافية:</span>
                    <span>${servicesTotal}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>الإجمالي:</span>
                    <span>${total}</span>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">
                تسجيل العمل وإنشاء الفاتورة
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </Layout>
  )
}

export default RecordWork

