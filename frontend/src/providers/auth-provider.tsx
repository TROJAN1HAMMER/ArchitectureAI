"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "@/services/api";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const updateSession = (token: string | null, userData: User | null) => {
    setAccessToken(token);
    setUser(userData);
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { accessToken: token, user: userData } = res.data?.data || {};
      updateSession(token, userData);
    } catch (err) {
      updateSession(null, null);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // Ignore failures
    } finally {
      updateSession(null, null);
    }
  };

  const refresh = useCallback(async (): Promise<string | null> => {
    try {
      const res = await api.post("/auth/refresh");
      const token = res.data?.data?.accessToken;
      if (token) {
        const meRes = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = meRes.data?.data;
        updateSession(token, userData);
        return token;
      }
    } catch (err) {
      updateSession(null, null);
    }
    return null;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      await refresh();
      setLoading(false);
    };
    initAuth();
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, loading, login, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
