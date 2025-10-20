import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Car,
  Wrench,
  LogOut,
  Menu,
  X,
  Home,
  Users,
  UserPlus,
  ClipboardList,
  Settings,
  DollarSign,
  Package,
  BarChart3,
  FileText
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

const Layout = ({ user, onLogout, children }) => {
  const { t, i18n } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const getNavigationItems = () => {
    const items = [
      { path: '/', icon: Home, label: t('layout.dashboard'), roles: ['receptionist', 'technician', 'admin', 'super_admin'] }
    ]

    if (user.role === 'receptionist') {
      items.push(
        { path: '/recorded-clients', icon: Users, label: t('layout.recordedClients') },
        { path: '/new-client', icon: UserPlus, label: t('layout.newClient') },
        { path: '/work-orders', icon: ClipboardList, label: t('layout.workOrders') }
      )
    }

    if (user.role === 'technician') {
      items.push(
        { path: '/work-orders', icon: ClipboardList, label: t('layout.workOrders') }
      )
    }

    if (user.role === 'admin' || user.role === 'super_admin') {
      items.push(
        { path: '/recorded-clients', icon: Users, label: t('layout.recordedClients') },
        { path: '/work-orders', icon: ClipboardList, label: t('layout.workOrders') },
        { path: '/billing', icon: DollarSign, label: t('layout.billing') },
        { path: '/store', icon: Package, label: t('layout.storeManagement') },
        { path: '/user-management', icon: Settings, label: t('layout.userManagement') }
      )
    }

    if (user.role === 'super_admin') {
      items.push(
        { path: '/reports', icon: BarChart3, label: t('layout.reports') }
      )
    }

    return items.filter(item => !item.roles || item.roles.includes(user.role))
  }

  const navigationItems = getNavigationItems()

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'text-purple-600'
      case 'admin': return 'text-blue-600'
      case 'receptionist': return 'text-green-600'
      case 'technician': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin': return t('layout.superAdminRole')
      case 'admin': return t('layout.adminRole')
      case 'receptionist': return t('layout.receptionistRole')
      case 'technician': return t('layout.technicianRole')
      default: return role
    }
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Fixed Top Navbar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm border-b flex items-center justify-between px-6 z-40">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {user.first_name?.[0] || user.username[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {user.first_name} {user.last_name}
              </p>
              <p className={`text-xs font-medium ${getRoleColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Car className="h-8 w-8 text-blue-600" />
            <Wrench className="h-4 w-4 text-orange-500 absolute -bottom-1 -right-1" />
          </div>
          <span className="text-lg font-bold text-gray-900">{t('layout.serviceCenter')}</span>
        </div>
      </div>

      {/* Slide-in Menu from Right */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">{t('layout.menu')}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            {t('layout.signOut')}
          </Button>
        </div>
      </div>

      {/* Page content with top padding */}
      <main className="pt-16">
        <div className="p-4 sm:p-6 mt-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout

