import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../contexts/DataContext'
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
import { Package, Plus, Edit, Trash2, Search, AlertTriangle, Droplets, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { stockAPI } from '../services/api'
import api from '../services/api'

const Store = ({ user, onLogout }) => {
  const { t : _t, i18n } = useTranslation()
  const { invalidateStock } = useData()
  const [stockItems, setStockItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [services, setServices] = useState([])
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
    unit_price: 0,
    is_oil: false,
    supplier: '',
    minimum_stock: 5
  })
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    price: 0,
    is_active: true
  })

  useEffect(() => {
    fetchStockItems()
    fetchServices()
  }, [filterType])

  const fetchServices = async () => {
    try {
      const response = await api.getServices()
      setServices(response || [])
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error('خطأ في جلب الخدمات')
    }
  }

  const handleServiceSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selectedService) {
        await api.updateService(selectedService.id, serviceFormData)
        toast.success('تم تحديث الخدمة بنجاح')
      } else {
        await api.createService(serviceFormData)
        toast.success('تم إضافة الخدمة بنجاح')
      }
      invalidateStock()
      setIsServiceDialogOpen(false)
      setSelectedService(null)
      setServiceFormData({ name: '', description: '', price: 0, is_active: true })
      fetchServices()
    } catch (error) {
      console.error('Error saving service:', error)
      toast.error('خطأ في حفظ الخدمة')
    }
  }

  const handleDeleteService = async (id) => {
    if (window.confirm('هل أنت متأكد من إلغاء تفعيل هذه الخدمة؟')) {
      try {
        await api.deleteService(id)
        toast.success('تم إلغاء تفعيل الخدمة بنجاح')
        invalidateStock()
        fetchServices()
      } catch (error) {
        console.error('Error deleting service:', error)
        toast.error('خطأ في إلغاء تفعيل الخدمة')
      }
    }
  }

  const fetchStockItems = async () => {
    try {
      setLoading(true)
      // Fetch all items; filter locally using filterType and searchTerm
      const response = await stockAPI.getAll()
      setStockItems(response || [])
    } catch (error) {
      console.error('Error fetching stock items:', error)
      toast.error('خطأ في جلب عناصر المخزون')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateItem = async (e) => {
    e.preventDefault()
    try {
      // Map frontend fields to backend schema
      const backendData = {
        item: formData.name,
        origin: formData.supplier || null,
        serial: `${formData.name}-${Date.now()}`, // Generate unique serial
        buy_price: formData.unit_price,
        sell_price: formData.unit_price * 1.2, // 20% markup
        quantity: formData.quantity,
        is_oil: formData.is_oil,
        minimum_stock: formData.minimum_stock
      }
      
      await stockAPI.create(backendData)
      toast.success('تم إنشاء العنصر بنجاح')
      setIsCreateDialogOpen(false)
      resetForm()
      invalidateStock() // Trigger global stock refresh
      fetchStockItems()
    } catch (error) {
      console.error('Error creating stock item:', error)
      toast.error('خطأ في إنشاء العنصر')
    }
  }

  const handleUpdateItem = async (e) => {
    e.preventDefault()
    try {
      // Map frontend fields to backend schema
      const backendData = {
        item: formData.name,
        origin: formData.supplier || null,
        buy_price: formData.unit_price,
        sell_price: formData.unit_price * 1.2, // 20% markup
        quantity: formData.quantity,
        is_oil: formData.is_oil,
        minimum_stock: formData.minimum_stock
      }
      
      await stockAPI.update(selectedItem.id, backendData)
      toast.success('تم تحديث العنصر بنجاح')
      invalidateStock()
      setIsEditDialogOpen(false)
      setSelectedItem(null)
      resetForm()
      fetchStockItems()
    } catch (error) {
      console.error('Error updating stock item:', error)
      toast.error('خطأ في تحديث العنصر')
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      try {
        await stockAPI.delete(itemId)
        toast.success('تم حذف العنصر بنجاح')
        invalidateStock()
        fetchStockItems()
      } catch (error) {
        console.error('Error deleting stock item:', error)
        toast.error('خطأ في حذف العنصر')
      }
    }
  }

  const openEditDialog = (item) => {
    setSelectedItem(item)
    setFormData({
      name: item.item, // Backend uses 'item' field
      description: item.description || '',
      quantity: item.quantity,
      unit_price: item.buy_price, // Backend uses 'buy_price'
      is_oil: item.is_oil,
      supplier: item.origin || '', // Backend uses 'origin' field
      minimum_stock: item.minimum_stock || 5
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      quantity: 0,
      unit_price: 0,
      is_oil: false,
      supplier: '',
      minimum_stock: 5
    })
  }

  const filteredItems = stockItems.filter(item =>
    // filter by type first
    (filterType === 'all' || (filterType === 'oils' && item.is_oil) || (filterType === 'parts' && !item.is_oil)) &&
    // then search
    (
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  )

  const outOfStockItems = stockItems.filter(item => item.quantity === 0)
  const lowStockItems = stockItems.filter(item => item.quantity > 0 && item.quantity < (item.minimum_stock ?? 5))
  const oilItems = stockItems.filter(item => item.is_oil)
  const partItems = stockItems.filter(item => !item.is_oil)

  const getStockStatus = (item) => {
    if (item.quantity === 0) return { label: 'نفد المخزون', color: 'bg-red-100 text-red-800' }
    if (item.quantity < (item.minimum_stock ?? 5)) return { label: 'مخزون منخفض', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'متوفر', color: 'bg-green-100 text-green-800' }
  }

  const openServiceEditDialog = (service) => {
    setSelectedService(service)
    setServiceFormData({
      name: service.name || '',
      description: service.description || '',
      price: service.price || 0,
      is_active: service.is_active ?? true
    })
    setIsServiceDialogOpen(true)
  }

  

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout} title="إدارة المخزن">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout} title="إدارة المخزن">
      <div className="space-y-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي العناصر</p>
                  <p className="text-2xl font-bold">{stockItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Droplets className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">الزيوت</p>
                  <p className="text-2xl font-bold">{oilItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">قطع الغيار</p>
                  <p className="text-2xl font-bold">{partItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">مخزون منخفض</p>
                  <p className="text-2xl font-bold">{lowStockItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">نفذ من المخزون</p>
                  <p className="text-2xl font-bold">{outOfStockItems.length}</p>
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
                  <Package className="h-6 w-6 text-blue-600" />
                  <span>إدارة المخزون</span>
                </CardTitle>
                <CardDescription>
                  إدارة قطع الغيار والزيوت ومستويات المخزون
                </CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة عنصر
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة عنصر جديد</DialogTitle>
                    <DialogDescription>
                      املأ تفاصيل العنصر الجديد
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateItem}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          اسم العنصر
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                          الوصف
                        </Label>
                        <Input
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">
                          الكمية
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unit_price" className="text-right">
                          سعر الوحدة
                        </Label>
                        <Input
                          id="unit_price"
                          type="number"
                          step="0.01"
                          value={formData.unit_price}
                          onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                          النوع
                        </Label>
                        <Select
                          value={formData.is_oil ? 'oil' : 'part'}
                          onValueChange={(value) => setFormData({ ...formData, is_oil: value === 'oil' })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oil">زيت</SelectItem>
                            <SelectItem value="part">قطعة غيار</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="supplier" className="text-right">
                          المورد
                        </Label>
                        <Input
                          id="supplier"
                          value={formData.supplier}
                          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="minimum_stock" className="text-right">
                          الحد الأدنى للمخزون
                        </Label>
                        <Input
                          id="minimum_stock"
                          type="number"
                          value={formData.minimum_stock}
                          onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) || 5 })}
                          className="col-span-3"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">إضافة العنصر</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث في المخزون..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العناصر</SelectItem>
                  <SelectItem value="oils">الزيوت فقط</SelectItem>
                  <SelectItem value="parts">قطع الغيار فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="inventory" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="inventory">المخزون</TabsTrigger>
                <TabsTrigger value="low-stock">مخزون منخفض</TabsTrigger>
                <TabsTrigger value="out-of-stock">نفذ من المخزون</TabsTrigger>
                <TabsTrigger value="services">الخدمات الإضافية</TabsTrigger>
              </TabsList>
              
              <TabsContent value="inventory">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم العنصر</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>سعر الوحدة</TableHead>
                      <TableHead>المورد</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const status = getStockStatus(item)
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.item}</div>
                              {item.description && (
                                <div className="text-sm text-gray-500">{item.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.is_oil ? 'default' : 'secondary'}>
                              {item.is_oil ? 'زيت' : 'قطعة غيار'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{item.quantity}</span>
                          </TableCell>
                          <TableCell>${item.buy_price}</TableCell>
                          <TableCell>{item.origin || 'غير محدد'}</TableCell>
                          <TableCell>
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="low-stock">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم العنصر</TableHead>
                      <TableHead>الكمية الحالية</TableHead>
                      <TableHead>الحد الأدنى</TableHead>
                      <TableHead>المطلوب</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item}</TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-800">
                            {item.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.minimum_stock}</TableCell>
                        <TableCell>{Math.max(0, item.minimum_stock - item.quantity + 10)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                          >
                            تحديث المخزون
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="out-of-stock">
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-red-700">العناصر التالية نفذت من المخزون وتحتاج إلى إعادة التخزين</p>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم العنصر</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>سعر الوحدة</TableHead>
                      <TableHead>المورد</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.filter(item => item.quantity === 0).map((item) => (
                      <TableRow key={item.id} className="bg-red-50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.item}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500">{item.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.is_oil ? 'default' : 'secondary'}>
                            {item.is_oil ? 'زيت' : 'قطعة غيار'}
                          </Badge>
                        </TableCell>
                        <TableCell>${item.buy_price}</TableCell>
                        <TableCell>{item.origin || 'غير محدد'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(item)}
                            >
                              تحديث المخزون
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (window.confirm('هل أنت متأكد من حذف هذا العنصر نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.')) {
                                  handleDeleteItem(item.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="services">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">إدارة الخدمات الإضافية</h3>
                  <Button onClick={() => {
                    setServiceFormData({ name: '', description: '', price: 0, is_active: true })
                    setSelectedService(null)
                    setIsServiceDialogOpen(true)
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة خدمة
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الخدمة</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>{service.name}</TableCell>
                        <TableCell>{service.description || '-'}</TableCell>
                        <TableCell>${service.price}</TableCell>

                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openServiceEditDialog(service)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Service Dialog */}
        <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</DialogTitle>
              <DialogDescription>
                {selectedService ? 'تحديث تفاصيل الخدمة' : 'إضافة خدمة جديدة إلى النظام'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleServiceSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="service_name" className="text-right">
                    اسم الخدمة
                  </Label>
                  <Input
                    id="service_name"
                    value={serviceFormData.name}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="service_description" className="text-right">
                    الوصف
                  </Label>
                  <Input
                    id="service_description"
                    value={serviceFormData.description}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="service_price" className="text-right">
                    السعر
                  </Label>
                  <Input
                    id="service_price"
                    type="number"
                    step="0.01"
                    value={serviceFormData.price}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, price: parseFloat(e.target.value) || 0 })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="service_status" className="text-right">
                    الحالة
                  </Label>
                  <Select
                    value={serviceFormData.is_active ? 'active' : 'inactive'}
                    onValueChange={(value) => setServiceFormData({ ...serviceFormData, is_active: value === 'active' })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{selectedService ? 'تحديث الخدمة' : 'إضافة الخدمة'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل العنصر</DialogTitle>
              <DialogDescription>
                تحديث تفاصيل العنصر
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateItem}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_name" className="text-right">
                    اسم العنصر
                  </Label>
                  <Input
                    id="edit_name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_description" className="text-right">
                    الوصف
                  </Label>
                  <Input
                    id="edit_description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_quantity" className="text-right">
                    الكمية
                  </Label>
                  <Input
                    id="edit_quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_unit_price" className="text-right">
                    سعر الوحدة
                  </Label>
                  <Input
                    id="edit_unit_price"
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_type" className="text-right">
                    النوع
                  </Label>
                  <Select
                    value={formData.is_oil ? 'oil' : 'part'}
                    onValueChange={(value) => setFormData({ ...formData, is_oil: value === 'oil' })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oil">زيت</SelectItem>
                      <SelectItem value="part">قطعة غيار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_supplier" className="text-right">
                    المورد
                  </Label>
                  <Input
                    id="edit_supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_minimum_stock" className="text-right">
                    الحد الأدنى للمخزون
                  </Label>
                  <Input
                    id="edit_minimum_stock"
                    type="number"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) || 5 })}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">تحديث العنصر</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}

export default Store
