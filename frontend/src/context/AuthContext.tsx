import React, { createContext, useContext, useEffect, useState } from "react";
import { api, clearAuth, getStoredToken, getStoredUser, saveAuth } from "../api/client";

type User = { id: string; email: string; name?: string };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      const stored = await getStoredUser();
      if (token && stored) setUser(stored);
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    await saveAuth(data.token, data.user);
    setUser(data.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const { data } = await api.post("/auth/register", { email, password, name });
    await saveAuth(data.token, data.user);
    setUser(data.user);
  };

  const logout = async () => {
    await clearAuth();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
