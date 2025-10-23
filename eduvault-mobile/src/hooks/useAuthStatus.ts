import { useAuth } from '@/context/AuthContext';

export const useAuthStatus = () => {
  const { user, token, isInitializing } = useAuth();
  return { user, token, isInitializing, isAuthenticated: Boolean(user && token) };
};
