import { useState, useEffect, useCallback } from 'react'
import { useData } from '../contexts/DataContext'

/**
 * Custom hook for fetching and auto-syncing data
 * @param {Function} fetchFunction - API function to fetch data
 * @param {string} dataType - Type of data (clients, cars, workOrders, etc.)
 * @param {Array} dependencies - Additional dependencies to trigger refetch
 */
export const useDataFetch = (fetchFunction, dataType, dependencies = []) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { lastUpdate } = useData()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchFunction()
      setData(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error(`Error fetching ${dataType}:`, err)
      setError(err.message || 'Error fetching data')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, dataType])

  // Fetch on mount and when lastUpdate changes for this data type
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, lastUpdate[dataType], ...dependencies])

  return { data, loading, error, refetch: fetchData, setData }
}
