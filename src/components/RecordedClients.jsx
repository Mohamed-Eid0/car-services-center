import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

import { Search, Plus, Car, Phone, User } from 'lucide-react'
import api from '../services/api'
import { useTranslation } from 'react-i18next'

const RecordedClients = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchPhone, setSearchPhone] = useState('')
  const [selectedCarId, setSelectedCarId] = useState(null)
  const [clients, setClients] = useState([])
  const [cars, setCars] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsData, carsData] = await Promise.all([
          api.getClients(),
          api.getCars()
        ]);
        setClients(clientsData)
        setCars(carsData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Combine clients with their cars for the table
  const clientCarsData = useMemo(() => {
    const data = []
    clients.forEach(client => {
      const clientCars = cars.filter(car => car.client_id === client.id)
      if (clientCars.length === 0) {
        // Client with no cars
        data.push({
          id: `client-${client.id}`,
          clientId: client.id,
          carId: null,
          firstName: client.first_name,
          lastName: client.last_name,
          phone: client.phone,
          plate: '-',
          brand: '-',
          model: '-',
          counter: '-',
          notes: t('recordedClientsPage.noVehiclesRegistered')
        })
      } else {
        // Client with cars
        clientCars.forEach(car => {
          data.push({
            id: `client-${client.id}-car-${car.id}`,
            clientId: client.id,
            carId: car.id,
            firstName: client.first_name,
            lastName: client.last_name,
            phone: client.phone,
            plate: car.plate,
            brand: car.brand,
            model: car.model,
            counter: car.counter,
            notes: car.notes || '-'
          })
        })
      }
    })
    return data
  }, [clients, cars, t])

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchPhone.trim()) return clientCarsData
    return clientCarsData.filter(item =>
      item.phone.includes(searchPhone.trim())
    )
  }, [clientCarsData, searchPhone])

  const handleCreateWorkOrder = () => {
    if (!selectedCarId) {
      alert(t('recordedClientsPage.selectCarFirst'))
      return
    }
    const selectedCar = cars.find(car => car.id === selectedCarId)
    const client = clients.find(c => c.id === selectedCar.client_id)

    navigate('/add-work-order', {
      state: {
        client: {
          id: client.id,
          firstName: client.first_name,
          lastName: client.last_name,
          phone: client.phone
        },
        car: {
          id: selectedCar.id,
          plate: selectedCar.plate,
          brand: selectedCar.brand,
          model: selectedCar.model,
          counter: selectedCar.counter ?? ''
        }
      }
    })
  }

  const stats = [
    {
      title: t('recordedClientsPage.totalClients'),
      value: clients.length,
      icon: User,
      color: 'text-blue-600'
    },
    {
      title: t('recordedClientsPage.totalVehicles'),
      value: cars.length,
      icon: Car,
      color: 'text-green-600'
    },
    {
      title: t('recordedClientsPage.searchResults'),
      value: filteredData.length,
      icon: Search,
      color: 'text-purple-600'
    }
  ]

  if (isLoading) {
    return (
      <Layout user={user} onLogout={onLogout} title={t('recordedClientsPage.title')}>
        <div className="flex items-center justify-center h-32">
          <p className="text-lg text-gray-600">{t('common.loading')}...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout} title={t('recordedClientsPage.title')}>
      <div className="space-y-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Stats Cards */}
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

        {/* Search and Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('recordedClientsPage.searchClients')}</CardTitle>
            <CardDescription>
              {t('recordedClientsPage.searchByPhoneDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="phone-search">{t('recordedClientsPage.phoneNumber')}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone-search"
                    type="text"
                    placeholder={t('recordedClientsPage.enterPhoneNumber')}
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <Button
                  onClick={handleCreateWorkOrder}
                  disabled={!selectedCarId}
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('recordedClientsPage.addWorkOrder')}
                </Button>
                <Link to="/new-client">
                  <Button variant="outline" className="whitespace-nowrap">
                    <User className="h-4 w-4 mr-2" />
                    {t('recordedClientsPage.newClient')}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients and Cars Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('recordedClientsPage.clientsAndVehicles')}</CardTitle>
            <CardDescription>
              {t('recordedClientsPage.selectVehicleDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{t('recordedClientsPage.select')}</TableHead>
                    <TableHead className="w-1/4">{t('recordedClientsPage.clientName')}</TableHead>
                    <TableHead className="w-40">{t('recordedClientsPage.phone')}</TableHead>
                    <TableHead className="w-28">{t('recordedClientsPage.plateNumber')}</TableHead>
                    <TableHead className="w-1/4">{t('recordedClientsPage.vehicle')}</TableHead>
                    <TableHead className="w-32">{t('recordedClientsPage.mileage')}</TableHead>
                    <TableHead>{t('recordedClientsPage.notes')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        {searchPhone ? t('recordedClientsPage.noClientsFoundWithPhone') : t('recordedClientsPage.noClientsFound')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item) => (
                      <TableRow
                        key={item.id}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selectedCarId === item.carId ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => item.carId && setSelectedCarId(item.carId)}
                      >
                        <TableCell className="text-center">
                          {item.carId && (
                            <input
                              type="radio"
                              name="selectedCar"
                              checked={selectedCarId === item.carId}
                              onChange={() => setSelectedCarId(item.carId)}
                              className="h-4 w-4 text-blue-600 mx-auto"
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium rtl:text-right">
                          {item.firstName} {item.lastName}
                        </TableCell>
                        <TableCell className="rtl:text-right">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{item.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="rtl:text-right">
                          {item.plate !== '-' ? (
                            <Badge variant="outline">{item.plate}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="rtl:text-right">
                          {item.brand !== '-' ? (
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Car className="h-4 w-4 text-gray-400" />
                              <span>{item.brand} {item.model}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">{t('recordedClientsPage.noVehicle')}</span>
                          )}
                        </TableCell>
                        <TableCell className="rtl:text-right">
                          {item.counter !== '-' ? (
                            <span>{item.counter.toLocaleString()} {t('recordedClientsPage.km')}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="rtl:text-right">
                          <span className="text-sm text-gray-600">{item.notes}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredData.length > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                {t('recordedClientsPage.showingResults', { count: filteredData.length })}
                {selectedCarId && (
                  <span className="ml-2 text-blue-600 font-medium">
                    {t('recordedClientsPage.vehicleSelectedProceed')}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default RecordedClients

