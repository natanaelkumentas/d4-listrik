"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { HiOutlineUser, HiOutlineUserGroup, HiOutlinePhoto, HiOutlineArrowRightOnRectangle, HiOutlineBookOpen, HiOutlineDocumentText, HiOutlineChartBarSquare, HiOutlineCalendar, HiOutlineCheckCircle, HiOutlineClock } from "react-icons/hi2";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return <div className="min-h-screen pt-24 pb-12 flex justify-center items-center text-gray-500 font-medium animate-pulse">Loading Dashboard...</div>;

  const isAdmin = user.role === "admin";
  const isPegawai = user.role === "pegawai";

  const adminLinks = [
    { href: "/dashboard/admin", label: "Dashboard", icon: HiOutlineUser },
    { href: "/dashboard/admin/staf", label: "Staf", icon: HiOutlineUserGroup },
    { href: "/dashboard/admin/kurikulum", label: "Kurikulum", icon: HiOutlineBookOpen },
    { href: "/dashboard/admin/karya", label: "Karya", icon: HiOutlineDocumentText },
    { href: "/dashboard/admin/fasilitas", label: "Fasilitas", icon: HiOutlinePhoto },
    { href: "/dashboard/admin/kegiatan", label: "Kegiatan", icon: HiOutlineCalendar },
    { href: "/dashboard/admin/statistik", label: "Statistik", icon: HiOutlineChartBarSquare },
    { href: "/dashboard/admin/config", label: "Konfigurasi Website", icon: HiOutlineDocumentText },
  ];

  const pegawaiLinks = [
    { href: "/dashboard/pegawai", label: "Dashboard", icon: HiOutlineUser },
    { href: "/dashboard/pegawai/profile", label: "Profil Saya", icon: HiOutlineUser },
    { href: "/dashboard/pegawai/kurikulum", label: "Kurikulum", icon: HiOutlineBookOpen },
    { href: "/dashboard/pegawai/fasilitas", label: "Fasilitas", icon: HiOutlinePhoto },
    { href: "/dashboard/pegawai/kegiatan", label: "Kegiatan", icon: HiOutlineCalendar },
    { href: "/dashboard/pegawai/statistik", label: "Statistik", icon: HiOutlineChartBarSquare },
    { href: "/dashboard/pegawai/config", label: "Konfigurasi Website", icon: HiOutlineDocumentText },
  ];

  const dosenLinks = [
    { href: "/dashboard/dosen", label: "Profil Saya", icon: HiOutlineUser },
    { href: "/dashboard/dosen/karya", label: "Karya & Kontribusi", icon: HiOutlineUserGroup },
    { href: "/dashboard/dosen/kegiatan", label: "Kegiatan", icon: HiOutlineCalendar },
  ];

  const links = isAdmin ? adminLinks : isPegawai ? pegawaiLinks : dosenLinks;

  const isActive = (href: string) => pathname === href || (pathname.startsWith(href) && href !== `/dashboard/${user.role}`);

  return (
    <div className="fixed inset-x-0 top-16 bottom-16 bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar (Desktop Only) */}
      <aside className="hidden md:flex w-64 shrink-0 px-4 md:px-6 py-6 flex-col h-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-1 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="mb-6 px-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                {isAdmin ? "Administrator" : isPegawai ? "Pegawai" : "Dosen"}
              </p>
              <h2 className="text-lg font-bold text-primary-950 truncate">
                {user.name}
              </h2>
            </div>

            <nav className="space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive(link.href) ? "text-primary-600" : "text-gray-400"}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 shrink-0">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <HiOutlineArrowRightOnRectangle className="w-5 h-5 text-red-500" />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 py-6 flex flex-col h-full overflow-hidden">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 animate-fade-in flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
