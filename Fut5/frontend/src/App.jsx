import React, { useState } from 'react'
import FieldList from './components/FieldList'
import ReserveForm from './components/ReserveForm'
import Auth from './components/Auth'
import AdminPanel from './components/AdminPanel'
import WhatsAppBubble from './components/WhatsAppBubble'
import { useProfile } from './hooks/useProfile'

export default function App(){
  const [view, setView] = useState('principal') // 'auth' | 'principal' | 'admin'
  const { profile } = useProfile()
  const [preselectFieldId, setPreselectFieldId] = useState(null)

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
        <WhatsAppBubble phone="+50670000000" message="Hola! Quisiera información sobre reservar una cancha." />
    </div>
  )
}
