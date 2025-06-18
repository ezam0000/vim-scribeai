import { createClient } from "@supabase/supabase-js";

// Supabase configuration for ScribeAI Staging project (same as ScribeAIHealthie)
const supabaseUrl = "https://kfdtyvcntmaopgfbuytb.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZHR5dmNudG1hb3BnZmJ1eXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyOTAzODQsImV4cCI6MjA1Njg2NjM4NH0.KaRU4o12cCPu1Tx3ESqzokxwv8XHcskqAgLgSs7M_so";

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
