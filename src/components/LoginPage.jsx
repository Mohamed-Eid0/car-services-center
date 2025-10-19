import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Car, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const LoginPage = ({ onLogin }) => {
  const { t, i18n } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const success = await onLogin(username, password)
      if (!success) {
        setError(t('loginPage.invalidUsernameOrPassword'))
      }
    } catch (error) {
      setError(t('loginPage.invalidUsernameOrPassword'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Car className="h-12 w-12 text-blue-600" />
              <Wrench className="h-6 w-6 text-orange-500 absolute -bottom-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {t('loginPage.title')}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t('loginPage.managementSystemLogin')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('loginPage.username')}</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('loginPage.enterYourUsername')}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('loginPage.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('loginPage.enterYourPassword')}
                required
                className="w-full"
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? t('loginPage.signingIn') : t('loginPage.signIn')}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">{t('loginPage.demoAccounts')}</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>{t('loginPage.superAdmin')}</strong> admin / admin123</div>
              <div><strong>{t('loginPage.receptionist')}</strong> receptionist / recep123</div>
              <div><strong>{t('loginPage.technician')}</strong> technician1 / tech123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage

