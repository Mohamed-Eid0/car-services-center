import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, ClipboardList, Car, Clock, CheckCircle } from 'lucide-react'
import { workOrdersAPI, clientsAPI, carsAPI } from '../services/api'
import { useTranslation } from 'react-i18next'

const ReceptionistDashboard = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation()
  const [clients, setClients] = useState([])
  const [cars, setCars] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [clientsData, carsData, workOrdersData] = await Promise.all([
        clientsAPI.getAll(),
        carsAPI.getAll(),
        workOrdersAPI.getAll()
      ])
      setClients(clientsData)
      setCars(carsData)
      setWorkOrders(workOrdersData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalClients = clients.length
  const totalCars = cars.length
  const pendingOrders = (workOrders || []).filter(order => order.status === 'waiting' || order.status === 'pending').length
  const completedToday = (workOrders || []).filter(order => {
    const today = new Date().toISOString().split('T')[0]
    const orderDate = new Date(order.created_at).toISOString().split('T')[0]
    return order.status === 'completed' && orderDate === today
  }).length

  const dashboardCards = [
    {
      title: t('receptionistDashboard.recordedClients'),
      description: t('receptionistDashboard.recordedClientsDescription'),
      icon: Users,
      count: totalClients,
      link: '/recorded-clients',
      color: 'bg-blue-500'
    },
    {
      title: t('receptionistDashboard.newClient'),
      description: t('receptionistDashboard.newClientDescription'),
      icon: UserPlus,
      count: null,
      link: '/new-client',
      color: 'bg-green-500'
    },
    {
      title: t('receptionistDashboard.workOrders'),
      description: t('receptionistDashboard.workOrdersDescription'),
      icon: ClipboardList,
      count: workOrders.length,
      link: '/work-orders',
      color: 'bg-orange-500'
    }
  ]

  const stats = [
    {
      title: t('receptionistDashboard.totalCars'),
      value: totalCars,
      icon: Car,
      color: 'text-blue-600'
    },
    {
      title: t('receptionistDashboard.pendingOrders'),
      value: pendingOrders,
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: t('receptionistDashboard.completedToday'),
      value: completedToday,
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ]

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout} title={t('receptionistDashboard.title')}>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">{t('loading') || 'Loading...'}</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout} title={t('receptionistDashboard.title')}>
      <div className="space-y-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            {t('receptionistDashboard.welcomeBack', { first_name: user.first_name || user.username })}!
          </h2>
          <p className="text-blue-100">
            {t('receptionistDashboard.manageDescription')}
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

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dashboardCards.map((card, index) => {
            const Icon = card.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${card.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                      {card.count !== null && (
                        <p className="text-sm text-gray-500">{card.count} {t('receptionistDashboard.total')}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {card.description}
                  </CardDescription>
                  <Link to={card.link}>
                    <Button className="w-full">
                      {t('receptionistDashboard.access')} {card.title}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recent Work Orders */}
        <Card>
          <CardHeader>
            <CardTitle>{t('receptionistDashboard.recentWorkOrders')}</CardTitle>
            <CardDescription>{t('receptionistDashboard.latestServiceRequests')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workOrders.slice(0, 5).map((order) => {
                const client = clients.find(c => c.id === order.client_id)
                const car = cars.find(c => c.id === order.car_id)
                
                const getStatusColor = (status) => {
                  switch (status) {
                    case 'waiting': return 'bg-yellow-100 text-yellow-800'
                    case 'pending': return 'bg-blue-100 text-blue-800'
                    case 'assigned': return 'bg-purple-100 text-purple-800'
                    case 'completed': return 'bg-green-100 text-green-800'
                    default: return 'bg-gray-100 text-gray-800'
                  }
                }

                return (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {client?.first_name} {client?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {car?.brand} {car?.model} - {car?.plate}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{order.complaint}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {t(`receptionistDashboard.status${order.status}`) || order.status}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {t('receptionistDashboard.deposit')}: ${order.deposit}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4">
              <Link to="/work-orders">
                <Button variant="outline" className="w-full">
                  {t('receptionistDashboard.viewAllWorkOrders')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default ReceptionistDashboard

