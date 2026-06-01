"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  HiOutlinePlus as PlusIcon, 
  HiOutlinePencilSquare as EditIcon, 
  HiOutlineTrash as TrashIcon, 
  HiOutlineArrowUpTray as UploadIcon, 
  HiOutlineEye as EyeIcon,
  HiOutlineCheck as CheckIcon,
  HiOutlineXMark as XMarkIcon,
  HiOutlineClock as ClockIcon,
  HiOutlineCheckCircle as CheckCircleIcon,
  HiOutlineXCircle as XCircleIcon,
  HiOutlineMagnifyingGlass as SearchIcon,
  HiOutlineMapPin as PinIcon,
  HiPhoto 
} from "react-icons/hi2";
import Modal from "@/components/universal/Modal";
import ConfirmDialog from "@/components/universal/ConfirmDialog";
import TablePagination from "@/components/universal/TablePagination";
import { cachedFetch, invalidateCache } from "@/lib/fetchCache";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";

interface KegiatanItem {
  id: string;
  nama: string;
  tanggal: string; // YYYY-MM-DD
  kategori: string;
  deskripsi: string | null;
  foto_urls: string[];
  lokasi: string | null;
  created_at: string;
}

interface PendingKegiatanItem {
  id: string;
  submitted_by: string;
  nama: string;
  tanggal: string; // YYYY-MM-DD
  kategori: string;
  deskripsi: string | null;
  foto_urls: string[];
  lokasi: string | null;
  status: "pending" | "approved" | "rejected";
  catatan_admin: string | null;
  created_at: string;
}

const statusConfig = {
  pending: { label: "Menunggu", cls: "bg-amber-150 text-amber-800", icon: ClockIcon },
  approved: { label: "Disetujui", cls: "bg-green-100 text-green-700", icon: CheckCircleIcon },
  rejected: { label: "Ditolak", cls: "bg-red-100 text-red-700", icon: XCircleIcon },
};

export default function KegiatanManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const isAdmin = user?.role === "admin";

  const [activeSection, setActiveSection] = useState<"pending" | "all">("pending");
  const [approvedItems, setApprovedItems] = useState<KegiatanItem[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingKegiatanItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Filters state
  const [filterKategori, setFilterKategori] = useState("");
  const [filterBulan, setFilterBulan] = useState("");
  const [filterTahun, setFilterTahun] = useState("");

  // Search & Pagination states
  const [pendingSearchQuery, setPendingSearchQuery] = useState("");
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(10);

  const [reviewedSearchQuery, setReviewedSearchQuery] = useState("");
  const [reviewedPage, setReviewedPage] = useState(1);
  const [reviewedPageSize, setReviewedPageSize] = useState(10);

  const [allSearchQuery, setAllSearchQuery] = useState("");
  const [allPage, setAllPage] = useState(1);
  const [allPageSize, setAllPageSize] = useState(10);

  // Compute unique categories
  const uniqueCategories = Array.from(
    new Set([
      ...approvedItems.map(k => k.kategori),
      ...pendingItems.map(k => k.kategori)
    ].filter(Boolean))
  ).sort();

  // Compute unique years
  const uniqueYears = Array.from(
    new Set([
      ...approvedItems.map(k => k.tanggal ? k.tanggal.split("-")[0] : null),
      ...pendingItems.map(k => k.tanggal ? k.tanggal.split("-")[0] : null)
    ])
  ).filter((yr): yr is string => typeof yr === "string" && yr !== "").sort((a, b) => Number(b) - Number(a));

  const months = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" }
  ];

  // Modal editor states
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nama: "",
    tanggal: new Date().toISOString().split("T")[0],
    kategori: "",
    deskripsi: "",
    lokasi: "",
    foto_urls: [] as string[],
  });

  // Review modal state (Admin only)
  const [reviewItem, setReviewItem] = useState<PendingKegiatanItem | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Detail Modal state
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Confirm dialog states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"approved" | "pending">("approved");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const approvedData = await cachedFetch<KegiatanItem[]>("/api/kegiatan");
      setApprovedItems(approvedData || []);

      if (user) {
        const pendingData = await cachedFetch<PendingKegiatanItem[]>("/api/kegiatan-pending");
        setPendingItems(pendingData || []);
      }
    } catch (e) {
      console.error("Failed to load activities data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      nama: "",
      tanggal: new Date().toISOString().split("T")[0],
      kategori: "",
      deskripsi: "",
      lokasi: "",
      foto_urls: [],
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (item: KegiatanItem) => {
    setEditingId(item.id);
    setForm({
      nama: item.nama,
      tanggal: item.tanggal,
      kategori: item.kategori,
      deskripsi: item.deskripsi || "",
      lokasi: item.lokasi || "",
      foto_urls: item.foto_urls || [],
    });
    setIsOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch("/api/upload/kegiatan", {
          method: "POST",
          body: fd,
        });

        if (res.ok) {
          const data = await res.json();
          setForm((prev) => ({
            ...prev,
            foto_urls: [...prev.foto_urls, data.url],
          }));
          showSuccess(`Foto "${file.name}" berhasil diupload!`);
        } else {
          const data = await res.json();
          showError(data.error || "Gagal mengupload foto");
        }
      }
    } catch (err) {
      console.error("Upload failed", err);
      showError("Gagal mengupload foto");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setForm((prev) => ({
      ...prev,
      foto_urls: prev.foto_urls.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let url = "";
      let method = "";

      if (isAdmin) {
        url = editingId ? `/api/kegiatan/${editingId}` : "/api/kegiatan";
        method = editingId ? "PUT" : "POST";
      } else {
        url = "/api/kegiatan-pending";
        method = "POST";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan data");
      }

      invalidateCache("/api/kegiatan");
      invalidateCache("/api/kegiatan-pending");
      setIsOpen(false);
      await fetchData();
      showSuccess(isAdmin ? "Kegiatan berhasil disimpan!" : "Kegiatan berhasil diajukan untuk disetujui!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (id: string, type: "approved" | "pending") => {
    setDeletingId(id);
    setDeleteType(type);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      const url = deleteType === "approved" 
        ? `/api/kegiatan/${deletingId}` 
        : `/api/kegiatan-pending/${deletingId}`;

      const res = await fetch(url, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus data");
      }

      invalidateCache("/api/kegiatan");
      invalidateCache("/api/kegiatan-pending");
      await fetchData();
      showSuccess(deleteType === "approved" ? "Kegiatan berhasil dihapus!" : "Pengajuan berhasil dibatalkan!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan");
    } finally {
      setConfirmOpen(false);
      setDeletingId(null);
    }
  };

  const handleReviewAction = async (action: "approve" | "reject") => {
    if (!reviewItem) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/kegiatan-pending/${reviewItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          catatan_admin: action === "reject" ? reviewNote : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal meninjau pengajuan");
      }

      invalidateCache("/api/kegiatan");
      invalidateCache("/api/kegiatan-pending");
      setIsReviewOpen(false);
      setReviewItem(null);
      setReviewNote("");
      await fetchData();
      showSuccess(action === "approve" ? "Pengajuan disetujui and dipublikasikan!" : "Pengajuan ditolak!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400 font-medium animate-pulse">Loading Kegiatan...</div>;
  }

  // Filter calculations (matches Karya list filtering)
  const pendingOnly = pendingItems.filter((k) => k.status === "pending");
  const filteredPending = pendingOnly.filter((k) => {
    if (filterKategori && k.kategori !== filterKategori) return false;
    if (filterTahun && k.tanggal && k.tanggal.split("-")[0] !== filterTahun) return false;
    if (filterBulan && k.tanggal && k.tanggal.split("-")[1] !== filterBulan) return false;
    const q = pendingSearchQuery.toLowerCase();
    return (
      k.nama.toLowerCase().includes(q) ||
      k.kategori.toLowerCase().includes(q) ||
      k.tanggal.includes(q)
    );
  });
  const totalPendingEntries = filteredPending.length;
  const totalPendingPages = Math.ceil(totalPendingEntries / pendingPageSize);
  const paginatedPending = filteredPending.slice(
    (pendingPage - 1) * pendingPageSize,
    pendingPage * pendingPageSize
  );

  const reviewedOnly = pendingItems.filter((k) => k.status !== "pending");
  const filteredReviewed = reviewedOnly.filter((k) => {
    if (filterKategori && k.kategori !== filterKategori) return false;
    if (filterTahun && k.tanggal && k.tanggal.split("-")[0] !== filterTahun) return false;
    if (filterBulan && k.tanggal && k.tanggal.split("-")[1] !== filterBulan) return false;
    const q = reviewedSearchQuery.toLowerCase();
    return (
      k.nama.toLowerCase().includes(q) ||
      k.kategori.toLowerCase().includes(q) ||
      k.tanggal.includes(q) ||
      k.status.toLowerCase().includes(q)
    );
  });
  const totalReviewedEntries = filteredReviewed.length;
  const totalReviewedPages = Math.ceil(totalReviewedEntries / reviewedPageSize);
  const paginatedReviewed = filteredReviewed.slice(
    (reviewedPage - 1) * reviewedPageSize,
    reviewedPage * reviewedPageSize
  );

  const filteredAllApproved = approvedItems.filter((k) => {
    if (filterKategori && k.kategori !== filterKategori) return false;
    if (filterTahun && k.tanggal && k.tanggal.split("-")[0] !== filterTahun) return false;
    if (filterBulan && k.tanggal && k.tanggal.split("-")[1] !== filterBulan) return false;
    const q = allSearchQuery.toLowerCase();
    return (
      k.nama.toLowerCase().includes(q) ||
      k.kategori.toLowerCase().includes(q) ||
      k.tanggal.includes(q)
    );
  });
  const totalApprovedEntries = filteredAllApproved.length;
  const totalApprovedPages = Math.ceil(totalApprovedEntries / allPageSize);
  const paginatedApproved = filteredAllApproved.slice(
    (allPage - 1) * allPageSize,
    allPage * allPageSize
  );

  const sectionTabs = [
    { key: "pending" as const, label: isAdmin ? `Pengajuan (${pendingOnly.length})` : "Pengajuan & Status" },
    { key: "all" as const, label: `Kegiatan Terpublikasi (${approvedItems.length})` },
  ];

  const inputCls = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-primary-950";

  const formatLocalDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatLongLocalDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Manajemen Kegiatan</h1>
          <p className="text-gray-500 text-sm">Kelola dokumentasi seminar, workshop, kuliah umum, dan kegiatan kemahasiswaan.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <PlusIcon className="w-5 h-5" />
          {isAdmin ? "Tambah Kegiatan" : "Ajukan Kegiatan"}
        </button>
      </div>

      {/* Main Admin Section Tabs */}
      {isAdmin ? (
        <div className="flex gap-1 mb-6 border-b border-gray-100">
          {sectionTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors cursor-pointer ${
                activeSection === tab.key
                  ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      {/* Filters Container */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl mb-6">
        <div className="flex flex-wrap items-center gap-3 w-full">
          <span className="text-xs font-semibold text-gray-500 block">Filter:</span>
          
          <select
            value={filterKategori}
            onChange={(e) => {
              setFilterKategori(e.target.value);
              setPendingPage(1);
              setReviewedPage(1);
              setAllPage(1);
            }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/25 text-gray-800 font-medium cursor-pointer"
          >
            <option value="">Semua Kategori</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filterBulan}
            onChange={(e) => {
              setFilterBulan(e.target.value);
              setPendingPage(1);
              setReviewedPage(1);
              setAllPage(1);
            }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/25 text-gray-800 font-medium cursor-pointer"
          >
            <option value="">Semua Bulan</option>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={filterTahun}
            onChange={(e) => {
              setFilterTahun(e.target.value);
              setPendingPage(1);
              setReviewedPage(1);
              setAllPage(1);
            }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/25 text-gray-800 font-medium cursor-pointer"
          >
            <option value="">Semua Tahun</option>
            {uniqueYears.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          {(filterKategori || filterBulan || filterTahun) && (
            <button
              onClick={() => {
                setFilterKategori("");
                setFilterBulan("");
                setFilterTahun("");
                setPendingPage(1);
                setReviewedPage(1);
                setAllPage(1);
              }}
              className="px-3 py-2 text-xs font-bold bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Admin Pending View OR Dosen/Pegawai complete status dashboard (replaces separate tab structures) */}
      {(activeSection === "pending" || !isAdmin) && (
        <>
          {/* SECTION 1: MENUNGGU PERSETUJUAN */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <h2 className="text-base font-bold text-amber-700 flex items-center gap-2">
                <ClockIcon className="w-5 h-5" /> Menunggu Persetujuan
              </h2>
              <div className="relative max-w-xs w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <SearchIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Cari pengajuan..."
                  value={pendingSearchQuery}
                  onChange={(e) => { setPendingSearchQuery(e.target.value); setPendingPage(1); }}
                  className="w-full pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-gray-900"
                />
                {pendingSearchQuery && (
                  <button onClick={() => { setPendingSearchQuery(""); setPendingPage(1); }} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-amber-50 text-amber-800 font-semibold border-b border-amber-100">
                    <tr>
                      <th className="px-6 py-4">Nama Kegiatan</th>
                      <th className="px-6 py-4">Kategori</th>
                      <th className="px-6 py-4">Tanggal Kegiatan</th>
                      <th className="px-6 py-4">Tanggal Ajuan</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {paginatedPending.map((k) => (
                      <tr key={k.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-gray-900">
                          <div className="line-clamp-1">{k.nama}</div>
                          {k.lokasi && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                              <PinIcon className="w-3 h-3" /> {k.lokasi}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                            {k.kategori}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-500 font-semibold whitespace-nowrap">
                          {formatLocalDate(k.tanggal)}
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-400">
                          {new Date(k.created_at).toLocaleDateString("id-ID")}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => { setDetailItem(k); setIsDetailOpen(true); }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                              title="Lihat Detail"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => { setReviewItem(k); setReviewNote(""); setIsReviewOpen(true); }}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-green-600 hover:bg-green-50 transition-colors cursor-pointer"
                                title="Tinjau & Setujui"
                              >
                                <CheckIcon className="w-4.5 h-4.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenDelete(k.id, "pending")}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title={isAdmin ? "Tolak & Hapus" : "Batalkan Pengajuan"}
                            >
                              {isAdmin ? <XMarkIcon className="w-4.5 h-4.5" /> : <TrashIcon className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPending.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                          {pendingSearchQuery ? "Tidak ada pengajuan pending yang cocok dengan pencarian." : "Tidak ada pengajuan pending yang menunggu persetujuan."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination
                currentPage={pendingPage}
                totalPages={totalPendingPages}
                totalEntries={totalPendingEntries}
                pageSize={pendingPageSize}
                onPageChange={setPendingPage}
                onPageSizeChange={size => { setPendingPageSize(size); setPendingPage(1); }}
              />
            </div>
          </div>

          {/* SECTION 2: RIWAYAT REVIEW / PENGASILAN */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <h2 className="text-base font-bold text-gray-700">Riwayat Pengajuan</h2>
              <div className="relative max-w-xs w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <SearchIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Cari riwayat..."
                  value={reviewedSearchQuery}
                  onChange={(e) => { setReviewedSearchQuery(e.target.value); setReviewedPage(1); }}
                  className="w-full pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-900"
                />
                {reviewedSearchQuery && (
                  <button onClick={() => { setReviewedSearchQuery(""); setReviewedPage(1); }} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Nama Kegiatan</th>
                      <th className="px-6 py-4">Kategori</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Catatan Admin</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedReviewed.map((k) => {
                      const cfg = statusConfig[k.status];
                      const Icon = cfg.icon;
                      return (
                        <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-3 font-medium text-gray-900">
                            <div className="line-clamp-1">{k.nama}</div>
                          </td>
                          <td className="px-6 py-3">
                            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                              {k.kategori}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${cfg.cls}`}>
                              <Icon className="w-3.5 h-3.5" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-xs text-gray-500 italic max-w-xs truncate">
                            {k.catatan_admin || "—"}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => { setDetailItem(k); setIsDetailOpen(true); }}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                                title="Lihat Detail"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(k.id, "pending")}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Hapus Riwayat"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredReviewed.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                          {reviewedSearchQuery ? "Tidak ada riwayat pengajuan yang cocok dengan pencarian." : "Belum ada riwayat pengajuan."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination
                currentPage={reviewedPage}
                totalPages={totalReviewedPages}
                totalEntries={totalReviewedEntries}
                pageSize={reviewedPageSize}
                onPageChange={setReviewedPage}
                onPageSizeChange={size => { setReviewedPageSize(size); setReviewedPage(1); }}
              />
            </div>
          </div>
        </>
      )}

      {/* Dosen/Pegawai: always see list of approved items, Admin sees it on the dedicated "all" tab */}
      {(activeSection === "all" || !isAdmin) && (
        <div className="mt-4 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-base font-bold text-gray-700">Kegiatan Terpublikasi ({approvedItems.length})</h2>
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <SearchIcon className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Cari kegiatan (nama, kategori)..."
                value={allSearchQuery}
                onChange={(e) => { setAllSearchQuery(e.target.value); setAllPage(1); }}
                className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {allSearchQuery && (
                <button onClick={() => { setAllSearchQuery(""); setAllPage(1); }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Nama Kegiatan</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedApproved.map((k) => (
                    <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        <div className="line-clamp-1">{k.nama}</div>
                        {k.lokasi && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                            <PinIcon className="w-3 h-3" /> {k.lokasi}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                          {k.kategori}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500 font-semibold whitespace-nowrap">
                        {formatLocalDate(k.tanggal)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => { setDetailItem(k); setIsDetailOpen(true); }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                            title="Lihat Detail"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(k)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(k.id, "approved")}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Hapus"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAllApproved.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                        {allSearchQuery ? "Tidak ada kegiatan yang cocok dengan pencarian." : "Belum ada data kegiatan."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={allPage}
              totalPages={totalApprovedPages}
              totalEntries={totalApprovedEntries}
              pageSize={allPageSize}
              onPageChange={setAllPage}
              onPageSizeChange={size => { setAllPageSize(size); setAllPage(1); }}
            />
          </div>
        </div>
      )}

      {/* Editor Modal (Add/Edit approved or Submit pending) */}
      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title={editingId ? "Edit Kegiatan" : isAdmin ? "Tambah Kegiatan Baru" : "Ajukan Kegiatan Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-750 mb-1">Nama Kegiatan</label>
            <input
              type="text"
              required
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className={inputCls}
              placeholder="Contoh: Kuliah Umum Transformasi Digital"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-750 mb-1">Tanggal Kegiatan</label>
              <input
                type="date"
                required
                value={form.tanggal}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-750 mb-1">Kategori</label>
              <input
                type="text"
                required
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                className={inputCls}
                placeholder="Contoh: Seminar, Workshop, dll."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-750 mb-1">Lokasi (Opsional)</label>
            <input
              type="text"
              value={form.lokasi}
              onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
              className={inputCls}
              placeholder="Contoh: Auditorium Utama Kampus Polimdo"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-750 mb-1">Deskripsi Kegiatan</label>
            <textarea
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              className={inputCls + " resize-none"}
              placeholder="Jelaskan deskripsi, tujuan, dan jalannya kegiatan..."
            />
          </div>

          {/* Photo upload section */}
          <div>
            <label className="block text-sm font-semibold text-gray-750 mb-1.5">Dokumentasi Foto</label>
            
            {form.foto_urls.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-3">
                {form.foto_urls.map((url, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-250 shadow-sm">
                    <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                    >
                      <TrashIcon className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="kegiatan-photo-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                <UploadIcon className="w-4 h-4 text-gray-500" />
                {isUploading ? "Mengupload..." : "Tambah Foto"}
              </button>
              {form.foto_urls.length === 0 && <span className="text-xs text-gray-400">Belum ada foto</span>}
            </div>
          </div>

          {!isAdmin && (
            <div className="p-3 rounded-xl bg-amber-50 text-amber-700 text-xs border border-amber-100">
              <strong>Info:</strong> Kegiatan yang diajukan akan ditinjau oleh admin sebelum dipublikasikan.
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6 font-medium">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-650 bg-gray-100 hover:bg-gray-200 cursor-pointer disabled:opacity-50"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : isAdmin ? "Simpan Kegiatan" : "Ajukan Kegiatan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Modal (Admin only) */}
      <Modal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} title="Tinjau Pengajuan Kegiatan">
        {reviewItem && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-1">Nama Kegiatan</h4>
              <p className="text-gray-900 text-sm">{reviewItem.nama}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-1">Kategori</h4>
                <p className="text-gray-900 text-sm">{reviewItem.kategori}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-1">Tanggal</h4>
                <p className="text-gray-900 text-sm font-medium">{formatLongLocalDate(reviewItem.tanggal)}</p>
              </div>
            </div>
            {reviewItem.lokasi && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-1">Lokasi</h4>
                <p className="text-gray-900 text-sm">{reviewItem.lokasi}</p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-1">Deskripsi</h4>
              <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                {reviewItem.deskripsi || "—"}
              </p>
            </div>

            {reviewItem.foto_urls?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">Foto Dokumentasi</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {reviewItem.foto_urls.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-video rounded-lg overflow-hidden border border-gray-100 block">
                      <img src={url} alt={`Dokumentasi ${idx + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Catatan Penolakan (Hanya diisi jika Menolak)
              </label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-primary-950 resize-none"
                placeholder="Tulis alasan mengapa pengajuan ditolak..."
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 font-medium">
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-650 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleReviewAction("reject")}
                className="px-4 py-2 rounded-xl text-sm font-medium text-red-650 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                Tolak Pengajuan
              </button>
              <button
                type="button"
                onClick={() => handleReviewAction("approve")}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                disabled={isSubmitting}
              >
                <CheckIcon className="w-4 h-4" /> Setujui & Publikasikan
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setDetailItem(null); }} title="Detail Kegiatan">
        {detailItem && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-primary-950 mb-1">{detailItem.nama}</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400 font-semibold mt-1">
                <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded">{detailItem.kategori}</span>
                <span>Tanggal: {formatLongLocalDate(detailItem.tanggal)}</span>
                {detailItem.lokasi && (
                  <span className="flex items-center gap-1">
                    <PinIcon className="w-3.5 h-3.5" />
                    {detailItem.lokasi}
                  </span>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed border-t border-b border-gray-50 py-4">
              {detailItem.deskripsi || "Tidak ada deskripsi kegiatan."}
            </div>

            {detailItem.foto_urls?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">Foto Dokumentasi ({detailItem.foto_urls.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {detailItem.foto_urls.map((url: string, idx: number) => (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-video rounded-lg overflow-hidden border border-gray-150 block hover:opacity-90 transition-opacity">
                      <img src={url} alt={`Dokumentasi ${idx + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end font-medium">
              <button
                type="button"
                onClick={() => { setIsDetailOpen(false); setDetailItem(null); }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
        title={deleteType === "approved" ? "Hapus Kegiatan" : "Batalkan Pengajuan"}
        message={
          deleteType === "approved"
            ? "Hapus dokumentasi kegiatan ini secara permanen dari server? Tindakan ini tidak dapat dibatalkan."
            : "Batalkan pengajuan kegiatan ini? Semua berkas foto yang diunggah akan dibersihkan."
        }
        confirmLabel={deleteType === "approved" ? "Hapus" : "Batalkan"}
        variant="danger"
      />
    </div>
  );
}
