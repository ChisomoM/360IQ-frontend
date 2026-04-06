/**
 * useControlHubAuth — real ControlHub authentication hook.
 *
 * ControlHub admins use a completely separate auth flow:
 *   POST /api/v1/controlhub/auth/login  →  { token, email, role }
 *
 * Token stored under CH_STORAGE_KEY so it never collides with regular tenant auth.
 */

import { useState, useEffect, useCallback } from "react";

const CH_STORAGE_KEY = "ch_tokens" as const;
const CH_USER_KEY = "ch_user" as const;

export interface ControlHubUser {
  email: string;
  role: string;
}

export interface ControlHubSession {
  user: ControlHubUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Read the stored token (used by the ControlHub API client)
export function getControlHubToken(): string | null {
  try {
    const raw = localStorage.getItem(CH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

export function useControlHubAuth(): ControlHubSession {
  const [user, setUser] = useState<ControlHubUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(CH_STORAGE_KEY);
      const storedUser = localStorage.getItem(CH_USER_KEY);
      if (storedToken && storedUser) {
        const parsedToken = JSON.parse(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setToken(parsedToken?.token || null);
        setUser(parsedUser);
      }
    } catch {
      localStorage.removeItem(CH_STORAGE_KEY);
      localStorage.removeItem(CH_USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const ROUTING_URL = import.meta.env.VITE_BACKEND_URL || "http://102.211.186.58/api/v1/";
    const res = await fetch(`${ROUTING_URL}controlhub/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || "Invalid credentials");
    }

    const json = await res.json();
    // Backend wraps response in { success, data: { token, email, role } }
    const payload = json?.data ?? json;
    const { token: newToken, email: userEmail, role } = payload;

    if (!newToken) throw new Error("No token received from server");

    const newUser: ControlHubUser = { email: userEmail, role };
    localStorage.setItem(CH_STORAGE_KEY, JSON.stringify({ token: newToken }));
    localStorage.setItem(CH_USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(CH_STORAGE_KEY);
    localStorage.removeItem(CH_USER_KEY);
    setToken(null);
    setUser(null);
    window.location.href = "/controlhub/login";
  }, []);

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
  };
}

