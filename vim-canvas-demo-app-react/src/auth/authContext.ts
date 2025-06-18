import { createContext, useContext } from "react";
import { User } from "@supabase/supabase-js";

// Interface for the authentication context
export interface AuthContextType {
  user: User | null;
  token: string | null;
  userId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

// Create the authentication context
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Hook to use the authentication context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
