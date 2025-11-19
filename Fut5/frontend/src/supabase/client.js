import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Log básico para depuración (no imprimir keys completas en producción)
console.log('Supabase client init — URL:', SUPABASE_URL ? SUPABASE_URL : '(no VITE_SUPABASE_URL)')
console.log('Supabase client init — anon key present:', SUPABASE_ANON_KEY ? 'yes' : 'no')

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
