import { useState, useCallback, useEffect } from 'react';
import apiClient from '../api/client';

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  photo_url: string | null;
  position: string;
  phone: string | null;
}

interface AuthState {
  employee: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    employee: null,
    isAuthenticated: !!localStorage.getItem('accessToken'),
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedEmployee = localStorage.getItem('employee');
    if (token && storedEmployee) {
      try {
        setAuthState({
          employee: JSON.parse(storedEmployee),
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        setAuthState({ employee: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setAuthState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('employee', JSON.stringify(data.employee));
    setAuthState({
      employee: data.employee,
      isAuthenticated: true,
      isLoading: false,
    });
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('employee');
    setAuthState({ employee: null, isAuthenticated: false, isLoading: false });
  }, []);

  return { ...authState, login, logout };
}
