"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { HiOutlineLockClosed, HiOutlineEnvelope, HiOutlineHome } from "react-icons/hi2";

interface LogoData {
  file_url: string;
  alt_text: string | null;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logo, setLogo] = useState<LogoData | null>(null);
  const router = useRouter();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role === "admin") router.push("/dashboard/admin");
      else if (user.role === "pegawai") router.push("/dashboard/pegawai");
      else router.push("/dashboard/dosen");
    }
  }, [user, router]);

  // Fetch logo config
  useEffect(() => {
    async function fetchLogo() {
      try {
        const res = await fetch("/api/config?section=logo");
        if (res.ok) {
          const config = await res.json();
          if (config?.logo) setLogo(config.logo);
        }
      } catch (e) {
        console.error("Failed to load logo", e);
      }
    }
    fetchLogo();
  }, []);

  // Hide navbar and footer
  useEffect(() => {
    const nav = document.querySelector("nav");
    const footer = document.querySelector("footer");
    
    if (nav) nav.style.display = "none";
    if (footer) footer.style.display = "none";
    
    return () => {
      if (nav) nav.style.display = "";
      if (footer) footer.style.display = "";
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const success = await login(email, password);
      if (success) {
        // Redirection is handled by the useEffect above
      } else {
        setError("Email atau password salah.");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  if (user) return null; // Avoid flicker while redirecting

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#1a2232]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up flex flex-col items-center">
        {/* Campus Logo */}
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-gray-100 p-2.5 shadow-md">
          <img
            src={logo?.file_url || "/images/logo-polimdo.png"}
            alt={logo?.alt_text || "Logo Campus"}
            className="h-full w-full object-contain"
          />
        </div>
        
        <h2 className="text-center text-2xl font-extrabold text-white">
          Portal Sistem
        </h2>
        <p className="mt-1.5 text-center text-sm text-slate-300">
          Masuk ke dashboard manajemen
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <HiOutlineEnvelope className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-primary-500 focus:border-primary-500 text-sm transition-all bg-gray-50 focus:bg-white"
                  placeholder="Masukkan email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <HiOutlineLockClosed className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-primary-500 focus:border-primary-500 text-sm transition-all bg-gray-50 focus:bg-white"
                  placeholder="Masukkan password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? "Memproses..." : "Masuk"}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-xs text-center text-gray-500 border-t border-gray-100 pt-6 space-y-4">
            <p>Gunakan email dan password yang terdaftar.</p>
            <div className="pt-1">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors"
              >
                <HiOutlineHome className="w-4 h-4" />
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
