"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface User {
  role: "admin" | "dosen" | "pegawai";
  id: string; // Supabase auth user ID
  nip?: string; // NIP for dosen/pegawai
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const checkingRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    // Shared user profile loader with in-flight deduplication
    const fetchUser = async () => {
      if (checkingRef.current) return checkingRef.current;

      const promise = (async () => {
        try {
          const res = await fetch("/api/auth/me");
          if (res.ok) {
            const data = await res.json();
            setUser({
              role: data.user.role,
              id: data.user.id,
              nip: data.user.nip || undefined,
              name: data.user.full_name || data.user.email,
            });
          } else {
            setUser(null);
          }
        } catch (e) {
          console.error("Failed to check session", e);
          setUser(null);
        } finally {
          setIsLoading(false);
          checkingRef.current = null;
        }
      })();

      checkingRef.current = promise;
      return promise;
    };

    // Check current session on mount
    fetchUser();

    // Listen for auth state changes via Supabase client
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Re-fetch user profile from API (deduplicated)
        await fetchUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) return false;

      const data = await res.json();

      setUser({
        role: data.user.role,
        id: data.user.id,
        nip: data.user.nip || undefined,
        name: data.user.full_name || data.user.email,
      });

      return true;
    } catch (e) {
      console.error("Login failed", e);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error", e);
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
