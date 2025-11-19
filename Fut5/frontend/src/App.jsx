import React, { useEffect, useState } from 'react'
import FieldList from './components/FieldList'
import ReserveForm from './components/ReserveForm'
import Auth from './components/Auth'
import AdminPanel from './components/AdminPanel'
import { supabase } from './supabase/client'

export default function App(){
  const [view, setView] = useState('principal') // 'auth' | 'principal' | 'admin'
  const [profile, setProfile] = useState(null)
  const [preselectFieldId, setPreselectFieldId] = useState(null)

  useEffect(()=>{
    fetchProfile()
    const { data: sub } = supabase.auth.onAuthStateChange(()=>{
      fetchProfile()
    })
    return () => sub.subscription?.unsubscribe && sub.subscription.unsubscribe()
  }, [])

  async function fetchProfile(){
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if(!user){ setProfile(null); return }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if(error){ setProfile(null); return }
    setProfile(data)
  }

  return (
    <div className="app">
      <header className="app-header">
        <img src="/fut5logo.png" className="logo" alt="Fut5 logo" />
        <div>
          <div className="contact-small">Reserva tu cancha de Fut5 | Abierto: 2:00/pm - 11:00pm</div>
        </div>
        <div className="contact">
          <div>Tel: <strong>+506 7000 0000</strong></div>
          <div>Email: <strong>contacto@fut5.example</strong></div>
        </div>
      </header>

      <nav className="top-nav">
        <div className="nav-left">
          <button onClick={()=>setView('principal')} className={`nav-btn primary ${view==='principal' ? 'active' : ''}`}>Principal</button>
        </div>
        <div className="nav-right">
          <button onClick={()=>setView('auth')} className={`nav-btn primary ${view==='auth' ? 'active' : ''}`}>Login / Register</button>
          {profile && profile.is_admin && <button onClick={()=>setView('admin')} className={`nav-btn ${view==='admin'? 'active':''}`}>Admin</button>}
        </div>
      </nav>

      <main className="container">
        <div className="left">
          {view === 'auth' && <Auth />}
          {view === 'principal' && <FieldList onQuickReserve={(fid)=>{ setPreselectFieldId(fid); setView('principal') }} preselectFieldId={preselectFieldId} />}
          {view === 'admin' && <AdminPanel />}
        </div>
        <div className="right">
          {view === 'principal' && <ReserveForm profile={profile} preselectFieldId={preselectFieldId} />}
          <section>
            <h2>Información</h2>
            <div className="info-block">
              - Dirección: Centro Deportivo Fut5, Ciudad Ejemplo<br/>
              - Teléfono: +506 7000 0000<br/>
              - Email: contacto@fut5.example
            </div>
            <div className="footer-note">Consejo: Verifica tu teléfono antes de reservar.</div>
          </section>
        </div>
      </main>
    </div>
  )
}
