import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { User } from '../types';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  planId?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vb_token'));
  const [loading, setLoading] = useState<boolean>(Boolean(localStorage.getItem('vb_token')));

  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem('vb_token');
    if (!stored) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setToken(stored);
    } catch {
      localStorage.removeItem('vb_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('vb_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (input: RegisterInput): Promise<User> => {
    const { data } = await api.post('/auth/register', input);
    localStorage.setItem('vb_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('vb_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
