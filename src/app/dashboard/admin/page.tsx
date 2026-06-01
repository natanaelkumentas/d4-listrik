"use client";

import { HiOutlineUserGroup, HiOutlinePhoto, HiOutlineAcademicCap, HiOutlineBookOpen, HiOutlineTrophy, HiOutlineChartBarSquare, HiOutlineClock, HiOutlineFunnel, HiOutlineTrash, HiOutlineExclamationTriangle } from "react-icons/hi2";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cachedFetch } from "@/lib/fetchCache";
import { useNotification } from "@/context/NotificationContext";
import TablePagination from "@/components/universal/TablePagination";
import Modal from "@/components/universal/Modal";

interface Stats {
  total_mahasiswa_aktif: number;
  total_lulusan: number;
  total_dosen: number;
  total_galeri: number;
  total_mata_kuliah: number;
  active_semester?: { id: string; tahun_akademik: string; jenis: string } | null;
}

interface AuditLog {
  id: string;
  user_email: string;
  user_name: string;
  user_role: string;
  aksi: string;
  kategori: string;
  deskripsi: string;
  ip_address: string | null;
  created_at: string;
  data_sebelum?: any;
  data_sesudah?: any;
}

export default function AdminDashboardPage() {
  const { showError } = useNotification();
  const [stats, setStats] = useState<Stats | null>(null);
  const [mataKuliahCount, setMataKuliahCount] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Logs state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [count, setCount] = useState(0);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const formatLogTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Pagination states for logs
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Main active filter states for logs
  const [actionFilter, setActionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Modal visibility states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Temporary filter states for modal inputs
  const [tempAction, setTempAction] = useState("");
  const [tempCategory, setTempCategory] = useState("");
  const [tempIp, setTempIp] = useState("");
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");

  // Export setting states
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("csv");
  const [exportFilename, setExportFilename] = useState("");

  // Clear logs states
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [clearStartDate, setClearStartDate] = useState("");
  const [clearEndDate, setClearEndDate] = useState("");
  const [clearKategori, setClearKategori] = useState("");
  const [clearAksi, setClearAksi] = useState("");
  const [clearPengguna, setClearPengguna] = useState("");
  const [clearIp, setClearIp] = useState("");
  const [clearPreviewCount, setClearPreviewCount] = useState(0);
  const [isClearLoading, setIsClearLoading] = useState(false);

  // Debounced input for User search (retained directly on page)
  const [debouncedUser, setDebouncedUser] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUser(userFilter);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [userFilter]);

  const fetchStats = async () => {
    try {
      const statData = await cachedFetch<any>("/api/statistik");
      if (statData) {
        setStats(statData);
        setMataKuliahCount(statData.total_mata_kuliah || 0);
      }
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  };

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      let url = `/api/logs?page=${currentPage}&limit=${pageSize}`;
      if (actionFilter) url += `&aksi=${actionFilter}`;
      if (categoryFilter) url += `&kategori=${categoryFilter}`;
      if (debouncedUser) url += `&pengguna=${debouncedUser}`;
      if (ipFilter) url += `&ip_address=${ipFilter}`;
      if (startDateFilter) url += `&startDate=${startDateFilter}`;
      if (endDateFilter) url += `&endDate=${endDateFilter}`;

      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        setLogs(result.data || []);
        setCount(result.count || 0);
      } else {
        showError("Gagal memuat log audit.");
      }
    } catch (e) {
      console.error(e);
      showError("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Open Filter Modal & sync active filters to temp inputs
  const openFilterModal = () => {
    setTempAction(actionFilter);
    setTempCategory(categoryFilter);
    setTempIp(ipFilter);
    setTempStartDate(startDateFilter);
    setTempEndDate(endDateFilter);
    setIsFilterModalOpen(true);
  };

  const closeFilterModal = () => {
    setIsFilterModalOpen(false);
  };

  // Open Export Modal with default naming
  const openExportModal = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    setExportFilename(`audit-logs-${dateStr}`);
    setIsExportModalOpen(true);
  };

  // Apply filters from modal
  const applyFilters = () => {
    setActionFilter(tempAction);
    setCategoryFilter(tempCategory);
    setIpFilter(tempIp);
    setStartDateFilter(tempStartDate);
    setEndDateFilter(tempEndDate);
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  // Estimate download file size
  const getEstimatedSize = (format: "json" | "csv", entriesCount: number) => {
    const bytesPerRow = format === "json" ? 420 : 250;
    const totalBytes = entriesCount * bytesPerRow + (format === "csv" ? 100 : 2);
    if (totalBytes < 1024) {
      return `${totalBytes} B`;
    } else if (totalBytes < 1024 * 1024) {
      return `${(totalBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  // Export logic
  const exportLogs = async (format: "json" | "csv") => {
    try {
      let url = `/api/logs?export=true`;
      if (actionFilter) url += `&aksi=${actionFilter}`;
      if (categoryFilter) url += `&kategori=${categoryFilter}`;
      if (debouncedUser) url += `&pengguna=${debouncedUser}`;
      if (ipFilter) url += `&ip_address=${ipFilter}`;
      if (startDateFilter) url += `&startDate=${startDateFilter}`;
      if (endDateFilter) url += `&endDate=${endDateFilter}`;

      const res = await fetch(url);
      if (!res.ok) {
        showError("Gagal mengambil data untuk diekspor.");
        return;
      }

      const result = await res.json();
      const exportData = result.data || [];

      if (exportData.length === 0) {
        showError("Tidak ada data log yang cocok untuk diekspor.");
        return;
      }

      const nameToUse = exportFilename.trim() || "audit-logs";
      const finalFilename = `${nameToUse}.${format}`;

      if (format === "json") {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const downloadUrl = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement("a");
        downloadAnchor.href = downloadUrl;
        downloadAnchor.download = finalFilename;
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);
        URL.revokeObjectURL(downloadUrl);
      } else {
        // CSV format
        const headers = ["Waktu", "Email Pengguna", "Nama Pengguna", "Role", "Aksi", "Kategori", "Deskripsi", "IP Address"];
        const csvRows = [headers.join(",")];

        for (const row of exportData) {
          const values = [
            `"${new Date(row.created_at).toLocaleString("id-ID").replace(/"/g, '""')}"`,
            `"${(row.user_email || "").replace(/"/g, '""')}"`,
            `"${(row.user_name || "").replace(/"/g, '""')}"`,
            `"${(row.user_role || "").replace(/"/g, '""')}"`,
            `"${(row.aksi || "").replace(/"/g, '""')}"`,
            `"${(row.kategori || "").replace(/"/g, '""')}"`,
            `"${(row.deskripsi || "").replace(/"/g, '""')}"`,
            `"${(row.ip_address || "").replace(/"/g, '""')}"`,
          ];
          csvRows.push(values.join(","));
        }

        const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const downloadUrl = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement("a");
        downloadAnchor.href = downloadUrl;
        downloadAnchor.download = finalFilename;
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);
        URL.revokeObjectURL(downloadUrl);
      }
    } catch (e) {
      console.error(e);
      showError("Terjadi kesalahan saat memproses ekspor.");
    }
  };

  // Build clear logs filter URL params
  const buildClearParams = () => {
    const params = new URLSearchParams();
    if (clearKategori) params.set("kategori", clearKategori);
    if (clearAksi) params.set("aksi", clearAksi);
    if (clearPengguna) params.set("pengguna", clearPengguna);
    if (clearIp) params.set("ip_address", clearIp);
    if (clearStartDate) params.set("startDate", clearStartDate);
    if (clearEndDate) params.set("endDate", clearEndDate);
    return params.toString();
  };

  // Get a human-readable description of which filters are active
  const getClearFilterDescription = () => {
    const parts: string[] = [];
    if (clearStartDate || clearEndDate) {
      const from = clearStartDate || "awal";
      const to = clearEndDate || "sekarang";
      parts.push(`Rentang Waktu: ${from} s/d ${to}`);
    }
    if (clearKategori) parts.push(`Kategori: ${clearKategori}`);
    if (clearAksi) parts.push(`Aksi: ${clearAksi.toUpperCase()}`);
    if (clearPengguna) parts.push(`Pengguna: ${clearPengguna}`);
    if (clearIp) parts.push(`IP Address: ${clearIp}`);
    return parts.length > 0 ? parts : ["Semua log (tanpa filter)"];
  };

  // Estimate database storage freed
  const getEstimatedDbSize = (rowCount: number) => {
    const avgBytesPerRow = 550; // avg row size in Supabase for this table
    const totalBytes = rowCount * avgBytesPerRow;
    if (totalBytes < 1024) return `${totalBytes} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Open clear modal with reset filters
  const openClearModal = () => {
    setClearStartDate("");
    setClearEndDate("");
    setClearKategori("");
    setClearAksi("");
    setClearPengguna("");
    setClearIp("");
    setIsClearModalOpen(true);
  };

  // Preview the count of logs that would be deleted, then show confirmation
  const previewClearLogs = async () => {
    setIsClearLoading(true);
    try {
      const params = buildClearParams();
      const res = await fetch(`/api/logs?preview=true${params ? `&${params}` : ""}`, { method: "DELETE" });
      if (res.ok) {
        const result = await res.json();
        setClearPreviewCount(result.count || 0);
        setIsClearModalOpen(false);
        setIsClearConfirmOpen(true);
      } else {
        showError("Gagal memeriksa jumlah log.");
      }
    } catch {
      showError("Terjadi kesalahan jaringan.");
    } finally {
      setIsClearLoading(false);
    }
  };

  // Execute the clear
  const executeClearLogs = async () => {
    setIsClearLoading(true);
    try {
      const params = buildClearParams();
      const res = await fetch(`/api/logs?${params}`, { method: "DELETE" });
      if (res.ok) {
        setIsClearConfirmOpen(false);
        fetchLogs(); // refresh table
      } else {
        showError("Gagal menghapus log audit.");
      }
    } catch {
      showError("Terjadi kesalahan jaringan.");
    } finally {
      setIsClearLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, pageSize, actionFilter, categoryFilter, debouncedUser, ipFilter, startDateFilter, endDateFilter]);

  const getActionBadge = (action: string) => {
    const actUpper = action.toUpperCase();
    switch (actUpper) {
      case "CREATE":
        return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-200">CREATE</span>;
      case "UPDATE":
        return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">UPDATE</span>;
      case "DELETE":
        return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200">DELETE</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200">{actUpper}</span>;
    }
  };

  const cards = [
    {
      label: "Total Dosen",
      value: stats?.total_dosen ?? "—",
      link: "/dashboard/admin/staf",
      linkLabel: "Kelola Staf",
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
      label: "Mahasiswa Aktif",
      value: stats?.total_mahasiswa_aktif ?? "—",
      link: "/dashboard/admin/statistik",
      linkLabel: "Kelola Statistik",
      icon: HiOutlineAcademicCap,
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      textColor: "text-emerald-600",
      valueColor: "text-emerald-950",
      iconBg: "bg-emerald-200",
      iconColor: "text-emerald-700",
      linkColor: "text-emerald-700",
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
      link: "/dashboard/admin/statistik",
      linkLabel: "Kelola Statistik",
      icon: HiOutlineTrophy,
      bg: "bg-violet-50",
      border: "border-violet-100",
      textColor: "text-violet-600",
      valueColor: "text-violet-950",
      iconBg: "bg-violet-200",
      iconColor: "text-violet-700",
      linkColor: "text-violet-700",
    },
  ];

  const totalPages = Math.ceil(count / pageSize);
  const isAnyFilterActive = !!(actionFilter || categoryFilter || ipFilter || startDateFilter || endDateFilter);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Overview</h1>
          <p className="text-gray-500 text-sm">Selamat datang di panel administrasi.</p>
        </div>
        <Link
          href="/dashboard/admin/statistik"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          <HiOutlineChartBarSquare className="w-5 h-5" /> Kelola Statistik
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Audit Logs Section */}
      <div className="mt-12 pt-8 border-t border-gray-100">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Log Audit System</h2>
            <p className="text-gray-500 text-sm mt-1">Pantau jejak aktivitas penulisan, modifikasi, dan penghapusan data.</p>
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <HiOutlineClock className="w-4 h-4" />
            Realtime Audit Logging Enabled
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* Search by Name (retained directly on the main page) */}
          <div className="w-full md:w-80">
            <input
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="Cari pengguna (email / nama)..."
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-950 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openFilterModal}
              className={`px-4 py-2 border rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm ${
                isAnyFilterActive
                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <HiOutlineFunnel className="w-4 h-4" />
              Filter
              {isAnyFilterActive && (
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse"></span>
              )}
            </button>

            <button
              onClick={openExportModal}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-2"
            >
              Ekspor
            </button>

            <button
              onClick={openClearModal}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <HiOutlineTrash className="w-4 h-4" />
              Bersihkan
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Pengguna</th>
                  <th className="px-6 py-4">Aksi</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Deskripsi Aktivitas</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4 text-center">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium">
                {isLoadingLogs ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 animate-pulse">
                      Memuat data log audit...
                    </td>
                  </tr>
                ) : (
                  <>
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/30 transition-colors text-gray-700">
                        <td className="px-6 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {formatLogTime(log.created_at)}
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-900">
                          <div>{log.user_name || log.user_email}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{log.user_email}</div>
                          <div className="text-[9px] text-gray-400 uppercase font-bold tracking-wide mt-0.5">
                            {log.user_role}
                          </div>
                        </td>
                        <td className="px-6 py-3">{getActionBadge(log.aksi)}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">
                            {log.kategori}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-600 max-w-sm leading-relaxed">{log.deskripsi}</td>
                        <td className="px-6 py-3 text-xs text-gray-400 font-mono">{log.ip_address || "—"}</td>
                        <td className="px-6 py-3 text-center">
                          {(log.data_sebelum || log.data_sesudah) ? (
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="px-2.5 py-1 text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200/50 rounded-lg transition-colors cursor-pointer"
                            >
                              Detail
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs font-normal">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                          Tidak ada aktivitas yang tercatat untuk filter ini.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {!isLoadingLogs && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalEntries={count}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          )}
        </div>
      </div>

      {isFilterModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[calc(100vh-2rem)] p-4 sm:p-6 shadow-xl border border-gray-100 flex flex-col gap-3 sm:gap-4 animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 flex-shrink-0">
              <HiOutlineFunnel className="w-5 h-5 text-primary-600" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Pengaturan Filter</h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-3 sm:gap-4 py-1 min-h-0">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">IP Address</label>
                <input
                  type="text"
                  value={tempIp}
                  onChange={(e) => setTempIp(e.target.value)}
                  placeholder="Cari IP Address..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-950 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Aksi</label>
                <select
                  value={tempAction}
                  onChange={(e) => setTempAction(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-950 font-medium"
                >
                  <option value="">Semua Aksi</option>
                  <option value="create">CREATE</option>
                  <option value="update">UPDATE</option>
                  <option value="delete">DELETE</option>
                  <option value="approve">APPROVE</option>
                  <option value="reject">REJECT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Kategori</label>
                <select
                  value={tempCategory}
                  onChange={(e) => setTempCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-950 font-medium"
                >
                  <option value="">Semua Kategori</option>
                  <option value="dosen">Dosen</option>
                  <option value="pegawai">Pegawai</option>
                  <option value="profile_verification">Verifikasi Profil</option>
                  <option value="sambutan">Sambutan</option>
                  <option value="kurikulum">Kurikulum</option>
                  <option value="karya">Karya</option>
                  <option value="fasilitas">Fasilitas</option>
                  <option value="kegiatan">Kegiatan</option>
                  <option value="config">Konfigurasi Website</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Mulai Tanggal</label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-950 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-950 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTempAction("");
                  setTempCategory("");
                  setTempIp("");
                  setTempStartDate("");
                  setTempEndDate("");
                }}
                className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors uppercase"
              >
                Reset
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeFilterModal}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 border border-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-primary-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Export Pop-up Modal */}
      {isExportModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full max-h-[calc(100vh-2rem)] p-4 sm:p-6 shadow-xl border border-gray-100 flex flex-col gap-3 sm:gap-4 animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 flex-shrink-0">
              <HiOutlineChartBarSquare className="w-5 h-5 text-primary-600" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Pengaturan Ekspor</h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-3 min-h-0">
              <p className="text-xs sm:text-sm text-gray-500 mb-1 leading-relaxed">
                Ekspor data log audit berdasarkan filter yang sedang aktif saat ini.
              </p>

              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex flex-col gap-2 text-[11px] sm:text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Jumlah Baris:</span>
                  <span className="font-extrabold text-gray-900">{count} baris</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Estimasi Ukuran:</span>
                  <span className="font-extrabold text-primary-700">{getEstimatedSize(exportFormat, count)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nama File Kustom</label>
                <input
                  type="text"
                  value={exportFilename}
                  onChange={(e) => setExportFilename(e.target.value)}
                  placeholder="Masukkan nama file..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-950 font-medium"
                />
              </div>

              <label className="block text-xs font-bold text-gray-600 mb-1">Pilih Format File</label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat("json")}
                  className={`py-2 border rounded-2xl font-bold text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm ${
                    exportFormat === "json"
                      ? "border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-100"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700 bg-white"
                  }`}
                >
                  <span className="text-[9px] uppercase text-gray-400 font-medium">format file</span>
                  JSON File
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat("csv")}
                  className={`py-2 border rounded-2xl font-bold text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm ${
                    exportFormat === "csv"
                      ? "border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-100"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700 bg-white"
                  }`}
                >
                  <span className="text-[9px] uppercase text-gray-400 font-medium">format file</span>
                  CSV File
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 border border-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExportModalOpen(false);
                  setIsConfirmModalOpen(true);
                }}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-primary-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm"
              >
                Unduh Berkas
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full max-h-[calc(100vh-2rem)] p-4 sm:p-6 shadow-xl border border-gray-100 flex flex-col gap-3 sm:gap-4 animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 flex-shrink-0">
              <HiOutlineClock className="w-5 h-5 text-amber-500" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Konfirmasi Unduhan</h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-3 min-h-0">
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-semibold">
                Lanjutkan untuk mengunduh berkas ini dengan detail sebagai berikut:
              </p>
              
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex flex-col gap-2 text-[11px] sm:text-xs">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-500 font-medium flex-shrink-0">Nama Berkas:</span>
                  <span className="font-extrabold text-gray-950 font-mono text-right break-all max-w-[170px] sm:max-w-[200px]">
                    {exportFilename.trim() || "audit-logs"}.{exportFormat}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Format:</span>
                  <span className="font-extrabold text-primary-700 uppercase">{exportFormat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Estimasi Ukuran:</span>
                  <span className="font-extrabold text-emerald-700">{getEstimatedSize(exportFormat, count)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Jumlah Baris:</span>
                  <span className="font-extrabold text-gray-950">{count} baris</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 border border-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  exportLogs(exportFormat);
                  setIsConfirmModalOpen(false);
                }}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-primary-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Clear Logs Settings Modal */}
      {isClearModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[calc(100vh-2rem)] p-4 sm:p-6 shadow-xl border border-gray-100 flex flex-col gap-3 sm:gap-4 animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 flex-shrink-0">
              <HiOutlineTrash className="w-5 h-5 text-red-600" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Bersihkan Log Audit</h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-3 sm:gap-4 py-1 min-h-0">
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Tentukan kriteria log audit yang ingin Anda hapus secara permanen untuk mengoptimalkan penyimpanan database.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Pengguna (Nama / Email)</label>
                <input
                  type="text"
                  value={clearPengguna}
                  onChange={(e) => setClearPengguna(e.target.value)}
                  placeholder="Filter pengguna tertentu..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-950 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">IP Address</label>
                <input
                  type="text"
                  value={clearIp}
                  onChange={(e) => setClearIp(e.target.value)}
                  placeholder="Filter IP address tertentu..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-950 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Kategori</label>
                  <select
                    value={clearKategori}
                    onChange={(e) => setClearKategori(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-950 font-medium"
                  >
                    <option value="">Semua Kategori</option>
                    <option value="dosen">Dosen</option>
                    <option value="pegawai">Pegawai</option>
                    <option value="profile_verification">Verifikasi Profil</option>
                    <option value="sambutan">Sambutan</option>
                    <option value="kurikulum">Kurikulum</option>
                    <option value="karya">Karya</option>
                    <option value="fasilitas">Fasilitas</option>
                    <option value="kegiatan">Kegiatan</option>
                    <option value="config">Konfigurasi Website</option>
                    <option value="auth">Autentikasi (Login/Logout)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Aksi</label>
                  <select
                    value={clearAksi}
                    onChange={(e) => setClearAksi(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-950 font-medium"
                  >
                    <option value="">Semua Aksi</option>
                    <option value="create">CREATE</option>
                    <option value="update">UPDATE</option>
                    <option value="delete">DELETE</option>
                    <option value="approve">APPROVE</option>
                    <option value="reject">REJECT</option>
                    <option value="login">LOGIN</option>
                    <option value="logout">LOGOUT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Mulai Tanggal</label>
                  <input
                    type="date"
                    value={clearStartDate}
                    onChange={(e) => setClearStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-950 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={clearEndDate}
                    onChange={(e) => setClearEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-950 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setClearStartDate("");
                  setClearEndDate("");
                  setClearKategori("");
                  setClearAksi("");
                  setClearPengguna("");
                  setClearIp("");
                }}
                className="text-xs font-bold text-red-650 hover:text-red-800 transition-colors uppercase"
              >
                Reset
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(false)}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 border border-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isClearLoading}
                  onClick={previewClearLogs}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isClearLoading ? "Memeriksa..." : "Bersihkan"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Clear Logs Execution Confirmation Dialog */}
      {isClearConfirmOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full max-h-[calc(100vh-2rem)] p-4 sm:p-6 shadow-xl border border-gray-100 flex flex-col gap-3 sm:gap-4 animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 flex-shrink-0">
              <HiOutlineExclamationTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Konfirmasi Penghapusan</h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-3 min-h-0">
              <p className="text-xs sm:text-sm text-gray-650 leading-relaxed font-semibold">
                Apakah Anda yakin ingin menghapus log audit berikut secara permanen? Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex flex-col gap-2.5 text-[11px] sm:text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-red-200/50">
                  <span className="text-red-700 font-bold">Log yang Akan Dihapus:</span>
                  <span className="font-extrabold text-red-950 text-sm">{clearPreviewCount} baris</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-red-200/50">
                  <span className="text-red-700 font-bold">Estimasi Ruang Bebas:</span>
                  <span className="font-extrabold text-green-700 text-sm">~{getEstimatedDbSize(clearPreviewCount)}</span>
                </div>
                <div>
                  <span className="text-red-700 font-bold block mb-1.5">Kriteria Filter yang Diterapkan:</span>
                  <ul className="list-disc list-inside space-y-1 text-red-955/80 font-medium">
                    {getClearFilterDescription().map((desc, idx) => (
                      <li key={idx} className="break-all">{desc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsClearConfirmOpen(false);
                  setIsClearModalOpen(true);
                }}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 border border-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={isClearLoading || clearPreviewCount === 0}
                onClick={executeClearLogs}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isClearLoading ? "Menghapus..." : "Ya, Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Detail Perubahan Data"
      >
        {selectedLog && (
          <div className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-3 text-xs border-b border-gray-100 pb-3">
              <div>
                <span className="text-gray-400 block font-medium">Waktu</span>
                <span className="font-semibold text-gray-800">{formatLogTime(selectedLog.created_at)}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Pengguna</span>
                <span className="font-semibold text-gray-800">{selectedLog.user_name || selectedLog.user_email}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Kategori / Aksi</span>
                <span className="font-semibold text-gray-850 uppercase flex items-center gap-1.5 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold border border-gray-200 text-[10px]">
                    {selectedLog.kategori}
                  </span>
                  <span>{getActionBadge(selectedLog.aksi)}</span>
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">IP Address</span>
                <span className="font-semibold font-mono text-gray-800">{selectedLog.ip_address || "—"}</span>
              </div>
            </div>
            
            <div>
              <span className="text-xs text-gray-400 block mb-1 font-medium">Deskripsi Aktivitas</span>
              <p className="text-sm text-gray-800 font-semibold bg-slate-50 p-3 rounded-xl border border-slate-200/40 leading-relaxed">
                {selectedLog.deskripsi}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Sebelum</span>
                {selectedLog.data_sebelum ? (
                  <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-[10px] sm:text-xs overflow-x-auto font-mono max-h-56 border border-slate-800/80 custom-scrollbar">
                    {JSON.stringify(selectedLog.data_sebelum, null, 2)}
                  </pre>
                ) : (
                  <div className="text-xs text-gray-400 italic bg-gray-50 p-3.5 rounded-xl border border-dashed border-gray-200">
                    Tidak ada data (Baru)
                  </div>
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Sesudah</span>
                {selectedLog.data_sesudah ? (
                  <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-[10px] sm:text-xs overflow-x-auto font-mono max-h-56 border border-slate-800/80 custom-scrollbar">
                    {JSON.stringify(selectedLog.data_sesudah, null, 2)}
                  </pre>
                ) : (
                  <div className="text-xs text-gray-400 italic bg-gray-50 p-3.5 rounded-xl border border-dashed border-gray-200">
                    Tidak ada data (Dihapus)
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
