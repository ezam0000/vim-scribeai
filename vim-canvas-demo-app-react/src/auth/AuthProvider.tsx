import React, { useState, useCallback } from "react";
import { AuthContext, AuthContextType } from "./authContext";
import { useSupabaseSessionSync } from "@/hooks/useSupabaseSessionSync";
import { supabase } from "@/utils/supabase";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, loading, token, userId } = useSupabaseSessionSync();
  const [error, setError] = useState<string | null>(null);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // Session will be automatically updated via useSupabaseSessionSync
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred during login";
      setError(errorMessage);
      console.error("Login error:", err);
      throw err;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setError(null);

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      // Session will be automatically updated via useSupabaseSessionSync
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred during logout";
      setError(errorMessage);
      console.error("Logout error:", err);
      throw err;
    }
  }, []);

  // Create the context value
  const contextValue: AuthContextType = {
    user,
    token,
    userId,
    loading,
    login,
    logout,
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
