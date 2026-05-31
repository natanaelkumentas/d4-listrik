"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineAcademicCap,
  HiOutlineTrophy,
  HiOutlineCalendar,
  HiOutlinePlus,
  HiCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineTrash,
} from "react-icons/hi2";
import { invalidateCache } from "@/lib/fetchCache";
import Modal from "@/components/universal/Modal";
import ComboBox from "@/components/universal/ComboBox";
import ConfirmDialog from "@/components/universal/ConfirmDialog";
import { useNotification } from "@/context/NotificationContext";
import TablePagination from "@/components/universal/TablePagination";

interface ActiveSemester {
  id: string;
  tahun_akademik: string;
  jenis: "ganjil" | "genap";
  is_aktif: boolean;
}

interface StatRow {
  id?: string;
  semester_level: number;
  total_mahasiswa_aktif: number;
}

interface LulusanRow {
  id: number;
  tahun: number;
  jumlah_lulusan: number;
}

export default function StatistikManagement() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  // Summary
  const [totalActive, setTotalActive] = useState<number>(0);
  const [totalGraduates, setTotalGraduates] = useState<number>(0);
  const [activeSem, setActiveSem] = useState<ActiveSemester | null>(null);

  // Data
  const [semesters, setSemesters] = useState<ActiveSemester[]>([]);
  const [studentStats, setStudentStats] = useState<StatRow[]>([]);
  const [lulusanList, setLulusanList] = useState<LulusanRow[]>([]);
  const [activeTab, setActiveTab] = useState<"mahasiswa" | "lulusan" | "semester">("mahasiswa");

  // Lulusan modal
  const [isLulusanModalOpen, setIsLulusanModalOpen] = useState(false);
  const [newLulusanTahun, setNewLulusanTahun] = useState<number>(new Date().getFullYear());
  const [newLulusanJumlah, setNewLulusanJumlah] = useState<number>(0);
  const [deleteLulusanTarget, setDeleteLulusanTarget] = useState<LulusanRow | null>(null);

  // Semester table
  const [semSearchQuery, setSemSearchQuery] = useState("");
  const [semPage, setSemPage] = useState(1);
  const [semPageSize, setSemPageSize] = useState(10);

  // Semester Modal
  const [isSemModalOpen, setIsSemModalOpen] = useState(false);
  const [newTahunMulai, setNewTahunMulai] = useState<number>(new Date().getFullYear());
  const [newJenis, setNewJenis] = useState<"ganjil" | "genap">("ganjil");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<ActiveSemester | null>(null);

  // Filter Semester for Statistik Mahasiswa
  const [filterJenis, setFilterJenis] = useState<"ganjil" | "genap">("ganjil");
  const [filterTahunMulai, setFilterTahunMulai] = useState<number>(new Date().getFullYear());
  const [selectedSemNotFound, setSelectedSemNotFound] = useState(false);
  const [selectedSemData, setSelectedSemData] = useState<ActiveSemester | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Loading
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStatsForSemester = async (jenis: "ganjil" | "genap", tahunMulai: number) => {
    if (!tahunMulai) return;
    setIsLoadingStats(true);
    try {
      const y1 = String(tahunMulai).slice(-2);
      const y2 = String(tahunMulai + 1).slice(-2);
      const prefix = jenis === "ganjil" ? "ga" : "ge";
      const semId = `${prefix}${y1}${y2}`;

      const res = await fetch(`/api/statistik?semester_id=${semId}`);
      const data = await res.json();
      if (data) {
        setSelectedSemNotFound(data.semester_not_found);
        setSelectedSemData(data.selected_semester);
        if (data.per_level) {
          const sorted = [...data.per_level].sort(
            (a: any, b: any) => a.semester_level - b.semester_level
          );
          setStudentStats(sorted);
        } else {
          setStudentStats([]);
        }
      }
    } catch (e) {
      console.error("Failed to load statistics for semester", e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchData = async () => {
    try {
      const [statsRes, semRes] = await Promise.all([
        fetch("/api/statistik").then((r) => r.json()),
        fetch("/api/semester").then((r) => r.json()),
      ]);

      if (statsRes) {
        setTotalActive(statsRes.total_mahasiswa_aktif || 0);
        setTotalGraduates(statsRes.total_lulusan || 0);
        if (statsRes.active_semester) {
          setActiveSem(statsRes.active_semester);
          setSelectedSemData(statsRes.active_semester);
          setFilterJenis(statsRes.active_semester.jenis);
          const startYear = parseInt(statsRes.active_semester.tahun_akademik.split("/")[0]) || new Date().getFullYear();
          setFilterTahunMulai(startYear);
        }
        if (statsRes.lulusan_per_tahun) {
          setLulusanList(statsRes.lulusan_per_tahun);
        }
      }
      if (semRes) setSemesters(semRes);
    } catch (e) {
      console.error("Failed to load statistics/semesters", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchStatsForSemester(filterJenis, filterTahunMulai);
    }
  }, [filterJenis, filterTahunMulai, isLoading]);

  // --- Handlers ---

  const handleLevelCountChange = (levelNum: number, count: number) => {
    setStudentStats((prev) =>
      prev.map((row) =>
        row.semester_level === levelNum ? { ...row, total_mahasiswa_aktif: count } : row
      )
    );
  };

  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/statistik", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          per_level: studentStats,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui statistik");
      invalidateCache("/api/statistik");
      await Promise.all([
        fetchData(),
        fetchStatsForSemester(filterJenis, filterTahunMulai)
      ]);
      showSuccess("Statistik mahasiswa berhasil disimpan!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLulusan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/statistik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tahun: newLulusanTahun, jumlah_lulusan: newLulusanJumlah }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan data lulusan");
      setIsLulusanModalOpen(false);
      setNewLulusanJumlah(0);
      invalidateCache("/api/statistik");
      await fetchData();
      showSuccess("Data lulusan berhasil ditambahkan!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLulusan = async () => {
    if (!deleteLulusanTarget) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/statistik?lulusan_id=${deleteLulusanTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus data lulusan");
      setDeleteLulusanTarget(null);
      invalidateCache("/api/statistik");
      await fetchData();
      showSuccess("Data lulusan berhasil dihapus!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const y1 = String(newTahunMulai).slice(-2);
      const y2 = String(newTahunMulai + 1).slice(-2);
      const prefix = newJenis === "ganjil" ? "ga" : "ge";
      const id = `${prefix}${y1}${y2}`;
      const tahun_akademik = `${newTahunMulai}/${newTahunMulai + 1}`;

      const res = await fetch("/api/semester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, tahun_akademik, jenis: newJenis }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat semester");
      setIsSemModalOpen(false);
      invalidateCache("/api/statistik");
      await fetchData();
      showSuccess("Semester baru berhasil didaftarkan!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetActiveSemester = async (semId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/semester", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: semId, is_aktif: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengaktifkan semester");
      invalidateCache("/api/statistik");
      await fetchData();
      showSuccess("Semester aktif berhasil diubah!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSemester = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/semester?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus semester");
      setDeleteTarget(null);
      invalidateCache("/api/statistik");
      await fetchData();
      showSuccess("Semester berhasil dihapus!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Semester filtering & pagination
  const filteredSemesters = semesters.filter((s) => {
    const q = semSearchQuery.toLowerCase();
    return (
      s.tahun_akademik.toLowerCase().includes(q) ||
      s.jenis.toLowerCase().includes(q) ||
      (s.is_aktif ? "aktif" : "non-aktif").includes(q)
    );
  });
  const totalSemEntries = filteredSemesters.length;
  const totalSemPages = Math.ceil(totalSemEntries / semPageSize);
  const paginatedSemesters = filteredSemesters.slice(
    (semPage - 1) * semPageSize,
    semPage * semPageSize
  );

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 font-medium animate-pulse">
        Loading Statistik...
      </div>
    );
  }

  const tabs = [
    { key: "mahasiswa" as const, label: "Mahasiswa per Semester" },
    { key: "lulusan" as const, label: "Total Lulusan" },
    { key: "semester" as const, label: "Semester Aktif" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Manajemen Statistik</h1>
        <p className="text-gray-500 text-sm">
          Kelola data mahasiswa per semester, total lulusan, dan semester aktif program studi.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-primary-700 text-xs font-bold uppercase tracking-wider mb-1">
              Mahasiswa Aktif
            </p>
            <h3 className="text-3xl font-black text-primary-950">
              {totalActive.toLocaleString("id-ID")}
            </h3>
            <p className="text-[11px] text-primary-600 mt-1">
              Semester:{" "}
              {activeSem
                ? `${activeSem.jenis === "ganjil" ? "Ganjil" : "Genap"} ${activeSem.tahun_akademik}`
                : "Belum diatur"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center text-primary-700">
            <HiOutlineAcademicCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-violet-50 rounded-2xl p-6 border border-violet-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-violet-700 text-xs font-bold uppercase tracking-wider mb-1">
              Total Lulusan (Alumni)
            </p>
            <h3 className="text-3xl font-black text-violet-950">
              {totalGraduates.toLocaleString("id-ID")}
            </h3>
            <p className="text-[11px] text-violet-600 mt-1">Akumulasi counter lulusan</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-violet-200 flex items-center justify-center text-violet-700">
            <HiOutlineTrophy className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
              Semester Aktif
            </p>
            <h3 className="text-xl font-bold text-emerald-950 mt-1">
              {activeSem ? `${activeSem.jenis === "ganjil" ? "Ganjil" : "Genap"}` : "—"}
            </h3>
            <p className="text-xs text-emerald-600 font-mono">
              TA: {activeSem?.tahun_akademik || "—"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700">
            <HiOutlineCalendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-4 px-6 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === tab.key
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Mahasiswa per Semester */}
      {activeTab === "mahasiswa" && (
        <form onSubmit={handleSaveStats} className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-4">
              <div>
                <h3 className="font-bold text-primary-950">
                  Statistik Mahasiswa Aktif per Semester
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Pilih semester untuk melihat atau memperbarui data statistik.
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                <div className="w-32">
                  <ComboBox
                    options={[
                      { id: "ganjil", nama: "Ganjil" },
                      { id: "genap", nama: "Genap" },
                    ]}
                    value={filterJenis}
                    onChange={(val) => setFilterJenis(val as any)}
                    placeholder="Pilih jenis..."
                  />
                </div>
                
                {/* Year picker */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    min="2000"
                    max="2099"
                    value={filterTahunMulai === 0 ? "" : filterTahunMulai}
                    onChange={(e) => {
                      const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 0;
                      setFilterTahunMulai(val);
                    }}
                    className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 text-primary-900 font-bold text-center bg-white"
                    placeholder={String(new Date().getFullYear())}
                  />
                  <span className="text-gray-400 text-xs font-bold">/</span>
                  <input
                    type="number"
                    required
                    min="2000"
                    max="2099"
                    value={filterTahunMulai === 0 ? "" : filterTahunMulai + 1}
                    onChange={(e) => {
                      const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 0;
                      setFilterTahunMulai(val === 0 ? 0 : val - 1);
                    }}
                    className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 text-primary-900 font-bold text-center bg-white"
                    placeholder={String(new Date().getFullYear() + 1)}
                  />
                </div>
              </div>
            </div>

            {isLoadingStats ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : selectedSemNotFound ? (
              <div className="text-center py-12 px-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm font-semibold text-gray-500">
                  Tidak ada data untuk semester <span className="text-primary-700 font-bold capitalize">{filterJenis}-{filterTahunMulai}/{filterTahunMulai + 1}</span>.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Silakan registrasikan semester terlebih dahulu di tab <strong className="text-gray-600">Semester Aktif</strong>.
                </p>
              </div>
            ) : studentStats.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {studentStats.map((row) => (
                  <div
                    key={row.semester_level}
                    className="space-y-1.5 p-4 rounded-xl border border-gray-50 bg-gray-50/50"
                  >
                    <label className="block text-xs font-bold text-gray-500 uppercase">
                      Semester {row.semester_level}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={row.total_mahasiswa_aktif === 0 ? "" : row.total_mahasiswa_aktif}
                      onChange={(e) =>
                        handleLevelCountChange(row.semester_level, e.target.value === "" ? 0 : parseInt(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-primary-900"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                Pilih atau masukkan semester akademik untuk menampilkan data statistik mahasiswa.
              </p>
            )}
          </div>

          {studentStats.length > 0 && !selectedSemNotFound && !isLoadingStats && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Statistik Mahasiswa"
                )}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Tab: Total Lulusan */}
      {activeTab === "lulusan" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-primary-950">Data Lulusan per Tahun</h3>
              <p className="text-gray-500 text-xs mt-1">
                Kelola jumlah lulusan program studi per tahun kelulusan.
              </p>
            </div>
            <button
              onClick={() => setIsLulusanModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <HiOutlinePlus className="w-4 h-4" /> Tambah Tahun
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-50/50">
                  <th className="text-left px-6 py-3.5 font-bold text-primary-900">Tahun</th>
                  <th className="text-right px-6 py-3.5 font-bold text-primary-900">Jumlah Lulusan</th>
                  <th className="text-center px-6 py-3.5 font-bold text-primary-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {lulusanList.map((row) => (
                  <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-700">{row.tahun}</td>
                    <td className="px-6 py-4 text-right font-bold text-primary-900">
                      {row.jumlah_lulusan.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setDeleteLulusanTarget(row)}
                        disabled={isSubmitting}
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-red-600 hover:text-white rounded-lg text-xs font-semibold text-gray-600 transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <HiOutlineTrash className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </td>
                  </tr>
                ))}
                {lulusanList.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                      Belum ada data lulusan.
                    </td>
                  </tr>
                )}
                {lulusanList.length > 0 && (
                  <tr className="border-t-2 border-primary-100 bg-primary-50/30">
                    <td className="px-6 py-4 font-bold text-primary-900">Total</td>
                    <td className="px-6 py-4 text-right font-black text-primary-900 text-lg">
                      {totalGraduates.toLocaleString("id-ID")}
                    </td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Semester Aktif */}
      {activeTab === "semester" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-primary-950">Daftar Semester Akademik</h3>
              <p className="text-gray-500 text-xs mt-1">
                Registrasi dan kelola status aktif semester program studi.
              </p>
            </div>
            <button
              onClick={() => setIsSemModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <HiOutlinePlus className="w-4 h-4" /> Registrasi Semester Baru
            </button>
          </div>

          <div className="flex justify-start">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <HiOutlineMagnifyingGlass className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Cari semester (tahun, jenis, status)..."
                value={semSearchQuery}
                onChange={(e) => {
                  setSemSearchQuery(e.target.value);
                  setSemPage(1);
                }}
                className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-950"
              />
              {semSearchQuery && (
                <button
                  onClick={() => {
                    setSemSearchQuery("");
                    setSemPage(1);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-50/50">
                  <th className="text-left px-6 py-3.5 font-bold text-primary-900">
                    Semester
                  </th>
                  <th className="text-center px-6 py-3.5 font-bold text-primary-900">Status</th>
                  <th className="text-center px-6 py-3.5 font-bold text-primary-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSemesters.map((sem) => (
                  <tr
                    key={sem.id}
                    className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-gray-700">
                      {sem.jenis}-{sem.tahun_akademik}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          sem.is_aktif
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {sem.is_aktif ? "Aktif" : "Non-Aktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        {!sem.is_aktif && (
                          <>
                            <button
                              onClick={() => handleSetActiveSemester(sem.id)}
                              disabled={isSubmitting}
                              className="px-3.5 py-1.5 bg-gray-100 hover:bg-primary-600 hover:text-white rounded-lg text-xs font-semibold text-gray-600 transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <HiCheck className="w-3.5 h-3.5" /> Aktifkan
                            </button>
                            <button
                              onClick={() => setDeleteTarget(sem)}
                              disabled={isSubmitting}
                              className="px-3.5 py-1.5 bg-gray-100 hover:bg-red-600 hover:text-white rounded-lg text-xs font-semibold text-gray-600 transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <HiOutlineTrash className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSemesters.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                      {semSearchQuery
                        ? "Tidak ada semester yang cocok dengan pencarian."
                        : "Belum ada data semester."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <TablePagination
              currentPage={semPage}
              totalPages={totalSemPages}
              totalEntries={totalSemEntries}
              pageSize={semPageSize}
              onPageChange={setSemPage}
              onPageSizeChange={(size) => {
                setSemPageSize(size);
                setSemPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* Registrasi Semester Modal */}
      <Modal
        isOpen={isSemModalOpen}
        onClose={() => setIsSemModalOpen(false)}
        title="Registrasi Semester Baru"
      >
        <form onSubmit={handleAddSemester} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tahun Akademik
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                required
                min="2000"
                max="2099"
                value={newTahunMulai === 0 ? "" : newTahunMulai}
                onChange={(e) => {
                  const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 0;
                  setNewTahunMulai(val);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-primary-900 font-bold text-center"
                placeholder={String(new Date().getFullYear())}
              />
              <span className="text-gray-400 font-bold">/</span>
              <input
                type="number"
                required
                min="2000"
                max="2099"
                value={newTahunMulai === 0 ? "" : newTahunMulai + 1}
                onChange={(e) => {
                  const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 0;
                  setNewTahunMulai(val === 0 ? 0 : val - 1);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-primary-900 font-bold text-center"
                placeholder={String(new Date().getFullYear() + 1)}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              Mengubah tahun mulai atau tahun akhir akan secara otomatis menyesuaikan tahun pasangannya.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Jenis Semester
            </label>
            <ComboBox
              options={[
                { id: "ganjil", nama: "Ganjil" },
                { id: "genap", nama: "Genap" },
              ]}
              value={newJenis}
              onChange={(val) => setNewJenis(val as any)}
              placeholder="Pilih Jenis Semester..."
            />
          </div>



          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={() => setIsSemModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                "Daftarkan Semester"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDeleteSemester}
        onCancel={() => setDeleteTarget(null)}
        title="Hapus Semester"
        message={deleteTarget ? `Apakah Anda yakin ingin menghapus semester ${deleteTarget.jenis}-${deleteTarget.tahun_akademik}? Data statistik mahasiswa untuk semester ini juga akan dihapus.` : ""}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
      />

      {/* Tambah Lulusan Modal */}
      <Modal
        isOpen={isLulusanModalOpen}
        onClose={() => setIsLulusanModalOpen(false)}
        title="Tambah Data Lulusan per Tahun"
      >
        <form onSubmit={handleAddLulusan} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tahun Kelulusan
            </label>
            <input
              type="number"
              required
              min="2000"
              max="2099"
              value={newLulusanTahun}
              onChange={(e) => setNewLulusanTahun(parseInt(e.target.value) || new Date().getFullYear())}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-primary-900 font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Jumlah Lulusan
            </label>
            <input
              type="number"
              required
              min="0"
              value={newLulusanJumlah === 0 ? "" : newLulusanJumlah}
              onChange={(e) => setNewLulusanJumlah(e.target.value === "" ? 0 : parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-primary-900 font-bold"
              placeholder="0"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={() => setIsLulusanModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Data Lulusan"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Lulusan Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteLulusanTarget}
        onConfirm={handleDeleteLulusan}
        onCancel={() => setDeleteLulusanTarget(null)}
        title="Hapus Data Lulusan"
        message={deleteLulusanTarget ? `Apakah Anda yakin ingin menghapus data lulusan tahun ${deleteLulusanTarget.tahun}?` : ""}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
      />
    </div>
  );
}
