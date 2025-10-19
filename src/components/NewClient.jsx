import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { UserPlus, Car, Save, Plus, ClipboardList } from 'lucide-react'
import api from '../services/api'
import { useTranslation } from 'react-i18next'
import { useData } from '../contexts/DataContext'

const NewClient = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation()
  const { invalidateClients, invalidateCars, invalidateWorkOrders } = useData()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  
  // Get existing client data from navigation state
  const existingClient = location.state?.existingClient
  const existingCar = location.state?.existingCar
  const isExistingClient = !!existingClient
  
  const [clientData, setClientData] = useState({
    firstName: existingClient?.firstName || '',
    lastName: existingClient?.lastName || '',
    phone: existingClient?.phone || ''
  })
  
  const [carData, setCarData] = useState({
    plate: existingCar?.plate || '',
    brand: existingCar?.brand || '',
    model: existingCar?.model || '',
    counter: '',
    notes: ''
  })
  
  const [workOrderData, setWorkOrderData] = useState({
    complaint: '',
    deposit: 0
  })

  const validatePhone = (phone) => {
    // Must be 11 digits and not all the same digit
    if (!/^\d{11}$/.test(phone)) {
      return t('newClientPage.phoneNumberMustBe11Digits')
    }
    if (new Set(phone).size === 1) {
      return t('newClientPage.phoneNumberCannotBeSameDigit')
    }
    // Note: Phone can be duplicated (same person can own multiple cars)
    // Exact duplicate validation (same client + same plate) is done at car creation
    return null
  }

  const validatePlate = (plate) => {
    // Must be alphanumeric
    if (!/^[A-Za-z0-9]+$/.test(plate)) {
      return t('newClientPage.plateNumberAlphanumeric')
    }
    // Note: Plate can be duplicated (car can be sold to new owner)
    // Exact duplicate validation (same client + same plate) is done at car creation
    return null
  }

  const validateForm = () => {
    const newErrors = {}

    // Client validation (skip if existing client)
    if (!isExistingClient) {
      if (!clientData.firstName.trim()) {
        newErrors.firstName = t('newClientPage.firstNameRequired')
      }
      if (!clientData.lastName.trim()) {
        newErrors.lastName = t('newClientPage.lastNameRequired')
      }
      
      const phoneError = validatePhone(clientData.phone)
      if (phoneError) {
        newErrors.phone = phoneError
      }
    }

    // Car validation - counter is required, other fields are pre-filled for existing clients
    if (!carData.counter || isNaN(carData.counter) || parseInt(carData.counter) < 0) {
      newErrors.counter = t('newClientPage.validMileageRequired')
    }
    
    // For existing clients, validate plate if changed
    if (isExistingClient && carData.plate !== existingCar?.plate) {
      const plateError = validatePlate(carData.plate)
      if (plateError) {
        newErrors.plate = plateError
      }
    }
    
    // For new clients, validate all car fields
    if (!isExistingClient) {
      if (!carData.plate.trim()) {
        newErrors.plate = t('newClientPage.plateNumberRequired')
      } else {
        const plateError = validatePlate(carData.plate)
        if (plateError) {
          newErrors.plate = plateError
        }
      }
      
      if (!carData.brand.trim()) {
        newErrors.brand = t('newClientPage.brandRequired')
      }
      if (!carData.model.trim()) {
        newErrors.model = t('newClientPage.modelRequired')
      }
    }
    
    // Work order validation for existing clients
    if (isExistingClient && !workOrderData.complaint.trim()) {
      newErrors.complaint = t('newClientPage.complaintRequired') || 'Complaint is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSuccess('')

    try {
      if (isExistingClient) {
        // For existing clients, create a work order with the updated counter
        const workOrderPayload = {
          client_id: existingClient.clientId,
          car_id: existingCar.carId,
          complaint: workOrderData.complaint.trim(),
          deposit: workOrderData.deposit || 0,
          services: [],
          oil_change: null,
          oil_confirmed: false,
          wash_confirmed: false
        }
        
        // Update the car counter
        await api.updateCar(existingCar.carId, {
          counter: parseInt(carData.counter)
        })
        
        // Create the work order
        await api.createWorkOrder(workOrderPayload)
        
        invalidateCars()
        invalidateWorkOrders()
        
        setSuccess(t('newClientPage.workOrderCreatedSuccessfully', { 
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          plate: carData.plate 
        }) || `تم إنشاء أمر عمل بنجاح للعميل ${clientData.firstName} ${clientData.lastName} - ${carData.plate}`)
        
        // Reset work order form
        setWorkOrderData({ complaint: '', deposit: 0 })
        setCarData(prev => ({ ...prev, counter: '' }))
        
      } else {
        // For new clients, create client, car, and optionally work order
        const newClient = await api.createClient({
          first_name: clientData.firstName.trim(),
          last_name: clientData.lastName.trim(),
          phone: clientData.phone
        })

        const newCar = await api.createCar({
          client_id: newClient.id,
          plate: carData.plate.trim().toUpperCase(),
          brand: carData.brand.trim(),
          model: carData.model.trim(),
          counter: parseInt(carData.counter),
          notes: carData.notes.trim() || 'New registration'
        })

        invalidateClients()
        invalidateCars()
        
        setSuccess(t('newClientPage.clientRegisteredSuccessfully', { 
          firstName: newClient.first_name, 
          lastName: newClient.last_name, 
          plate: newCar.plate 
        }))
        
        // Reset form
        setClientData({ firstName: '', lastName: '', phone: '' })
        setCarData({ plate: '', brand: '', model: '', counter: '', notes: '' })
      }
      
    } catch (error) {
      console.error('Error submitting form:', error)
      
      // Provide user-friendly error messages based on the new validation logic
      let errorMessage = error.message || t('newClientPage.failedToRegisterClient')
      
      // Handle specific error cases
      if (error.message?.includes('already has a car with this plate')) {
        errorMessage = 'هذا العميل لديه بالفعل سيارة بنفس رقم اللوحة. لا يمكن تسجيل نفس السيارة مرتين لنفس العميل.'
      } else if (error.message?.includes('Phone number already exists')) {
        // This shouldn't happen with new logic, but keep for safety
        errorMessage = 'رقم الهاتف موجود مسبقاً. يمكنك تسجيل سيارة جديدة للعميل الموجود.'
      } else if (error.message?.includes('Plate number already exists')) {
        // This shouldn't happen with new logic, but keep for safety
        errorMessage = 'رقم اللوحة موجود مسبقاً. إذا تم بيع السيارة، يمكنك تسجيلها لمالك جديد.'
      }
      
      setErrors({ submit: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkOrder = () => {
    // In a real app, this would navigate to work order creation
    alert('Redirecting to work order creation...')
    navigate('/work-orders')
  }

  return (
    <Layout user={user} onLogout={onLogout} title={t('newClientPage.title')}>
      <div className="max-w-4xl mx-auto space-y-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-6 w-6 text-blue-600" />
              <span>{t('newClientPage.registerNewClient')}</span>
            </CardTitle>
            <CardDescription>
              {t('newClientPage.registerNewClientDescription')}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Success Message */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {success}
              <div className="mt-2">
                <Button 
                  onClick={handleCreateWorkOrder}
                  size="sm"
                  className="mr-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('newClientPage.createWorkOrder')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSuccess('')}
                >
                  {t('newClientPage.registerAnotherClient')}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>{t('newClientPage.clientInformation')}</span>
                {isExistingClient && (
                  <span className="text-sm font-normal text-blue-600">
                    ({t('newClientPage.existingClient') || 'عميل موجود'})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('newClientPage.firstName')}</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={clientData.firstName}
                    onChange={(e) => setClientData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder={t('newClientPage.enterFirstName')}
                    className={errors.firstName ? 'border-red-500' : ''}
                    disabled={isExistingClient}
                    readOnly={isExistingClient}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('newClientPage.lastName')}</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={clientData.lastName}
                    onChange={(e) => setClientData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder={t('newClientPage.enterLastName')}
                    className={errors.lastName ? 'border-red-500' : ''}
                    disabled={isExistingClient}
                    readOnly={isExistingClient}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">{t('newClientPage.phoneNumber')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={clientData.phone}
                  onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={t('newClientPage.enterPhoneNumber')}
                  maxLength={11}
                  className={errors.phone ? 'border-red-500' : ''}
                  disabled={isExistingClient}
                  readOnly={isExistingClient}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone}</p>
                )}
                {!isExistingClient && (
                  <p className="text-sm text-gray-500">
                    {t('newClientPage.phoneNumberHint')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="h-5 w-5" />
                <span>{t('newClientPage.vehicleInformation')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plate">{t('newClientPage.plateNumber')}</Label>
                  <Input
                    id="plate"
                    type="text"
                    value={carData.plate}
                    onChange={(e) => setCarData(prev => ({ ...prev, plate: e.target.value }))}
                    placeholder={t('newClientPage.enterPlateNumber')}
                    className={errors.plate ? 'border-red-500' : ''}
                    disabled={isExistingClient}
                    readOnly={isExistingClient}
                  />
                  {errors.plate && (
                    <p className="text-sm text-red-600">{errors.plate}</p>
                  )}
                  {!isExistingClient && (
                    <p className="text-sm text-gray-500">
                      {t('newClientPage.plateNumberHint')}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="counter">
                    {t('newClientPage.mileageCounter')}
                    {isExistingClient && <span className="text-red-500"> *</span>}
                  </Label>
                  <Input
                    id="counter"
                    type="number"
                    min="0"
                    value={carData.counter}
                    onChange={(e) => setCarData(prev => ({ ...prev, counter: e.target.value }))}
                    placeholder={t('newClientPage.enterMileageCounter')}
                    className={errors.counter ? 'border-red-500' : ''}
                  />
                  {errors.counter && (
                    <p className="text-sm text-red-600">{errors.counter}</p>
                  )}
                  {isExistingClient && (
                    <p className="text-sm text-blue-600">
                      {t('newClientPage.enterCurrentMileage') || 'أدخل العداد الحالي للسيارة'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">{t('newClientPage.brand')}</Label>
                  <Input
                    id="brand"
                    type="text"
                    value={carData.brand}
                    onChange={(e) => setCarData(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder={t('newClientPage.enterBrand')}
                    className={errors.brand ? 'border-red-500' : ''}
                    disabled={isExistingClient}
                    readOnly={isExistingClient}
                  />
                  {errors.brand && (
                    <p className="text-sm text-red-600">{errors.brand}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="model">{t('newClientPage.model')}</Label>
                  <Input
                    id="model"
                    type="text"
                    value={carData.model}
                    onChange={(e) => setCarData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder={t('newClientPage.enterModel')}
                    className={errors.model ? 'border-red-500' : ''}
                    disabled={isExistingClient}
                    readOnly={isExistingClient}
                  />
                  {errors.model && (
                    <p className="text-sm text-red-600">{errors.model}</p>
                  )}
                </div>
              </div>
              
              {!isExistingClient && (
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('newClientPage.notes')}</Label>
                  <Textarea
                    id="notes"
                    value={carData.notes}
                    onChange={(e) => setCarData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('newClientPage.additionalNotes')}
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Order Information (only for existing clients) */}
          {isExistingClient && (
            <>
              <Separator />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5" />
                    <span>{t('newClientPage.workOrderInformation') || 'معلومات أمر العمل'}</span>
                  </CardTitle>
                  <CardDescription>
                    {t('newClientPage.enterComplaintAndDeposit') || 'أدخل شكوى العميل والعربون'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="complaint">
                      {t('newClientPage.complaint') || 'الشكوى'} <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="complaint"
                      value={workOrderData.complaint}
                      onChange={(e) => setWorkOrderData(prev => ({ ...prev, complaint: e.target.value }))}
                      placeholder={t('newClientPage.enterComplaint') || 'أدخل شكوى العميل...'}
                      rows={3}
                      className={errors.complaint ? 'border-red-500' : ''}
                    />
                    {errors.complaint && (
                      <p className="text-sm text-red-600">{errors.complaint}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deposit">{t('newClientPage.deposit') || 'العربون'}</Label>
                    <Input
                      id="deposit"
                      type="number"
                      min="0"
                      value={workOrderData.deposit}
                      onChange={(e) => setWorkOrderData(prev => ({ ...prev, deposit: parseFloat(e.target.value) || 0 }))}
                      placeholder={t('newClientPage.enterDeposit') || 'أدخل مبلغ العربون'}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              {errors.submit && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/recorded-clients')}
                >
                  {t('newClientPage.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{t('newClientPage.saving')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="h-4 w-4" />
                      <span>
                        {isExistingClient 
                          ? (t('newClientPage.createWorkOrder') || 'إنشاء أمر عمل')
                          : t('newClientPage.registerClient')
                        }
                      </span>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </Layout>
  )
}

export default NewClient

