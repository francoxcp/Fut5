import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import Auth from './Auth';

export default function ReserveForm({ profile, preselectFieldId }) {
  const [fields, setFields] = useState([]);
  const [fieldId, setFieldId] = useState('');
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('14');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (preselectFieldId) {
      setFieldId(preselectFieldId);
    }
  }, [preselectFieldId]);

  async function fetchFields() {
    const { data, error } = await supabase.from('fields').select('*').order('name');
    if (error) {
      console.error('Error fetching fields', error);
      return;
    }
    setFields(data);
    if (data && data.length) setFieldId(data[0].id);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      if (!user) {
        setMessage('Debes iniciar sesión para reservar.');
        setLoading(false);
        return;
      }
      if (!fieldId || !date || !hour) {
        setMessage('Completa todos los campos.');
        setLoading(false);
        return;
      }
      const start = new Date(`${date}T${hour.padStart(2, '0')}:00:00`);
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      const payload = {
        field_id: fieldId,
        user_id: user.id,
        start: start.toISOString(),
        end: end.toISOString(),
        status: 'booked',
        notes: null,
      };
      const { error } = await supabase.from('reservations').insert(payload);
      if (error) {
        setMessage('Error al reservar: ' + error.message);
      } else {
        setMessage('¡Reserva exitosa! Nos vemos en la cancha ⚽');
      }
    } catch (err) {
      setMessage('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      {!user ? (
        <Auth onAuthChange={setUser} />
      ) : (
        <div>
          <h2>Reserva tu cancha</h2>
          <form onSubmit={handleSubmit}>
            <label>Cancha</label>
            <select value={fieldId} onChange={(e) => setFieldId(e.target.value)}>
              <option value="">Selecciona una cancha</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.status}
                </option>
              ))}
            </select>
            <label>Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <label>Hora</label>
            <select value={hour} onChange={(e) => setHour(e.target.value)}>
              {Array.from({ length: 9 }, (_, i) => (14 + i).toString()).map((h) => (
                <option key={h} value={h}>
                  {h}:00
                </option>
              ))}
            </select>
            <button type="submit" disabled={loading}>
              {loading ? 'Reservando...' : 'Reservar ahora'}
            </button>
          </form>
          {message && <div>{message}</div>}
        </div>
      )}
    </section>
  );
}
