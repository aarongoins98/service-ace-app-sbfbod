
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserData, clearUserData as clearStoredUserData, TechnicianInfo } from '@/utils/userStorage';

interface AuthContextType {
  isAuthenticated: boolean;
  userData: TechnicianInfo | null;
  login: (userData: TechnicianInfo) => void;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<TechnicianInfo | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const data = await getUserData();
      if (data) {
        setUserData(data);
        setIsAuthenticated(true);
        console.log('User authenticated:', data.email);
      } else {
        setUserData(null);
        setIsAuthenticated(false);
        console.log('No user data found');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUserData(null);
      setIsAuthenticated(false);
    }
  };

  const login = (data: TechnicianInfo) => {
    setUserData(data);
    setIsAuthenticated(true);
    console.log('User logged in:', data.email);
  };

  const logout = async () => {
    try {
      await clearStoredUserData();
      setUserData(null);
      setIsAuthenticated(false);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const refreshUserData = async () => {
    await checkAuthStatus();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userData, login, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
