import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'

/**
 * Custom hook for fetching data from Supabase with loading and error states
 * Consolidates data fetching patterns used in AdminPanel, FieldList, and ReserveForm
 */
export function useSupabaseQuery(table, options = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { orderBy, orderAscending = true, autoFetch = true } = options

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from(table).select('*')
      if (orderBy) {
        query = query.order(orderBy, { ascending: orderAscending })
      }
      const { data: result, error: fetchError } = await query
      if (fetchError) {
        console.error(`Error loading ${table}`, fetchError)
        setError(fetchError.message || String(fetchError))
        setData([])
      } else {
        setData(result || [])
      }
    } catch (err) {
      console.error(`Exception fetching ${table}`, err)
      setError(err.message || String(err))
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [table, orderBy, orderAscending])

  return { data, loading, error, refetch: fetchData }
}
