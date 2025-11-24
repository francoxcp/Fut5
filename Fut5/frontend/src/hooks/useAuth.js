import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'

/**
 * Custom hook for managing authentication state
 * Consolidates auth state management used in App.jsx and Auth.jsx
 */
export function useAuth() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchUser()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })
    return () => sub.subscription?.unsubscribe && sub.subscription.unsubscribe()
  }, [])

  async function fetchUser() {
    const { data } = await supabase.auth.getUser()
    setUser(data.user || null)
  }

  return { user, refreshUser: fetchUser }
}
