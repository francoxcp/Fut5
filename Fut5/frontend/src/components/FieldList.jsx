import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'

export default function FieldList({ onQuickReserve, preselectFieldId }){
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(()=>{
    load()
  }, [])

  async function load(){
    setLoading(true)
    setErrorMsg(null)
    try{
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
      const { data, error } = await supabase.from('fields').select('*').order('name')
      if(error){
        console.error('Error cargando canchas', error)
        setErrorMsg(error.message || String(error))
        setFields([])
      } else {
        setFields(data || [])
      }
    }catch(err){
      console.error('Exception fetching fields', err)
      setErrorMsg(err.message || String(err))
      setFields([])
    }finally{
      setLoading(false)
    }
  }

  return (
    <section>
      <h2>Canchas</h2>
      <div>
        {loading && <div className="contact-small">Cargando canchas...</div>}
        {fields.map(f => (
          (() => {
            const isSelected = preselectFieldId && preselectFieldId === f.id
            return (
              <div key={f.id} className={`field-card pitch-card ${isSelected? 'selected':''}`}>
                <div className="pitch-wrap" aria-hidden>
              <svg viewBox="0 0 160 90" className="pitch-svg" preserveAspectRatio="xMidYMid meet">
                <rect x="2" y="2" width="156" height="86" rx="6" fill="#14532d" opacity="0.25" />
                <rect x="8" y="8" width="144" height="72" rx="4" fill="#16a34a" />
                <rect x="18" y="18" width="124" height="54" rx="3" fill="#16a34a" opacity="0.95" />
                <line x1="80" y1="20" x2="80" y2="70" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.9" />
                <rect x="12" y="33" width="8" height="24" fill="#ffffff" opacity="0.15" />
                <rect x="140" y="33" width="8" height="24" fill="#ffffff" opacity="0.15" />
                <circle cx="80" cy="45" r="8" stroke="#ffffff" stroke-width="1.2" fill="none" />
              </svg>
            </div>
                <div className="field-info">
                  <div className="field-name">{f.name}</div>
                  <div className="meta">Capacidad: {f.capacity || 10} · {f.code || ''}</div>
                </div>
                <div className="field-actions">
                  <div style={{display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end'}}>
                    <button
                      className={`btn-quick ${isSelected? 'selected':''}`}
                      onClick={()=> onQuickReserve ? onQuickReserve(f.id) : null}
                      disabled={f.status !== 'available'}
                      aria-pressed={isSelected}
                    >{f.status === 'available' ? 'Reservar ahora' : 'No disponible'}</button>
                    <div className={`badge ${f.status==='available' ? 'available' : 'maintenance'}`}>{(f.status||'').toUpperCase()}</div>
                  </div>
                </div>
              </div>
            )
          })()
        ))}
        {(!loading && fields.length === 0) && <div className="contact-small">No hay canchas.</div>}
        {errorMsg && <div style={{color:'crimson'}}>Error: {errorMsg}</div>}
      </div>
    </section>
  )
}
