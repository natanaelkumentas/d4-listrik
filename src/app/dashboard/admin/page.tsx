"use client";

import { HiOutlineUserGroup, HiOutlinePhoto, HiOutlineAcademicCap, HiOutlineBookOpen, HiOutlineTrophy, HiOutlinePencilSquare } from "react-icons/hi2";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cachedFetch, invalidateCache } from "@/lib/fetchCache";
import Modal from "@/components/universal/Modal";

interface Stats {
  total_mahasiswa_aktif: number;
  total_lulusan: number;
  total_dosen: number;
  total_galeri: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [mataKuliahCount, setMataKuliahCount] = useState<number>(0);

  // Edit Statistik Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeInput, setActiveInput] = useState<number>(0);
  const [graduatesInput, setGraduatesInput] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statData, kurikulumData] = await Promise.all([
          cachedFetch<Stats>("/api/statistik"),
          cachedFetch<any>("/api/kurikulum"),
        ]);

        if (statData) {
          setStats(statData);
          setActiveInput(statData.total_mahasiswa_aktif);
          setGraduatesInput(statData.total_lulusan);
        }

        if (kurikulumData) {
          setMataKuliahCount(kurikulumData.mata_kuliah?.length || 0);
        }
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    };

    fetchStats();
  }, []);

  const handleOpenEdit = () => {
    if (stats) {
      setActiveInput(stats.total_mahasiswa_aktif);
      setGraduatesInput(stats.total_lulusan);
    }
    setErrorMsg("");
    setIsEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/statistik", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_mahasiswa_aktif: activeInput,
          total_lulusan: graduatesInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui statistik");
      }

      invalidateCache("/api/statistik");
      setStats((prev) => prev ? {
        ...prev,
        total_mahasiswa_aktif: activeInput,
        total_lulusan: graduatesInput,
      } : null);

      setIsEditModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cards = [
    {
      label: "Total Dosen",
      value: stats?.total_dosen ?? "—",
      link: "/dashboard/admin/dosen",
      linkLabel: "Kelola Dosen",
      icon: HiOutlineUserGroup,
      bg: "bg-primary-50",
      border: "border-primary-100",
      textColor: "text-primary-600",
      valueColor: "text-primary-950",
      iconBg: "bg-primary-200",
      iconColor: "text-primary-700",
      linkColor: "text-primary-700",
    },
    {
      label: "Total Galeri",
      value: stats?.total_galeri ?? "—",
      link: "/dashboard/admin/galeri",
      linkLabel: "Kelola Galeri",
      icon: HiOutlinePhoto,
      bg: "bg-sky-50",
      border: "border-sky-100",
      textColor: "text-sky-600",
      valueColor: "text-sky-950",
      iconBg: "bg-sky-200",
      iconColor: "text-sky-700",
      linkColor: "text-sky-700",
    },
    {
      label: "Mahasiswa Aktif",
      value: stats?.total_mahasiswa_aktif ?? "—",
      icon: HiOutlineAcademicCap,
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      textColor: "text-emerald-600",
      valueColor: "text-emerald-950",
      iconBg: "bg-emerald-200",
      iconColor: "text-emerald-700",
    },
    {
      label: "Total Mata Kuliah",
      value: mataKuliahCount || "—",
      icon: HiOutlineBookOpen,
      bg: "bg-amber-50",
      border: "border-amber-100",
      textColor: "text-amber-600",
      valueColor: "text-amber-950",
      iconBg: "bg-amber-200",
      iconColor: "text-amber-700",
    },
    {
      label: "Total Lulusan",
      value: stats?.total_lulusan ?? "—",
      icon: HiOutlineTrophy,
      bg: "bg-violet-50",
      border: "border-violet-100",
      textColor: "text-violet-600",
      valueColor: "text-violet-950",
      iconBg: "bg-violet-200",
      iconColor: "text-violet-700",
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Overview</h1>
          <p className="text-gray-500 text-sm">Selamat datang di panel administrasi.</p>
        </div>
        <button 
          onClick={handleOpenEdit}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          <HiOutlinePencilSquare className="w-5 h-5" /> Edit Statistik
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`${card.bg} rounded-2xl p-6 border ${card.border} flex items-center justify-between shadow-sm hover:shadow-md transition-shadow`}
            >
              <div>
                <p className={`${card.textColor} text-sm font-bold uppercase tracking-wider mb-1`}>
                  {card.label}
                </p>
                <h3 className={`text-3xl font-black ${card.valueColor}`}>
                  {typeof card.value === "number" ? card.value.toLocaleString("id-ID") : card.value}
                </h3>
                {card.link && (
                  <Link
                    href={card.link}
                    className={`${card.linkColor} text-sm font-medium hover:underline mt-2 inline-block`}
                  >
                    {card.linkLabel} &rarr;
                  </Link>
                )}
              </div>
              <div className={`w-16 h-16 rounded-full ${card.iconBg} flex items-center justify-center ${card.iconColor}`}>
                <Icon className="w-8 h-8" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Statistik Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Statistik Mahasiswa">
        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mahasiswa Aktif</label>
            <input 
              type="number" 
              value={activeInput}
              onChange={(e) => setActiveInput(parseInt(e.target.value) || 0)}
              required
              min="0"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
              placeholder="Masukkan jumlah mahasiswa aktif..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Total Lulusan</label>
            <input 
              type="number" 
              value={graduatesInput}
              onChange={(e) => setGraduatesInput(parseInt(e.target.value) || 0)}
              required
              min="0"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
              placeholder="Masukkan total lulusan..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button 
              type="button" 
              onClick={() => setIsEditModalOpen(false)} 
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center gap-1.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
