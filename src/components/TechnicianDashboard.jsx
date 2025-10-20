import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wrench, Clock, CheckCircle, AlertCircle, Edit } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { toast } from 'sonner'

const TechnicianDashboard = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  const fetchWorkOrders = async () => {
    try {
      const response = await api.getWorkOrders()
      setWorkOrders(response || [])
    } catch (error) {
      console.error('Error fetching work orders:', error)
      toast.error('Error fetching work orders')
    } finally {
      setLoading(false)
    }
  }

  const handleStartWork = async (orderId) => {
    try {
      await api.startWorkOrder(orderId)
      toast.success('Work started successfully')
      fetchWorkOrders()
    } catch (error) {
      console.error('Error starting work:', error)
      toast.error('Error starting work')
    }
  }

  const handleEditWorkRecord = (orderId) => {
    navigate(`/record-work/${orderId}`)
  }

  // Get work orders assigned to this technician or pending assignment
  const assignedOrders = workOrders.filter(order => 
    order.technician_id === user.id || 
    ['waiting', 'assigned', 'in_progress', 'pending'].includes(order.status?.toLowerCase())
  )

  const pendingOrders = assignedOrders.filter(order => 
    ['waiting', 'assigned', 'pending'].includes(order.status?.toLowerCase())
  )

  const inProgressOrder = workOrders.find(order => 
    order.technician_id === user.id && order.status?.toLowerCase() === 'in_progress'
  )

  const todaysOrders = workOrders.filter(order => {
    const today = new Date().toISOString().split('T')[0]
    const orderDate = new Date(order.created_at).toISOString().split('T')[0]
    // Only show in_progress, pending (suspended), and completed orders for today
    // Exclude 'assigned' and 'waiting' orders (they show in pending section)
    const status = order.status?.toLowerCase()
    return order.technician_id === user.id && 
           orderDate === today &&
           (status === 'in_progress' || status === 'pending' || status === 'completed')
  })

  const completedToday = todaysOrders.filter(order => order.status?.toLowerCase() === 'completed').length

  const getStatusColor = (status) => {
    const lowerStatus = status?.toLowerCase()
    switch (lowerStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'assigned':
        return 'bg-purple-100 text-purple-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    const lowerStatus = status?.toLowerCase()
    switch (lowerStatus) {
      case 'pending':
        return 'معلق'
      case 'assigned':
        return 'مُعيّن'
      case 'in_progress':
        return 'قيد العمل'
      case 'completed':
        return 'مكتمل'
      case 'waiting':
        return 'في الانتظار'
      default:
        return status
    }
  }

  const stats = [
    {
      title: t('technicianDashboard.pendingWork'),
      value: pendingOrders.length,
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: t('technicianDashboard.completedToday'),
      value: completedToday,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: t('technicianDashboard.totalAssigned'),
      value: assignedOrders.length,
      icon: Wrench,
      color: 'text-blue-600'
    }
  ]

  return (
    <Layout user={user} onLogout={onLogout} title={t('technicianDashboard.title')}>
      <div className="space-y-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            {t('technicianDashboard.welcomeBack', { first_name: user.first_name || user.username })}!
          </h2>
          <p className="text-orange-100">
            {t('technicianDashboard.manageDescription')}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Current Work in Progress */}
        {inProgressOrder && (
          <Card className="border-blue-500 border-2 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-700">
                <Wrench className="h-5 w-5" />
                <span>العمل الحالي - قيد التنفيذ</span>
              </CardTitle>
              <CardDescription className="text-blue-600">
                السيارة التي تعمل عليها الآن
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-white border-2 border-blue-300 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        {t('technicianDashboard.workOrder')} #{inProgressOrder.id.toString().padStart(4, '0')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {inProgressOrder.client?.first_name} {inProgressOrder.client?.last_name} - {inProgressOrder.car?.plate}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 font-medium">{inProgressOrder.complaint}</p>
                      <p className="text-xs text-gray-500">
                        {t('technicianDashboard.created')}: {new Date(inProgressOrder.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-blue-600 text-white hover:bg-blue-600">
                    قيد العمل
                  </Badge>
                  <Button 
                    size="sm" 
                    onClick={() => navigate(`/record-work/${inProgressOrder.id}`)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    تسجيل تقرير العمل
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Work Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="h-5 w-5" />
              <span>{t('technicianDashboard.pendingWorkOrders')}</span>
            </CardTitle>
            <CardDescription>
              {t('technicianDashboard.workOrdersAssignedOrAwaiting')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-center text-gray-500 py-8">Loading...</p>
              ) : pendingOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {t('technicianDashboard.noPendingWorkOrders')}
                </p>
              ) : (
                pendingOrders.map((order) => {
                  return (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {t('technicianDashboard.workOrder')} #{order.id.toString().padStart(4, '0')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.client?.first_name} {order.client?.last_name} - {order.car?.plate}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{order.complaint}</p>
                            <p className="text-xs text-gray-500">
                              {t('technicianDashboard.created')}: {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                        <Button size="sm" onClick={() => handleStartWork(order.id)}>
                          {t('technicianDashboard.startWork')}
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Work Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>{t('technicianDashboard.todaysWorkRecords')}</span>
            </CardTitle>
            <CardDescription>
              {t('technicianDashboard.workRecordsForToday')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-center text-gray-500 py-8">Loading...</p>
              ) : todaysOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {t('technicianDashboard.noWorkRecordsToday')}
                </p>
              ) : (
                todaysOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {t('technicianDashboard.workOrder')} #{order.id.toString().padStart(4, '0')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.client?.first_name} {order.client?.last_name} - {order.car?.plate}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{order.complaint}</p>
                          <p className="text-xs text-gray-500">
                            {order.tech_report ? 'Work recorded' : 'Work in progress'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                      {/* Show appropriate button based on status */}
                      {order.status?.toLowerCase() === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleEditWorkRecord(order.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          تسجيل تقرير العمل
                        </Button>
                      )}
                      {order.status?.toLowerCase() === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartWork(order.id)}
                        >
                          استئناف العمل
                        </Button>
                      )}
                      {order.status?.toLowerCase() === 'completed' && order.tech_report && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditWorkRecord(order.id)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          تعديل التقرير
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default TechnicianDashboard

