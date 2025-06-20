// Environment variables configuration
// This file handles environment variables for both local and production environments

// ScribeAI API Key
export const SCRIBEAI_API_KEY =
  import.meta.env.VITE_SCRIBEAI_API_KEY || process.env.SCRIBEAI_API_KEY;

// Auth configuration
export const CLIENT_ID = import.meta.env.CLIENT_ID || process.env.CLIENT_ID;
export const CLIENT_SECRET =
  import.meta.env.CLIENT_SECRET || process.env.CLIENT_SECRET;
export const REDIRECT_URL =
  import.meta.env.REDIRECT_URL ||
  process.env.REDIRECT_URL ||
  (typeof window !== "undefined"
    ? `${window.location.origin}`
    : "http://localhost:8788");

// API Base URL - Use environment variable with fallback to production endpoint
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "https://api-scribeai-31058533dd54.herokuapp.com";

// Signup URL - Configurable for different environments
export const SIGNUP_URL =
  import.meta.env.VITE_SIGNUP_URL ||
  process.env.SIGNUP_URL ||
  "https://scribeai.live/signup";

// Supabase configuration
export const VITE_SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
export const VITE_SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Log environment setup in development only
if (import.meta.env.DEV) {
  console.log("Environment configuration loaded");
  console.log("REDIRECT_URL:", REDIRECT_URL);
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log("SIGNUP_URL:", SIGNUP_URL);
}
