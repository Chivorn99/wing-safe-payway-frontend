"use client";

import { createContext, useContext, useState } from "react";

interface AuthUser {
  userId: number;
  fullName: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const handleSetUser = (u: AuthUser | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem("user", JSON.stringify(u));
      localStorage.setItem("token", u.token);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  };

  const logout = () => handleSetUser(null);

  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
