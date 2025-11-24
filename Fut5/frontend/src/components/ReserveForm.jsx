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
      // Check for overlapping confirmed reservations for the same field
      const startISO = start.toISOString();
      const endISO = end.toISOString();
      const { data: overlaps, error: overlapError } = await supabase
        .from('reservations')
        .select('id,status,start,end')
        .eq('field_id', fieldId)
        .lt('start', endISO)
        .gt('end', startISO)
        .in('status', ['confirmed']);

      if (overlapError) {
        console.warn('Error checking overlaps', overlapError);
      }

      if (overlaps && overlaps.length) {
        setMessage('La franja seleccionada ya está ocupada (reserva confirmada). Elige otra hora.');
        setLoading(false);
        return;
      }

      // Create a pending reservation via RPC (returns confirmation token)
      const rpcRes = await supabase.rpc('create_pending_reservation', {
        p_field_id: fieldId,
        p_user_id: user.id,
        p_start: startISO,
        p_end: endISO,
        p_hold_minutes: 15,
        p_notes: null,
      });

      if (rpcRes.error) {
        setMessage('Error al crear la reserva: ' + rpcRes.error.message);
        setLoading(false);
        return;
      }

      // rpc returns reservation_id, confirmation_token, expires_at
      const [created] = rpcRes.data || [];
      const reservation_id = created?.reservation_id || null;
      const confirmation_token = created?.confirmation_token || null;

      // Try to notify via webhook if configured (e.g., send email/WhatsApp from server)
      const notifyUrl = import.meta.env.VITE_NOTIFICATION_WEBHOOK;
      if (notifyUrl && reservation_id && confirmation_token) {
        try {
          await fetch(notifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservation_id, confirmation_token, field_id: fieldId, start: startISO, end: endISO, user_id: user.id }),
          });
        } catch (err) {
          console.warn('No se pudo llamar al webhook de notificación:', err.message || err);
        }
      }

      setMessage(`Reserva creada (pendiente). Revisa tu correo para confirmar. Token: ${confirmation_token || ''}`);
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
