import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session refresh interval (5 minutes)
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000;
// Buffer time before expiry to refresh token (2 minutes)
const TOKEN_REFRESH_BUFFER = 2 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  const initialized = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Function to check if session needs refresh
  const shouldRefreshSession = useCallback((session: Session | null) => {
    if (!session?.expires_at) return false;
    const expiresAt = session.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    return expiresAt - now < TOKEN_REFRESH_BUFFER;
  }, []);

  // Function to handle session refresh
  const handleSessionRefresh = useCallback(async () => {
    if (!session || !shouldRefreshSession(session)) return;

    try {
      console.log('[AuthContext] Refreshing session...');
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[AuthContext] Session refresh error:', error);
        // Only clear session if it's an auth error
        if (error.message.includes('auth') || error.message.includes('token')) {
          setSession(null);
          setUser(null);
          sessionStorage.removeItem("invoiaiqpro_user");
          navigate("/login");
        }
        return;
      }

      if (newSession) {
        console.log('[AuthContext] Session refreshed successfully:', {
          newExpiry: newSession.expires_at,
          currentTime: Math.floor(Date.now() / 1000)
        });
        setSession(newSession);
        setUser(newSession.user);
        
        try {
          // Update session storage
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("*")
            .eq("id", newSession.user.id)
            .single();

          if (profileError) {
            console.error('[AuthContext] Error fetching profile during refresh:', profileError);
            // Don't clear session on profile fetch error
            return;
          }

          if (profile) {
            const userData = {
              ...newSession.user,
              ...profile,
            };
            sessionStorage.setItem("invoiaiqpro_user", JSON.stringify(userData));
          }
        } catch (profileError) {
          console.error('[AuthContext] Error updating profile during refresh:', profileError);
          // Don't clear session on profile update error
        }
      }
    } catch (error) {
      console.error('[AuthContext] Session refresh failed:', error);
      // Only clear session if it's an auth error
      if (error instanceof Error && (error.message.includes('auth') || error.message.includes('token'))) {
        setSession(null);
        setUser(null);
        sessionStorage.removeItem("invoiaiqpro_user");
        navigate("/login");
      }
    }
  }, [session, shouldRefreshSession, navigate]);

  // Set up session refresh interval
  useEffect(() => {
    if (session) {
      // Clear any existing timer
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }

      // Set up new timer with a shorter interval (2 minutes)
      const timer = setInterval(handleSessionRefresh, 2 * 60 * 1000);
      setRefreshTimer(timer);

      // Also check immediately
      handleSessionRefresh();

      return () => {
        if (timer) clearInterval(timer);
      };
    }
  }, [session, handleSessionRefresh]);

  // Initialize auth state
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    console.log('[AuthContext] Initializing auth provider...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[AuthContext] Error getting initial session:', error);
        // Don't clear session on initial load error
        setLoading(false);
        return;
      }

      console.log('[AuthContext] Initial session check:', {
        hasSession: !!session,
        sessionExpiry: session?.expires_at,
        currentTime: Math.floor(Date.now() / 1000),
        user: session?.user?.id
      });

      if (session) {
        setSession(session);
        setUser(session.user);
        
        // Update session storage
        (async () => {
          try {
            const { data: profile } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (profile) {
              const userData = {
                ...session.user,
                ...profile,
              };
              sessionStorage.setItem("invoiaiqpro_user", JSON.stringify(userData));
            }
          } catch (error) {
            console.error('[AuthContext] Error fetching initial profile:', error);
            // Don't clear session on profile fetch error
          }
        })();
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log(`[AuthContext] Auth state change:`, {
        event: _event,
        hasSession: !!session,
        sessionExpiry: session?.expires_at,
        currentTime: Math.floor(Date.now() / 1000),
        user: session?.user?.id
      });
      
      if (_event === "SIGNED_IN" || _event === "TOKEN_REFRESHED") {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (profile) {
              const userData = {
                ...session.user,
                ...profile,
              };
              sessionStorage.setItem("invoiaiqpro_user", JSON.stringify(userData));
            }
          } catch (error) {
            console.error('[AuthContext] Error fetching profile after auth change:', error);
          }
        }
      } else if (_event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        sessionStorage.removeItem("invoiaiqpro_user");
        navigate("/login");
      }
    });

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [navigate]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    refreshSession: handleSessionRefresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 