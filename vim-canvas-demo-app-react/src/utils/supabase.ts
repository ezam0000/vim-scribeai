import { createClient } from "@supabase/supabase-js";
import { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } from "@/config/env";

// Supabase configuration for ScribeAI Staging project (same as ScribeAIHealthie)
const supabaseUrl = VITE_SUPABASE_URL;
const supabaseAnonKey = VITE_SUPABASE_ANON_KEY;

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
