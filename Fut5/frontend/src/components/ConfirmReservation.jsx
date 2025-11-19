import React, { useState } from 'react'
import { supabase } from '../supabase/client'

export default function ConfirmReservation(){
  const [resId, setResId] = useState('')
  const [token, setToken] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try{
      const { data, error } = await supabase.rpc('confirm_reservation_by_token', { res_id: resId, token })
      if(error){
        setMessage('Error: ' + error.message)
      } else {
        // data could be 'confirmed' / 'failed' / 'conflict'
        const result = Array.isArray(data) && data.length ? data[0] : data
        setMessage('Resultado: ' + result)
      }
    }catch(err){
      setMessage('Error inesperado: ' + err.message)
    }finally{
      setLoading(false)
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
