"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiOutlineHome, HiOutlineArrowRight } from "react-icons/hi2";
import DevTeamModal from "@/components/universal/DevTeamModal";

interface LogoData {
  file_url: string;
  alt_text: string | null;
}

interface ProdiInfoData {
  nama: string;
  nama_kampus: string;
}

export default function NotFound() {
  const [logo, setLogo] = useState<LogoData | null>(null);
  const [prodiInfo, setProdiInfo] = useState<ProdiInfoData | null>(null);
  const [footer, setFooter] = useState<any>(null);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const [logoRes, prodiRes, footerRes] = await Promise.all([
          fetch("/api/logo").then((r) => r.json()),
          fetch("/api/prodi-info").then((r) => r.json()),
          fetch("/api/footer").then((r) => r.json()),
        ]);
        if (logoRes) setLogo(logoRes);
        if (prodiRes) setProdiInfo(prodiRes);
        if (footerRes) setFooter(footerRes);
      } catch (e) {
        console.error("Failed to load not-found page config", e);
      }
    }
    fetchConfig();
  }, []);

  useEffect(() => {
    const footer = document.querySelector("footer");
    
    if (footer) footer.style.display = "none";
    
    return () => {
      if (footer) footer.style.display = "";
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-primary-950 via-primary-950/95 to-primary-900/90 relative overflow-hidden px-4">
      {/* Decorative background blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-accent-500/5 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-md w-full text-center space-y-8 animate-fade-in-up">
        {/* Logo and Brand Info */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 border border-white/10 p-2 shadow-xl backdrop-blur-md group hover:border-accent-400/30 transition-colors duration-300">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-accent-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <img
              src={logo?.file_url || "/images/logo-polimdo.png"}
              alt={logo?.alt_text || "Logo Campus"}
              className="h-full w-full object-contain"
            />
          </div>
          {prodiInfo && (
            <div className="text-center">
              <p className="text-xs font-bold text-accent-400 uppercase tracking-widest leading-none">
                {prodiInfo.nama}
              </p>
              <p className="text-[10px] text-gray-400 tracking-wider mt-1">
                {prodiInfo.nama_kampus}
              </p>
            </div>
          )}
        </div>

        {/* 404 Typography */}
        <div className="space-y-2">
          <h1 className="text-8xl font-black tracking-tighter bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent select-none">
            404
          </h1>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
            Maaf, halaman yang Anda tuju tidak dapat ditemukan atau alamat URL yang Anda masukkan salah.
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-primary-950 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-accent-500/10 hover:shadow-accent-500/20 hover:-translate-y-0.5 cursor-pointer"
          >
            <HiOutlineHome className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
            <HiOutlineArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Footer copyright indicator */}
      <div className="absolute bottom-6 left-0 right-0 text-center flex flex-col items-center gap-1.5 z-20">
        <p className="text-[10px] text-gray-500 tracking-wider">
          {footer?.copyright ? (
            `© ${new Date().getFullYear()} - ${footer.copyright.replace(/^(©\s*(\d{4})?\s*|(\d{4})\s*)/i, "").trim()}`
          ) : (
            `© ${new Date().getFullYear()} - D4 Teknik Listrik Polimdo. All rights reserved.`
          )}
        </p>
        <button
          onClick={() => setIsDevModalOpen(true)}
          className="text-center text-gray-500 hover:text-accent-400 text-[10px] transition-colors duration-200 cursor-pointer font-semibold uppercase tracking-wider"
        >
          Tim Pengembang
        </button>
      </div>

      <DevTeamModal isOpen={isDevModalOpen} onClose={() => setIsDevModalOpen(false)} />
    </div>
  );
}
