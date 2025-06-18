// Authentication context and types
export { AuthContext, useAuth } from "./authContext";
export type { AuthContextType } from "./authContext";

// Authentication provider
export { AuthProvider } from "./AuthProvider";

// Re-export session sync hook for convenience
export { useSupabaseSessionSync } from "@/hooks/useSupabaseSessionSync";
export type { UseSupabaseSessionSyncReturn } from "@/hooks/useSupabaseSessionSync";
