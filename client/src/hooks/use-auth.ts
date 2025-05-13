import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = "invoiaiqpro_user";
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const refreshSession = async () => {
    try {
      const response = await apiRequest("GET", "/api/auth/verify");
      const userData = await response.json();
      setUser(userData);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error("Session verification failed", error);
      setUser(null);
      sessionStorage.removeItem(SESSION_KEY);
      setLocation("/login");
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = sessionStorage.getItem(SESSION_KEY);
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          await refreshSession();
        } catch (error) {
          console.error("Failed to parse stored user", error);
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();

    // Set up periodic session check
    const intervalId = setInterval(refreshSession, SESSION_CHECK_INTERVAL);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [setLocation]);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const userData = await response.json();
      
      setUser(userData);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
      
      toast({
        title: "Login successful",
        description: "Welcome back to invoiaiqpro!",
      });
      
      return userData;
    } catch (error) {
      console.error("Login failed", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<User> => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      const newUser = await response.json();
      
      setUser(newUser);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
      
      toast({
        title: "Registration successful",
        description: "Welcome to invoiaiqpro!",
      });
      
      return newUser;
    } catch (error) {
      console.error("Registration failed", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please check your information and try again",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUser(null);
      sessionStorage.removeItem(SESSION_KEY);
      setLocation("/login");
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshSession
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}
