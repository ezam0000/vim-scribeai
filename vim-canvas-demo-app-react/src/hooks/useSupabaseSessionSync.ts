import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

export interface UseSupabaseSessionSyncReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  token: string | null;
  userId: string | null;
}

export const useSupabaseSessionSync = (): UseSupabaseSessionSyncReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const updateSession = useCallback((session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting initial session:", error);
        }
        updateSession(session);
      } catch (error) {
        console.error("Error in getInitialSession:", error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.email);

      switch (event) {
        case "SIGNED_IN":
        case "TOKEN_REFRESHED":
          updateSession(session);
          break;
        case "SIGNED_OUT":
          updateSession(null);
          break;
        case "PASSWORD_RECOVERY":
        case "USER_UPDATED":
          updateSession(session);
          break;
        default:
          // Handle any other auth events
          updateSession(session);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [updateSession]);

  return {
    user,
    session,
    loading,
    token: session?.access_token ?? null,
    userId: user?.id ?? null,
  };
};

export default useSupabaseSessionSync;
