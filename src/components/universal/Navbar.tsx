"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { HiOutlineUser } from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import { cachedFetch } from "@/lib/fetchCache";

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/tentang", label: "Tentang" },
  { href: "/kurikulum", label: "Kurikulum" },
  { href: "/fasilitas", label: "Fasilitas" },
  { href: "/staf", label: "Staf" },
  { href: "/galeri", label: "Galeri" },
];

interface LogoData {
  file_url: string;
  alt_text: string | null;
}

interface ProdiInfoData {
  nama: string;
  nama_alternatif: string | null;
  nama_kampus: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const [logo, setLogo] = useState<LogoData | null>(null);
  const [prodiInfo, setProdiInfo] = useState<ProdiInfoData | null>(null);

  useEffect(() => {
    const fetchNavConfig = async () => {
      try {
        const config = await cachedFetch<any>("/api/config?section=all");
        if (config?.logo) setLogo(config.logo);
        if (config?.prodi_info) setProdiInfo(config.prodi_info);
      } catch (e) {
        console.error("Failed to load nav config", e);
      }
    };
    fetchNavConfig();
  }, []);

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/dashboard")) {
      const role = user?.role;
      return pathname === href || (pathname.startsWith(href) && href !== `/dashboard/${role}`);
    }
    return pathname.startsWith(href);
  };

  const getPortalHref = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/dashboard/admin";
    if (user.role === "pegawai") return "/dashboard/pegawai";
    return "/dashboard/dosen";
  };

  const portalHref = getPortalHref();

  const isDashboardPage = pathname.startsWith("/dashboard");

  const adminLinks = [
    { href: "/dashboard/admin", label: "Dashboard" },
    { href: "/dashboard/admin/staf", label: "Staf" },
    { href: "/dashboard/admin/kurikulum", label: "Kurikulum" },
    { href: "/dashboard/admin/karya", label: "Karya" },
    { href: "/dashboard/admin/fasilitas", label: "Fasilitas" },
    { href: "/dashboard/admin/kegiatan", label: "Kegiatan" },
    { href: "/dashboard/admin/statistik", label: "Statistik" },
    { href: "/dashboard/admin/config", label: "Konfigurasi Website" },
  ];

  const pegawaiLinks = [
    { href: "/dashboard/pegawai", label: "Dashboard" },
    { href: "/dashboard/pegawai/kurikulum", label: "Kurikulum" },
    { href: "/dashboard/pegawai/fasilitas", label: "Fasilitas" },
    { href: "/dashboard/pegawai/kegiatan", label: "Kegiatan" },
    { href: "/dashboard/pegawai/statistik", label: "Statistik" },
    { href: "/dashboard/pegawai/config", label: "Konfigurasi Website" },
  ];

  const dosenLinks = [
    { href: "/dashboard/dosen", label: "Profil Saya" },
    { href: "/dashboard/dosen/karya", label: "Karya & Kontribusi" },
    { href: "/dashboard/dosen/kegiatan", label: "Kegiatan" },
  ];

  const dashboardLinks = user
    ? user.role === "admin"
      ? adminLinks
      : user.role === "pegawai"
      ? pegawaiLinks
      : dosenLinks
    : [];

  const activeMobileLinks = (isDashboardPage && user) ? dashboardLinks : navLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg p-0.5 transition-shadow overflow-hidden">
              <img
                src={logo?.file_url || "/images/logo-polimdo.png"}
                alt={logo?.alt_text || "Logo Campus"}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-primary-950 leading-tight">
                {prodiInfo?.nama || ""}
              </span>
              <span className="text-[10px] text-gray-500 leading-tight hidden sm:block">
                {prodiInfo?.nama_kampus || ""}
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isLinkActive(link.href)
                    ? "bg-primary-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center shrink-0">
            <Link
              href={portalHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors"
            >
              <HiOutlineUser className="w-4 h-4" />
              {user ? "Dashboard" : "Portal"}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href={portalHref}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <HiOutlineUser className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <span
                className={`h-0.5 w-5 bg-gray-700 rounded transition-all duration-300 ${
                  mobileOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 bg-gray-700 rounded transition-all duration-300 ${
                  mobileOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 bg-gray-700 rounded transition-all duration-300 ${
                  mobileOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? "max-h-[500px] border-t border-gray-100" : "max-h-0"
        }`}
      >
        <div className="px-4 py-3 space-y-1 bg-white/95 backdrop-blur-md">
          {activeMobileLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isLinkActive(link.href)
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-primary-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          {isDashboardPage && user ? (
            <div className="pt-2 mt-2 border-t border-gray-100 flex flex-col gap-2">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Kembali ke Website
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
              >
                Keluar
              </button>
            </div>
          ) : (
            <div className="pt-2 mt-2 border-t border-gray-100">
              <Link
                href={portalHref}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <HiOutlineUser className="w-4 h-4" />
                {user ? "Ke Dashboard" : "Masuk Portal"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
