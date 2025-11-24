import React, { useState } from 'react'
import { supabase } from '../supabase/client'
import { useLoadingState } from '../hooks/useLoadingState'

export default function ConfirmReservation(){
  const [resId, setResId] = useState('')
  const [token, setToken] = useState('')
  const { loading, message, startLoading, setError, setSuccessMessage } = useLoadingState()

  const handleConfirm = async (e) => {
    e.preventDefault()
    startLoading()
    try{
      const { data, error } = await supabase.rpc('confirm_reservation_by_token', { res_id: resId, token })
      if(error){
        setError('Error: ' + error.message)
      } else {
        // data could be 'confirmed' / 'failed' / 'conflict'
        const result = Array.isArray(data) && data.length ? data[0] : data
        setSuccessMessage('Resultado: ' + result)
      }
    }catch(err){
      setError('Error inesperado: ' + err.message)
    }
  }

  return (
    <section>
      <h2>Confirmar Reserva</h2>
      <form onSubmit={handleConfirm}>
        <label>
          Reserva ID
          <input value={resId} onChange={e=>setResId(e.target.value)} />
        </label>
        <label>
          Token de confirmación
          <input value={token} onChange={e=>setToken(e.target.value)} />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Confirmando...' : 'Confirmar'}</button>
      </form>
      {message && <p style={{marginTop:8}}>{message}</p>}
    </section>
  )
}
