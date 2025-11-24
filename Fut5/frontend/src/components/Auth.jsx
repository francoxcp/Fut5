import React, { useState } from 'react'
import { supabase } from '../supabase/client'
import { useAuth } from '../hooks/useAuth'
import { useLoadingState } from '../hooks/useLoadingState'

export default function Auth(){
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const { loading, message, startLoading, setError, setSuccessMessage } = useLoadingState()

  async function handleSignUp(e){
    e.preventDefault()
    startLoading()
    const { data, error } = await supabase.auth.signUp({ email, password })
    if(error) setError(error)
    else setSuccessMessage('Registrado. Revisa tu email para verificar.')
  }

  async function handleSignIn(e){
    e.preventDefault()
    startLoading()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if(error) setError(error)
    else setSuccessMessage('Sesión iniciada')
  }

  async function handleSignOut(){
    await supabase.auth.signOut()
  }

  async function handlePhoneOtp(e){
    e.preventDefault()
    startLoading()
    const { data, error } = await supabase.auth.signInWithOtp({ phone })
    if(error) setError(error)
    else setSuccessMessage('Se envió código al teléfono.')
  }

  return (
    <section>
      <h2>Autenticación</h2>
      {user ? (
        <div>
          <p>Conectado como <strong>{user.email || user.phone}</strong></p>
          <div style={{display:'flex', gap:8}}>
            <button onClick={handleSignOut}>Cerrar sesión</button>
          </div>
        </div>
      ) : (
        <div>
          <form onSubmit={handleSignIn} style={{marginBottom:10}}>
            <label>
              Email
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com" />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" />
            </label>
            <div style={{display:'flex', gap:8}}>
              <button type="submit">Entrar</button>
              <button onClick={handleSignUp} disabled={loading} className="secondary">Registrar</button>
            </div>
          </form>

          <div style={{marginTop:8}}>
            <div className="contact-small">O inicia con SMS</div>
            <form onSubmit={handlePhoneOtp} style={{marginTop:6}}>
              <label>
                Teléfono (ej: +50670000000)
                <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+50670000000" />
              </label>
              <button type="submit">Enviar OTP</button>
            </form>
          </div>

          {message && <div style={{marginTop:8}} className="info-block">{message}</div>}
        </div>
      )}
    </section>
  )
}
