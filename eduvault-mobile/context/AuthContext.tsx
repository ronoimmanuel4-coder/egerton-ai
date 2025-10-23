import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import { apiClient, setAuthToken } from '@/api/client';

const TOKEN_KEY = 'eduvault_token_v1';

type AuthUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  institution?: unknown;
  course?: unknown;
  yearOfStudy?: number;
  subscription?: unknown;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isInitializing: boolean;
  login: (params: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadStoredToken() {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to load stored token', error);
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      const storedToken = await loadStoredToken();
      if (!storedToken) {
        setIsInitializing(false);
        return;
      }

      try {
        setAuthToken(storedToken);
        const { data } = await apiClient.get('/api/auth/me');
        setUser(data.user ?? null);
        setToken(storedToken);
      } catch (error) {
        console.warn('Failed to restore auth session', error);
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setAuthToken(null);
        setUser(null);
        setToken(null);
      } finally {
        setIsInitializing(false);
      }
    };

    void initialize();
  }, []);

  const login = async ({ email, password }: { email: string; password: string }) => {
    const { data } = await apiClient.post('/api/auth/login', { email, password });
    const authToken: string | undefined = data?.token;
    if (!authToken) {
      throw new Error('Missing authentication token in response');
    }

    await SecureStore.setItemAsync(TOKEN_KEY, authToken);
    setAuthToken(authToken);
    setToken(authToken);
    setUser(data.user ?? null);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    const { data } = await apiClient.get('/api/auth/me');
    setUser(data.user ?? null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isInitializing, login, logout, refreshUser }),
    [user, token, isInitializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
