// frontend/context/auth-context.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Api, HopOnUser } from '@/lib/api';
import { socketClient } from '@/lib/socket';

interface AuthContextType {
  user: HopOnUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<HopOnUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await Api.getCurrentUser();
      setUser(user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    }
  }, []);

  const login = useCallback(async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    
    try {
      const { user } = await Api.getCurrentUser();
      setUser(user);
      
      // Connect to socket
      socketClient.connect(accessToken);
    } catch (error) {
      console.error('Login failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    socketClient.disconnect();
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          const { user } = await Api.getCurrentUser();
          setUser(user);
          socketClient.connect(token);
        } catch (error) {
          console.error('Auth initialization failed:', error);
          // Try to refresh token
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const { access_token } = await Api.refreshToken(refreshToken);
              localStorage.setItem('access_token', access_token);
              const { user } = await Api.getCurrentUser();
              setUser(user);
              socketClient.connect(access_token);
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              logout();
            }
          } else {
            logout();
          }
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, [logout]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
