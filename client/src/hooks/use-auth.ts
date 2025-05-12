import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for logged in user in sessionStorage
    const storedUser = sessionStorage.getItem("invoaiq_user");
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user", error);
        sessionStorage.removeItem("invoaiq_user");
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const userData = await response.json();
      
      // Save to state and session storage
      setUser(userData);
      sessionStorage.setItem("invoaiq_user", JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      console.error("Login failed", error);
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
      
      // Save to state and session storage
      setUser(newUser);
      sessionStorage.setItem("invoaiq_user", JSON.stringify(newUser));
      
      return newUser;
    } catch (error) {
      console.error("Registration failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("invoaiq_user");
    setLocation("/login");
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout
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
