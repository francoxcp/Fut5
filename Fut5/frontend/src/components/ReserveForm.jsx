
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useLoadingState } from '../hooks/useLoadingState';

export default function ReserveForm({ profile, preselectFieldId }) {
  const { data: fields } = useSupabaseQuery('fields', { orderBy: 'name' });
  const [fieldId, setFieldId] = useState('');
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('14');
  const { loading, message, startLoading, setError, setSuccessMessage } = useLoadingState();

  useEffect(() => {
    if (fields && fields.length && !fieldId) {
      setFieldId(fields[0].id);
    }
  }, [fields]);

  useEffect(()=>{
    if(preselectFieldId){
      setFieldId(preselectFieldId)
    }
  }, [preselectFieldId])

  const handleSubmit = async (e) => {
    e.preventDefault();
    startLoading();
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) { setError('Debes iniciar sesión para reservar.'); return; }
      if (!fieldId || !date || !hour) { setError('Completa todos los campos.'); return; }
      // Reserva simple: fecha y hora seleccionada, duración 1h
      const start = new Date(`${date}T${hour.padStart(2, '0')}:00:00`);
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      const payload = {
        field_id: fieldId,
        user_id: user.id,
        start: start.toISOString(),
        end: end.toISOString(),
        status: 'booked',
        notes: null
      };
      const { data, error } = await supabase.from('reservations').insert(payload).select().single();
      if (error) {
        setError('Error al reservar: ' + error.message);
      } else {
        setSuccessMessage('¡Reserva exitosa! Nos vemos en la cancha ⚽');
      }
    } catch (err) {
      setError('Error inesperado: ' + err.message);
    }
  };

  // Horas disponibles (14 a 22)
  const hours = Array.from({ length: 9 }, (_, i) => (14 + i).toString());

  return (
    <section className="reserva-box">
      <h2 className="reserva-titulo">Reserva tu cancha</h2>
      <form className="reserva-form" onSubmit={handleSubmit}>
        <div className="reserva-campo">
          <label>Cancha</label>
          <select value={fieldId} onChange={e => setFieldId(e.target.value)}>
            <option value="">Selecciona una cancha</option>
            {fields.map(f => (
              <option key={f.id} value={f.id}>{f.name} — {f.status}</option>
            ))}
          </select>
        </div>
        <div className="reserva-campo">
          <label>Fecha</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
        </div>
        <div className="reserva-campo">
          <label>Hora</label>
          <select value={hour} onChange={e => setHour(e.target.value)}>
            {hours.map(h => (
              <option key={h} value={h}>{h}:00</option>
            ))}
          </select>
        </div>
        <button className="reserva-btn" type="submit" disabled={loading}>{loading ? 'Reservando...' : 'Reservar ahora'}</button>
      </form>
      {message && <div className="reserva-mensaje">{message}</div>}
    </section>
  );
}
