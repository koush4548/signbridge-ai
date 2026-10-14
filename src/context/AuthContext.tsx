import React, { createContext, useContext, useState, useEffect } from 'react';
import { SignBridgeUser } from '../types';

interface AuthContextType {
  user: SignBridgeUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (name: string, email: string) => Promise<boolean>;
}

const DEFAULT_USER: SignBridgeUser = {
  id: 'usr_koushik_primary',
  name: 'Koushik',
  email: 'koushigans7@gmail.com',
  role: 'Lead Researcher',
  createdAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SignBridgeUser | null>(DEFAULT_USER);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('sb_auth_token') || 'sb_jwt_default_session';
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        // Fallback to default user
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email: string, password = 'password123'): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('sb_auth_token', data.token);
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.error('Login error:', err);
    }
    setIsLoading(false);
    return false;
  };

  const register = async (name: string, email: string, password = 'password123'): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('sb_auth_token', data.token);
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.error('Registration error:', err);
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sb_auth_token');
  };

  const updateUser = async (name: string, email: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, email }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        return true;
      }
    } catch (err) {
      console.error('Update profile error:', err);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
