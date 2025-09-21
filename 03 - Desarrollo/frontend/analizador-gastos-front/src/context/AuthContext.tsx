import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userName: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('auth') === 'true';
  });
  const [userName, setUserName] = useState<string | null>(() => {
    return localStorage.getItem('userName') || null;
  });

  const login = async (email: string, password: string) => {
    // Mock login - replace with real API call later
    if (email === 'test@test.com' && password === '123456') {
      setIsAuthenticated(true);
      setUserName('Test User');
      localStorage.setItem('auth', 'true');
      localStorage.setItem('userName', 'Test User');
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, password: string) => {
    // Mock register - replace with real API call later
    if (name && email && password) {
      setIsAuthenticated(true);
      setUserName(name);
      localStorage.setItem('auth', 'true');
      localStorage.setItem('userName', name);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserName(null);
    localStorage.removeItem('auth');
    localStorage.removeItem('userName');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userName, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}