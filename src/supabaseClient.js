import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Validación básica para evitar errores silenciosos
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan variables de entorno: VITE_SUPABASE_URL y/o VITE_SUPABASE_PUBLISHABLE_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseKey)