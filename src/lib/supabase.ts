// Re-export from supabaseClient to avoid creating multiple GoTrueClient instances
export { supabase, typedSupabase, createSupabaseClient } from './supabaseClient';
export type { TypedSupabaseClient } from './supabaseClient';
