import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Car,
  DollarSign,
  Search,
  Filter,
  Plus
} from 'lucide-react'
import { workOrdersAPI, clientsAPI, carsAPI, usersAPI } from '../services/api'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useData } from '../contexts/DataContext'

const WorkOrders = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation()
  const { invalidateWorkOrders } = useData()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [workOrders, setWorkOrders] = useState([])
  const [clients, setClients] = useState([])
  const [cars, setCars] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [workOrdersData, clientsData, carsData, usersData] = await Promise.all([
        workOrdersAPI.getAll(),
        clientsAPI.getAll(),
        carsAPI.getAll(),
        usersAPI.getAll()
      ])
      setWorkOrders(workOrdersData)
      setClients(clientsData)
      setCars(carsData)
      setTechnicians(usersData.filter(u => u.role === 'TECHNICIAN'))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and search work orders
  const filteredOrders = useMemo(() => {
    let filtered = workOrders

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Search by client name, car plate, or complaint
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(order => {
        const client = clients.find(c => c.id === order.client_id)
        const car = cars.find(c => c.id === order.car_id)
        const clientName = `${client?.first_name} ${client?.last_name}`.toLowerCase()
        const carPlate = car?.plate?.toLowerCase() || ''
        const complaint = order.complaint.toLowerCase()
        
        return clientName.includes(term) || 
               carPlate.includes(term) || 
               complaint.includes(term)
      })
    }

    // Sort by creation date (newest first)
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [statusFilter, searchTerm, workOrders, clients, cars])

  const getStatusIcon = (status) => {
    const s = status.toLowerCase()
    switch (s) {
      case 'waiting':
        return <Clock className="h-4 w-4" />
      case 'pending':
        return <AlertCircle className="h-4 w-4" />
      case 'assigned':
        return <User className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status) => {
    const s = status.toLowerCase()
    switch (s) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'assigned':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const statusCounts = useMemo(() => {
    const counts = {
      all: workOrders.length,
      waiting: 0,
      pending: 0,
      assigned: 0,
      completed: 0
    }
    
    workOrders.forEach(order => {
      const status = order.status.toLowerCase()
      counts[status] = (counts[status] || 0) + 1
    })
    
    return counts
  }, [workOrders])

  const handleBilling = (orderId) => {
    // In a real app, this would navigate to billing page
    alert(`${t('workOrdersPage.openingBillingForWorkOrder')} ${orderId}`)
  }

  const handleStartWork = async (orderId) => {
    const confirmed = window.confirm(t('workOrdersPage.confirmStartWork') || 'هل تريد حقاً بدء العمل على هذه السيارة؟')
    if (!confirmed) return

    try {
      await workOrdersAPI.assign(orderId, user.id)
      toast.success(t('workOrdersPage.workStartedSuccessfully') || 'تم بدء العمل بنجاح')
      invalidateWorkOrders()
      fetchData() // Refresh data
    } catch (error) {
      console.error('Error starting work:', error)
      toast.error(t('workOrdersPage.errorStartingWork') || 'خطأ في بدء العمل')
    }
  }

  const handleRecordWork = (orderId) => {
    navigate(`/record-work/${orderId}`)
  }

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout} title={t('workOrdersPage.title')}>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">{t('loading') || 'Loading...'}</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout} title={t('workOrdersPage.title')}>
      <div className="space-y-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Card 
              key={status}
              className={`cursor-pointer transition-all hover:shadow-md ${
                statusFilter === status ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setStatusFilter(status)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 capitalize">
                      {status === 'all' ? t('workOrdersPage.allOrders') : t(`workOrdersPage.${status.toLowerCase()}`)}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  {status !== 'all' && (
                    <div className={`p-2 rounded-lg ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>{t('workOrdersPage.searchAndFilter')}</CardTitle>
            <CardDescription>
              {t('workOrdersPage.searchDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">{t('workOrdersPage.search')}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    type="text"
                    placeholder={t('workOrdersPage.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Label htmlFor="status-filter">{t('workOrdersPage.statusFilter')}</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('workOrdersPage.statusFilter')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('workOrdersPage.allStatuses')}</SelectItem>
                    <SelectItem value="waiting">{t('workOrdersPage.waiting')}</SelectItem>
                    <SelectItem value="pending">{t('workOrdersPage.pending')}</SelectItem>
                    <SelectItem value="assigned">{t('workOrdersPage.assigned')}</SelectItem>
                    <SelectItem value="completed">{t('workOrdersPage.completed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('workOrdersPage.workOrdersList')}</CardTitle>
            <CardDescription>
              {t('workOrdersPage.workOrdersFound', { count: filteredOrders.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('workOrdersPage.orderId')}</TableHead>
                    <TableHead>{t('workOrdersPage.client')}</TableHead>
                    <TableHead>{t('workOrdersPage.vehicle')}</TableHead>
                    <TableHead>{t('workOrdersPage.complaint')}</TableHead>
                    <TableHead>{t('workOrdersPage.deposit')}</TableHead>
                    <TableHead>{t('workOrdersPage.status')}</TableHead>
                    <TableHead>{t('workOrdersPage.date')}</TableHead>
                    <TableHead>{t('workOrdersPage.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        {t('workOrdersPage.noWorkOrdersFound')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => {
                      const client = clients.find(c => c.id === order.client_id)
                      const car = cars.find(c => c.id === order.car_id)
                      const technician = order.technician_id ? 
                        technicians.find(t => t.id === order.technician_id) : null

                      return (
                        <TableRow key={order.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            #{order.id.toString().padStart(4, '0')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {client?.first_name} {client?.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {client?.phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Car className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-medium">{car?.plate}</p>
                                <p className="text-sm text-gray-500">
                                  {car?.brand} {car?.model}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm max-w-xs truncate" title={order.complaint}>
                              {order.complaint}
                            </p>
                            {order.services && order.services.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {order.services.map((service, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {service}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{order.deposit}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(order.status)}
                                <span>{t(`workOrdersPage.${order.status.toLowerCase()}`)}</span>
                              </div>
                            </Badge>
                            {technician && (
                              <p className="text-xs text-gray-500 mt-1">
                                {t('workOrdersPage.tech')}: {technician.first_name}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {new Date(order.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                            </p>
                          </TableCell>
                          <TableCell>
                            {order.status === 'completed' ? (
                              user.role?.toLowerCase() === 'receptionist' || user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'super_admin' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleBilling(order.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  {t('workOrdersPage.billing')}
                                </Button>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-green-50">
                                  {t('workOrdersPage.completed')}
                                </Badge>
                              )
                            ) : user.role?.toLowerCase() === 'technician' ? (
                              <div className="flex gap-2">
                                {order.status === 'waiting' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleStartWork(order.id)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    {t('workOrdersPage.startWork') || 'بدء العمل'}
                                  </Button>
                                )}
                                {order.status === 'assigned' && order.technician_id === user.id && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleRecordWork(order.id)}
                                    className="bg-orange-600 hover:bg-orange-700"
                                  >
                                    {t('workOrdersPage.recordWork') || 'تسجيل تقرير العمل'}
                                  </Button>
                                )}
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Completed Orders - Hidden for Technicians */}
        {user.role?.toLowerCase() !== 'technician' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('workOrdersPage.recentCompletedOrders')}</CardTitle>
              <CardDescription>
                {t('workOrdersPage.ordersReadyForBilling')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workOrders
                  .filter(order => order.status === 'completed')
                  .slice(0, 3)
                  .map((order) => {
                    const client = clients.find(c => c.id === order.client_id)
                    const car = cars.find(c => c.id === order.car_id)
                    
                    return (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {client?.first_name} {client?.last_name} - {car?.plate}
                            </p>
                            <p className="text-sm text-gray-600">{order.complaint}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleBilling(order.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          {t('workOrdersPage.createBill')}
                        </Button>
                      </div>
                    )
                  })}
                
                {(workOrders || []).filter(order => order.status === 'completed').length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    {t('workOrdersPage.noCompletedOrdersReadyForBilling')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}

export default WorkOrders

