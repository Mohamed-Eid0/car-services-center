import { createContext, useContext, useState, useCallback } from 'react'

const DataContext = createContext()

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export const DataProvider = ({ children }) => {
  const [dataVersion, setDataVersion] = useState(0)
  const [lastUpdate, setLastUpdate] = useState({
    clients: 0,
    cars: 0,
    workOrders: 0,
    billing: 0,
    stock: 0,
    users: 0,
    techReports: 0
  })

  // Trigger a global data refresh
  const refreshAllData = useCallback(() => {
    setDataVersion(prev => prev + 1)
    setLastUpdate({
      clients: Date.now(),
      cars: Date.now(),
      workOrders: Date.now(),
      billing: Date.now(),
      stock: Date.now(),
      users: Date.now(),
      techReports: Date.now()
    })
  }, [])

  // Trigger specific data type refresh
  const refreshData = useCallback((dataType) => {
    setDataVersion(prev => prev + 1)
    setLastUpdate(prev => ({
      ...prev,
      [dataType]: Date.now()
    }))
  }, [])

  // Listen for storage changes from other tabs/windows
  useState(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('car_service_')) {
        refreshAllData()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [refreshAllData])

  const value = {
    dataVersion,
    lastUpdate,
    refreshAllData,
    refreshData,
    // Helper functions for common operations
    invalidateClients: () => refreshData('clients'),
    invalidateCars: () => refreshData('cars'),
    invalidateWorkOrders: () => refreshData('workOrders'),
    invalidateBilling: () => refreshData('billing'),
    invalidateStock: () => refreshData('stock'),
    invalidateUsers: () => refreshData('users'),
    invalidateTechReports: () => refreshData('techReports')
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
