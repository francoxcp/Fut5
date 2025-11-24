import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase/client'

export default function Auth({ onAuthChange }) {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('user')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(()=>{
    getUser()
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      getUser()
      onAuthChange(session?.user || null)
    })
    return () => sub.subscription?.unsubscribe && sub.subscription.unsubscribe()
  }, [onAuthChange])

  async function getUser(){
    const { data } = await supabase.auth.getUser()
    setUser(data.user || null)
    onAuthChange(data.user || null)
  }

  async function handleSignUp(e){
    e.preventDefault(); setLoading(true); setMessage(null)

    // Use Supabase signUp with `options.data` to store user metadata
    const { data, error } = await supabase.auth.signUp({ email, password }, { data: { full_name: fullName, phone, role } })
    if(error){
      setMessage(error.message)
      setLoading(false)
      return
    }

    // If the user object is returned (immediate sign-in), create a profile row
    const newUser = data?.user || null
    if(newUser){
      try {
        await supabase.from('profiles').insert({ id: newUser.id, full_name: fullName || null, phone: phone || null, is_admin: role === 'admin' })
      } catch (err) {
        console.warn('No se pudo crear profile desde cliente:', err.message || err)
      }
    }

    setMessage('Registrado. Revisa tu email para verificar si es necesario.')
    setLoading(false)
  }

  async function handleSignIn(e){
    e.preventDefault(); setLoading(true); setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if(error) setMessage(error.message)
    else setMessage('Sesión iniciada')
    setLoading(false)
    getUser()
  }

  async function handleSignOut(){
    await supabase.auth.signOut()
    setUser(null)
    onAuthChange(null)
  }

  async function handlePhoneOtp(e){
    e.preventDefault(); setLoading(true); setMessage(null)
    // Envío OTP al teléfono
    const { data, error } = await supabase.auth.signInWithOtp({ phone })
    if(error) setMessage(error.message)
    else setMessage('Se envió código al teléfono.')
    setLoading(false)
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
            </div>
          </form>

          <div style={{marginTop:8}}>
            <h3>Registrar nuevo usuario</h3>
            <form onSubmit={handleSignUp} style={{marginTop:6}}>
              <label>
                Nombre completo
                <input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Tu nombre" />
              </label>
              <label>
                Teléfono (ej: +50670000000)
                <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+50670000000" />
              </label>
              <label>
                Rol
                <select value={role} onChange={e=>setRole(e.target.value)}>
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
              <label>
                Email de registro
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com" />
              </label>
              <label>
                Contraseña
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" />
              </label>
              <div style={{display:'flex', gap:8, marginTop:8}}>
                <button type="submit" disabled={loading}>Registrar</button>
              </div>
            </form>
          </div>

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
