import { useState } from 'react'

/**
 * Custom hook for managing loading and message states
 * Consolidates loading/message state management used across multiple components
 */
export function useLoadingState() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const startLoading = () => {
    setLoading(true)
    setMessage(null)
  }

  const stopLoading = () => {
    setLoading(false)
  }

  const setError = (error) => {
    setMessage(error?.message || String(error))
    setLoading(false)
  }

  const setSuccessMessage = (msg) => {
    setMessage(msg)
    setLoading(false)
  }

  return {
    loading,
    message,
    startLoading,
    stopLoading,
    setError,
    setSuccessMessage,
    setMessage,
  }
}
