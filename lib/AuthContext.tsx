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

type StoredUser = {
  userId: number;
  fullName: string;
};

type AuthContextType = {
  user: StoredUser | null;
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

function persistAuth(data: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      userId: data.userId,
      fullName: data.fullName,
    })
  );
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    if (savedToken) {
      setTokenState(savedToken);
      setAuthToken(savedToken);
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        clearAuth();
      }
    }

    setLoading(false);
  }, []);

  const login = useCallback(async (phoneNumber: string, password: string) => {
    const data = await loginApi({ phoneNumber, password });
    persistAuth(data);
    setTokenState(data.token);
    setAuthToken(data.token);
    setUser({
      userId: data.userId,
      fullName: data.fullName,
    });
  }, []);

  const register = useCallback(
    async (fullName: string, phoneNumber: string, password: string) => {
      const data = await registerApi({ fullName, phoneNumber, password });
      persistAuth(data);
      setTokenState(data.token);
      setAuthToken(data.token);
      setUser({
        userId: data.userId,
        fullName: data.fullName,
      });
    },
    []
  );

  const logout = useCallback(() => {
    clearAuth();
    setAuthToken(null);
    setTokenState(null);
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