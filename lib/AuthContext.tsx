"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  login as loginApi,
  register as registerApi,
  setAuthToken,
  type AuthResponse,
} from "./api";

type UserSession = {
  userId: number;
  fullName: string;
};

type AuthContextType = {
  user: UserSession | null;
  token: string | null;
  loading: boolean;
  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (
    fullName: string,
    phoneNumber: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "wingview_token";
const USER_KEY = "wingview_user";

function saveSession(data: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      userId: data.userId,
      fullName: data.fullName,
    })
  );
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getInitialToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

function getInitialUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = localStorage.getItem(USER_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as UserSession;
  } catch {
    clearSession();
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(() => getInitialUser());
  const [token, setToken] = useState<string | null>(() => getInitialToken());
  const loading = false;

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const login = useCallback(async (phoneNumber: string, password: string) => {
    const data = await loginApi({ phoneNumber, password });
    saveSession(data);
    setToken(data.token);
    setUser({
      userId: data.userId,
      fullName: data.fullName,
    });
  }, []);

  const register = useCallback(
    async (fullName: string, phoneNumber: string, password: string) => {
      const data = await registerApi({ fullName, phoneNumber, password });
      saveSession(data);
      setToken(data.token);
      setUser({
        userId: data.userId,
        fullName: data.fullName,
      });
    },
    []
  );

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}