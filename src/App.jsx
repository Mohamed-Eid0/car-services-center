import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { DataProvider } from './contexts/DataContext'
import { authAPI } from './services/api'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import ReceptionistDashboard from './components/ReceptionistDashboard'
import TechnicianDashboard from './components/TechnicianDashboard'
import AdminDashboard from './components/AdminDashboard'
import SuperAdminDashboard from './components/SuperAdminDashboard'
import RecordedClients from './components/RecordedClients'
import NewClient from './components/NewClient'
import WorkOrders from './components/WorkOrders'
import RecordWork from './components/RecordWork'
import Billing from './components/Billing'
import BillingDetail from './components/BillingDetail'
import Store from './components/Store'
import UserManagement from './components/UserManagement'
import Reports from './components/Reports'
import './App.css'
import { useTranslation } from 'react-i18next'

function App() {
  const { t, i18n } = useTranslation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = async (username, password) => {
    try {
      const response = await authAPI.login(username, password)
      const userData = {
        username: username,
        token: response.access_token,
        refreshToken: response.refresh_token
      }
      
      // Temporarily set user in localStorage so getCurrentUser can access the token
      localStorage.setItem("currentUser", JSON.stringify(userData))

      // Get user details
      const userDetails = await authAPI.getCurrentUser()
      const fullUserData = {
        ...userData,
        ...userDetails,
        role: userDetails.role.toLowerCase()
      }
      
      setUser(fullUserData)
      localStorage.setItem("currentUser", JSON.stringify(fullUserData))
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-700 ml-4">{t('app.loading')}</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  const getDashboardComponent = () => {
    const role = user.role?.toLowerCase()
    switch (role) {
      case 'receptionist':
        return ReceptionistDashboard
      case 'technician':
        return TechnicianDashboard
      case 'admin':
        return AdminDashboard
      case 'super_admin':
        return SuperAdminDashboard
      default:
        return Dashboard
    }
  }

  const DashboardComponent = getDashboardComponent()

  return (
    <DataProvider>
      <Router>
        <div className="min-h-screen bg-gray-50" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
          <Routes>
          <Route 
            path="/" 
            element={<DashboardComponent user={user} onLogout={handleLogout} />} 
          />
          
          {/* Shared Routes - Available to all authenticated users */}
          <Route 
            path="/recorded-clients" 
            element={<RecordedClients user={user} onLogout={handleLogout} />} 
          />
          <Route 
            path="/work-orders" 
            element={<WorkOrders user={user} onLogout={handleLogout} />} 
          />
          
          {/* Receptionist Routes */}
          {user.role?.toLowerCase() === 'receptionist' && (
            <>
              <Route 
                path="/new-client" 
                element={<NewClient user={user} onLogout={handleLogout} />} 
              />
              <Route 
                path="/work-orders/:workOrderId" 
                element={<WorkOrders user={user} onLogout={handleLogout} />} 
              />
            </>
          )}
          
          {/* Technician Routes */}
          {user.role?.toLowerCase() === 'technician' && (
            <>
              <Route 
                path="/record-work/:workOrderId" 
                element={<RecordWork user={user} onLogout={handleLogout} />} 
              />
              <Route 
                path="/record-work/edit/:workOrderId" 
                element={<RecordWork user={user} onLogout={handleLogout} isEdit={true} />} 
              />
              <Route 
                path="/billing/:workOrderId" 
                element={<BillingDetail user={user} onLogout={handleLogout} />} 
              />
            </>
          )}
          
          {/* Admin Routes */}
          {(user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'super_admin') && (
            <>
              <Route 
                path="/billing" 
                element={<Billing user={user} onLogout={handleLogout} />} 
              />
              <Route 
                path="/billing/:workOrderId" 
                element={<BillingDetail user={user} onLogout={handleLogout} />} 
              />
              <Route 
                path="/store" 
                element={<Store user={user} onLogout={handleLogout} />} 
              />
              <Route 
                path="/user-management" 
                element={<UserManagement user={user} onLogout={handleLogout} />} 
              />
              <Route 
                path="/reports" 
                element={<Reports user={user} onLogout={handleLogout} />} 
              />
            </>
          )}
          
          {/* Redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
    </DataProvider>
  )
}

export default App

