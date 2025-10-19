import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const Dashboard = ({ user, onLogout }) => {
  const { t } = useTranslation()
  return (
    <Layout user={user} onLogout={onLogout} title={t('dashboard.title')}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <span>{t('dashboard.defaultDashboard')}</span>
            </CardTitle>
            <CardDescription>
              {t('dashboard.fallbackDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {t('dashboard.welcome')} {user.firstName || user.username}! 
              {t('dashboard.roleMessage', { role: user.role })}
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default Dashboard

