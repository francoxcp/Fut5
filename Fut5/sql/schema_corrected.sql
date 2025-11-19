-- schema_corrected.sql
-- Script corregido y simplificado para Fut5 (Supabase / Postgres)
-- Evita el uso de "ADD CONSTRAINT IF NOT EXISTS" y "CREATE POLICY IF NOT EXISTS";
-- usamos DROP ... IF EXISTS antes de CREATE cuando Postgres no admite IF NOT EXISTS.

-- 0) Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 1) Tabla: fields (canchas)
CREATE TABLE IF NOT EXISTS public.fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  status text NOT NULL DEFAULT 'available', -- available, maintenance, closed
  capacity int DEFAULT 10,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

-- 2) Tabla: profiles (complemento a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  is_phone_verified boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  no_show_count int DEFAULT 0,
  is_blocked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3) Tabla: reservations (base simplificada)
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  start timestamptz NOT NULL,
  "end" timestamptz NOT NULL,
  period tstzrange,
  status text NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, no_show
  confirmation_token text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  notes text
);

-- 4) Índices básicos
CREATE INDEX IF NOT EXISTS idx_reservations_field ON public.reservations (field_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON public.reservations (user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_start ON public.reservations (start);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations (status);

-- 5) CHECK: start < end (si no existe, lo añadimos usando DROP/ADD)
ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS chk_start_before_end;
ALTER TABLE public.reservations
  ADD CONSTRAINT chk_start_before_end CHECK (start < "end");

-- 6) Trigger para setear period desde start/end
CREATE OR REPLACE FUNCTION public.set_reservation_period()
RETURNS trigger AS $$
BEGIN
  NEW.period := tstzrange(NEW.start, NEW."end", '[)');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_reservation_period ON public.reservations;
CREATE TRIGGER trg_set_reservation_period
BEFORE INSERT OR UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.set_reservation_period();

-- 7) Exclusion constraint para evitar solapamiento de reservas CONFIRMADAS
ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS no_overlapping_confirmed_reservations;

ALTER TABLE public.reservations
  ADD CONSTRAINT no_overlapping_confirmed_reservations
  EXCLUDE USING gist (field_id WITH =, period WITH &&)
  WHERE (status = 'confirmed');

-- 8) RPC: create_pending_reservation
CREATE OR REPLACE FUNCTION public.create_pending_reservation(
  p_field_id uuid,
  p_user_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_hold_minutes int DEFAULT 15,
  p_notes text DEFAULT NULL
)
RETURNS TABLE(reservation_id uuid, confirmation_token text, expires_at timestamptz) AS $$
DECLARE
  tok text := encode(gen_random_bytes(16), 'hex');
  e_at timestamptz := now() + (p_hold_minutes || ' minutes')::interval;
  new_id uuid;
BEGIN
  INSERT INTO public.reservations(field_id, user_id, start, "end", period, status, confirmation_token, expires_at, notes)
  VALUES (p_field_id, p_user_id, p_start, p_end, tstzrange(p_start, p_end, '[)'), 'pending', tok, e_at, p_notes)
  RETURNING id INTO new_id;

  RETURN QUERY SELECT new_id, tok, e_at;
END;
$$ LANGUAGE plpgsql;

-- 9) RPC: confirm_reservation_by_token
CREATE OR REPLACE FUNCTION public.confirm_reservation_by_token(res_id uuid, token text)
RETURNS text AS $$
DECLARE
  updated_count int;
BEGIN
  UPDATE public.reservations
  SET status = 'confirmed', confirmation_token = NULL, expires_at = NULL
  WHERE id = res_id
    AND confirmation_token = token
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > now());

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count = 1 THEN
    RETURN 'confirmed';
  ELSE
    RETURN 'failed';
  END IF;
EXCEPTION WHEN unique_violation OR exclusion_violation THEN
  RETURN 'conflict';
END;
$$ LANGUAGE plpgsql;

-- 10) Cleanup: cancelar pendings expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_pendings()
RETURNS int AS $$
DECLARE
  cnt int;
BEGIN
  UPDATE public.reservations
  SET status = 'cancelled'
  WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at <= now();

  GET DIAGNOSTICS cnt = ROW_COUNT;
  RETURN cnt;
END;
$$ LANGUAGE plpgsql;

-- 11) Habilitar RLS en tablas
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 12) POLÍTICAS RLS (DROP si existe y CREATE)

-- Fields: lectura pública
DROP POLICY IF EXISTS fields_select_public ON public.fields;
CREATE POLICY fields_select_public ON public.fields
  FOR SELECT USING (true);

-- Fields: admins sólo
DROP POLICY IF EXISTS fields_admin_all ON public.fields;
CREATE POLICY fields_admin_all ON public.fields
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Profiles: cada usuario ve/modifica sólo su profile
DROP POLICY IF EXISTS profiles_own ON public.profiles;
CREATE POLICY profiles_own ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Profiles: admin puede ver todos
DROP POLICY IF EXISTS profiles_admin_view ON public.profiles;
CREATE POLICY profiles_admin_view ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Reservations: insertar sólo usuarios autenticados y no bloqueados
DROP POLICY IF EXISTS reservations_insert ON public.reservations;
CREATE POLICY reservations_insert ON public.reservations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (SELECT is_blocked FROM public.profiles WHERE id = auth.uid()) = false
  );

-- Reservations: usuarios ven sólo sus reservas
DROP POLICY IF EXISTS reservations_select_own ON public.reservations;
CREATE POLICY reservations_select_own ON public.reservations
  FOR SELECT USING (auth.uid() = user_id);

-- Reservations: usuarios pueden actualizar sus reservas
DROP POLICY IF EXISTS reservations_update_own ON public.reservations;
CREATE POLICY reservations_update_own ON public.reservations
  FOR UPDATE USING (auth.uid() = user_id);

-- Reservations: admins tienen acceso completo
DROP POLICY IF EXISTS reservations_admin_all ON public.reservations;
CREATE POLICY reservations_admin_all ON public.reservations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 13) Seeds de ejemplo (opcional)
INSERT INTO public.fields (name, code, status, capacity) VALUES
  ('Cancha Principal', 'A', 'available', 10),
  ('Cancha Secundaria', 'B', 'available', 10),
  ('Cancha VIP', 'C', 'maintenance', 8)
ON CONFLICT DO NOTHING;

-- 14) Recomendaciones finales (leer después de ejecutar):
-- - Programa una tarea periódica que ejecute public.cleanup_expired_pendings().
-- - Envía confirmation_token al usuario por email/SMS desde una Edge Function al crear la reserva.
-- - No expongas la service_role key en el cliente.
-- - Considera añadir CHECKs horarios si quieres restringir horas permitidas para reservas.

-- FIN
