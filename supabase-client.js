import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// TODO: Replace with your actual Supabase URL and Anon Key
const supabaseUrl = 'https://sqyhlnmcfeaidjspjzsq.supabase.co'
const supabaseAnonKey = 'sb_publishable_b8F_dnsh_b2xeSlfhpsjjg_P2NQIMto'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)