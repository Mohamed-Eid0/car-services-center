import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import api from '../services/api'
import { useData } from '../contexts/DataContext'
import { useTranslation } from 'react-i18next'

export default function AddWorkOrder({ user, onLogout }) {
  const { t } = useTranslation()
  const { invalidateClients, invalidateCars, invalidateWorkOrders } = useData()
  const location = useLocation()
  const navigate = useNavigate()

  const initClient = location.state?.client ?? { id: null, firstName: '', lastName: '', phone: '' }
  const initCar = location.state?.car ?? { id: null, plate: '', brand: '', model: '', counter: '' }

  const [client, setClient] = useState(initClient)
  const [car, setCar] = useState(initCar)
  const [complaint, setComplaint] = useState('')
  const [deposit, setDeposit] = useState("")
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!location.state?.client && !location.state?.car) {
      // No context provided – allow manual entry, but show a hint
      setNotice(t('addWorkOrderPage.manualEntryHint'))
    }
  }, [location, t])

  const validate = () => {
    const e = {}
    if (!client.firstName.trim()) e.firstName = t('newClientPage.firstNameRequired')
    if (!client.lastName.trim()) e.lastName = t('newClientPage.lastNameRequired')
    if (!/^\d{11}$/.test(client.phone || '')) e.phone = t('newClientPage.phoneNumberMustBe11Digits')
    if (!car.plate.trim()) e.plate = t('newClientPage.plateNumberRequired')
    if (!car.brand.trim()) e.brand = t('newClientPage.brandRequired')
    if (!car.model.trim()) e.model = t('newClientPage.modelRequired')
    if (car.counter === '' || isNaN(car.counter) || Number(car.counter) < 0) e.counter = t('newClientPage.validMileageRequired')
    if (!complaint.trim()) e.complaint = t('newClientPage.complaintRequired') || 'Complaint is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const upsertClient = async () => {
    if (client.id) {
      await api.updateClient(client.id, {
        first_name: client.firstName.trim(),
        last_name: client.lastName.trim(),
        phone: client.phone
      })
      return client.id
    }
    const created = await api.createClient({
      first_name: client.firstName.trim(),
      last_name: client.lastName.trim(),
      phone: client.phone
    })
    setClient(c => ({ ...c, id: created.id }))
    return created.id
  }

  const resolveCarForClient = async (clientId) => {
    const allCars = await api.getCars()
    const byPlate = allCars.find(c => (c.plate || '').trim().toUpperCase() === car.plate.trim().toUpperCase())

    // Case A: plate matches an existing record
    if (byPlate) {
      const oldOwnerId = byPlate.client_id
      if (!car.id || car.id !== byPlate.id || byPlate.client_id !== clientId) {
        // Re-assign to this client (car sold)
        await api.updateCar(byPlate.id, {
          client_id: clientId,
          plate: car.plate.trim(),
          brand: car.brand.trim(),
          model: car.model.trim(),
          counter: Number(car.counter),
          notes: 'Reassigned by reception'
        })

        // Optionally remove old client if no more cars
        if (oldOwnerId && oldOwnerId !== clientId) {
          const oldOwnerCars = allCars.filter(c => c.client_id === oldOwnerId && c.id !== byPlate.id)
          if (oldOwnerCars.length === 0) {
            // best-effort, ignore error if backend denies
            try { await api.deleteClient(oldOwnerId) } catch (err) {
              console.warn('Failed to delete old owner with no cars:', oldOwnerId, err)
            }
          }
        }
      } else {
        // Same record; just update attributes
        await api.updateCar(byPlate.id, {
          plate: car.plate.trim(),
          brand: car.brand.trim(),
          model: car.model.trim(),
          counter: Number(car.counter)
        })
      }
      return byPlate.id
    }

    // Case B: new plate – create a new car (supports multiple cars per client)
    const createdCar = await api.createCar({
      client_id: clientId,
      plate: car.plate.trim(),
      plate_en: (car.plate_en || car.plate).toUpperCase(),
      brand: car.brand.trim(),
      model: car.model.trim(),
      counter: Number(car.counter),
      notes: 'Added from AddWorkOrder'
    })
    setCar(c => ({ ...c, id: createdCar.id }))
    return createdCar.id
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    setNotice('')
    try {
      const clientId = await upsertClient()
      const carId = await resolveCarForClient(clientId)

      await api.createWorkOrder({
        client_id: clientId,
        car_id: carId,
        complaint: complaint.trim(),
        deposit: Number(deposit) || 0,
        services: [],
        oil_change: null,
        oil_confirmed: false,
        wash_confirmed: false
      })

      invalidateClients()
      invalidateCars()
      invalidateWorkOrders()

      setNotice(t('addWorkOrderPage.createdSuccessfully'))
      setComplaint('')
      setDeposit(0)
    } catch (err) {
      setErrors({ submit: err.message || t('addWorkOrderPage.failed') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      {notice && (
        <Alert className="mb-4">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client */}
        <Card>
          <CardHeader>
            <CardTitle>{t('addWorkOrderPage.clientInfo')}</CardTitle>
            <CardDescription>{t('addWorkOrderPage.clientEditHint')}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>{t('newClientPage.firstName')}</Label>
              <Input value={client.firstName} onChange={e => setClient({ ...client, firstName: e.target.value })} />
              {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
            </div>
            <div>
              <Label>{t('newClientPage.lastName')}</Label>
              <Input value={client.lastName} onChange={e => setClient({ ...client, lastName: e.target.value })} />
              {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
            </div>
            <div>
              <Label>{t('newClientPage.phoneNumber')}</Label>
              <Input maxLength={11} value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} />
              {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Car */}
        <Card>
          <CardHeader>
            <CardTitle>{t('addWorkOrderPage.carInfo')}</CardTitle>
            <CardDescription>{t('addWorkOrderPage.carEditHint')}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <Label>{t('newClientPage.plateNumber')}</Label>
              <Input value={car.plate} onChange={e => setCar({ ...car, plate: e.target.value })} />
              {errors.plate && <p className="text-sm text-red-600">{errors.plate}</p>}
            </div>
            <div>
              <Label>{t('newClientPage.brand')}</Label>
              <Input value={car.brand} onChange={e => setCar({ ...car, brand: e.target.value })} />
              {errors.brand && <p className="text-sm text-red-600">{errors.brand}</p>}
            </div>
            <div>
              <Label>{t('newClientPage.model')}</Label>
              <Input value={car.model} onChange={e => setCar({ ...car, model: e.target.value })} />
              {errors.model && <p className="text-sm text-red-600">{errors.model}</p>}
            </div>
            <div>
              <Label>{t('newClientPage.mileageCounter')}</Label>
              <Input type="number" min="0" value={car.counter} onChange={e => setCar({ ...car, counter: e.target.value })} />
              {errors.counter && <p className="text-sm text-red-600">{errors.counter}</p>}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Work order */}
        <Card>
          <CardHeader>
            <CardTitle>{t('newClientPage.workOrderInformation') || 'معلومات أمر العمل'}</CardTitle>
            <CardDescription>{t('addWorkOrderPage.complaintHint')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('newClientPage.complaint') || 'الشكوى'}</Label>
              <Textarea rows={3} value={complaint} onChange={e => setComplaint(e.target.value)} className={errors.complaint ? 'border-red-500' : ''} />
              {errors.complaint && <p className="text-sm text-red-600">{errors.complaint}</p>}
            </div>
            <div className="max-w-sm">
              <Label>{t('newClientPage.deposit') || 'العربون'}</Label>
              <Input type="number" min="0" value={deposit} onChange={e => setDeposit(e.target.value)} />
            </div>

            {errors.submit && (
              <Alert variant="destructive">
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/work-orders')}>
                {t('newClientPage.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('newClientPage.saving') : t('recordedClientsPage.addWorkOrder')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Layout>
  )
}