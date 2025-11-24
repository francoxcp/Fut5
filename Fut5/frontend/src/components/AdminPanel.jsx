import React from 'react'
import { supabase } from '../supabase/client'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'

export default function AdminPanel(){
  const { data: reservations, loading, refetch: load } = useSupabaseQuery('reservations', { orderBy: 'start' })

  async function markCheckedIn(id, user_id){
    // set status = 'checked_in'
    const { error } = await supabase.from('reservations').update({ status: 'checked_in' }).eq('id', id)
    if(error){ alert('Error: '+error.message); return }
    await load()
  }

  async function markNoShow(id, user_id){
    const { error } = await supabase.from('reservations').update({ status: 'no_show' }).eq('id', id)
    if(error){ alert('Error: '+error.message); return }
    // Increment no_show_count if possible via update
    await supabase.from('profiles').update({ no_show_count: (Math.floor(Math.random()*0)+1) }).eq('id', user_id).limit(1)
    // Note: incrementing safely may require an RPC or service role; this is a placeholder.
    await load()
  }

  return (
    <section>
      <h2>Admin - Reservas</h2>
      {loading && <p>Cargando...</p>}
      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th>Cancha</th>
            <th>User</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Status</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map(r => (
            <tr key={r.id} style={{borderTop:'1px solid #ddd'}}>
              <td>{r.field_id}</td>
              <td>{r.user_id}</td>
              <td>{new Date(r.start).toLocaleString()}</td>
              <td>{new Date(r.end).toLocaleString()}</td>
              <td>{r.status}</td>
              <td style={{display:'flex', gap:8}}>
                <button onClick={()=>markCheckedIn(r.id, r.user_id)}>Check-in</button>
                <button onClick={()=>markNoShow(r.id, r.user_id)} style={{background:'#e11'}}>No-show</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
