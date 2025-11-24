import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'

/**
 * Custom hook for managing user profile with auth state
 * Consolidates profile fetching pattern from App.jsx
 */
export function useProfile() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    fetchProfile()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      fetchProfile()
    })
    return () => sub.subscription?.unsubscribe()
  }, [])

  async function fetchProfile() {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (error) {
      setProfile(null)
      return
    }
    setProfile(data)
  }

  return { profile, refreshProfile: fetchProfile }
}
