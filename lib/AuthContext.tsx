"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiClient, setAuthToken, type User } from "./api";

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "wingview_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persistToken = (value: string | null) => {
    if (typeof window === "undefined") return;
    if (value) {
      localStorage.setItem(TOKEN_KEY, value);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const refreshMe = useCallback(async () => {
    try {
      const me = await apiClient.getMe();
      setUser(me);
    } catch {
      setUser(null);
      setToken(null);
      setAuthToken(null);
      persistToken(null);
    }
  }, []);

  useEffect(() => {
    const boot = async () => {
      if (typeof window === "undefined") return;

      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (!savedToken) {
        setLoading(false);
        return;
      }

      setToken(savedToken);
      setAuthToken(savedToken);

      try {
        const me = await apiClient.getMe();
        setUser(me);
      } catch {
        setToken(null);
        setUser(null);
        setAuthToken(null);
        persistToken(null);
      } finally {
        setLoading(false);
      }
    };

    boot();
  }, []);

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      const res = await apiClient.login(payload);
      setToken(res.token);
      setUser(res.user);
      setAuthToken(res.token);
      persistToken(res.token);
    },
    []
  );

  const register = useCallback(
    async (payload: { name: string; email: string; password: string }) => {
      const res = await apiClient.register(payload);
      setToken(res.token);
      setUser(res.user);
      setAuthToken(res.token);
      persistToken(res.token);
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    persistToken(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshMe }),
    [user, token, loading, login, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}