"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/universal/Modal";
import PersonLinker from "@/components/universal/PersonLinker";
import ComboBox from "@/components/universal/ComboBox";
import ConfirmDialog from "@/components/universal/ConfirmDialog";
import { cachedFetch, invalidateCache } from "@/lib/fetchCache";
import type { PersonLink } from "@/components/universal/PersonLinker";
import { HiOutlineCheck, HiOutlineXMark, HiOutlineTrash, HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlinePlus, HiOutlinePencilSquare, HiOutlinePhoto, HiOutlineEye, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { useRef } from "react";
import { useNotification } from "@/context/NotificationContext";
import TablePagination from "@/components/universal/TablePagination";

interface PendingKarya {
  id: string;
  dosen_id: string;
  jenis: string;
  judul: string;
  tahun: number;
  deskripsi: string | null;
  metadata: Record<string, unknown> | null;
  foto_urls: string[];
  status: "pending" | "approved" | "rejected";
  catatan_admin: string | null;
  created_at: string;
  reviewed_at: string | null;
  dosen: { id: string; nama: string } | null;
}

interface Karya {
  id: string;
  dosen_id: string;
  jenis: string;
  judul: string;
  tahun: number;
  deskripsi: string | null;
  metadata: Record<string, unknown> | null;
  foto_urls: string[];
}

interface DosenOption {
  id: string;
  nama: string;
}

const jenisLabels: Record<string, string> = {
  publikasi: "Publikasi", penelitian: "Penelitian", pengabdian: "Pengabdian",
  bukuAjar: "Buku Ajar", hki: "HKI", sertifikasi: "Sertifikasi",
};

const statusConfig = {
  pending: { label: "Menunggu", cls: "bg-amber-100 text-amber-700", icon: HiOutlineClock },
  approved: { label: "Disetujui", cls: "bg-green-100 text-green-700", icon: HiOutlineCheckCircle },
  rejected: { label: "Ditolak", cls: "bg-red-100 text-red-700", icon: HiOutlineXCircle },
};

export default function AdminKaryaPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [pendingList, setPendingList] = useState<PendingKarya[]>([]);
  const [allKarya, setAllKarya] = useState<Karya[]>([]);
  const [dosenOptions, setDosenOptions] = useState<DosenOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingKarya, setViewingKarya] = useState<PendingKarya | null>(null);
  const [catatan, setCatatan] = useState("");
  const [activeSection, setActiveSection] = useState<"pending" | "all">("pending");

  // Search & Pagination states
  const [pendingSearchQuery, setPendingSearchQuery] = useState("");
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(10);

  const [reviewedSearchQuery, setReviewedSearchQuery] = useState("");
  const [reviewedPage, setReviewedPage] = useState(1);
  const [reviewedSearchPageSize, setReviewedPageSize] = useState(10);

  const [allSearchQuery, setAllSearchQuery] = useState("");
  const [allPage, setAllPage] = useState(1);
  const [allPageSize, setAllPageSize] = useState(10);

  // CRUD modal state
  const [karyaModalOpen, setKaryaModalOpen] = useState(false);
  const [editingKaryaId, setEditingKaryaId] = useState<string | null>(null);
  const [karyaForm, setKaryaForm] = useState<Record<string, string | number>>({});
  const [fotoUrls, setFotoUrls] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmVariant, setConfirmVariant] = useState<"danger" | "default">("default");
  const confirmCallback = useRef<(() => void) | null>(null);

  const showConfirm = (title: string, message: string, onOk: () => void, variant: "danger" | "default" = "default") => {
    setConfirmTitle(title);
    setConfirmMsg(message);
    setConfirmVariant(variant);
    confirmCallback.current = onOk;
    setConfirmOpen(true);
  };

  // Metadata state per jenis
  const [metaJurnal, setMetaJurnal] = useState("");
  const [metaLink, setMetaLink] = useState("");
  const [metaPenulis, setMetaPenulis] = useState<PersonLink[]>([]);
  const [metaSumberDana, setMetaSumberDana] = useState("");
  const [metaKetua, setMetaKetua] = useState<PersonLink[]>([]);
  const [metaAnggota, setMetaAnggota] = useState<PersonLink[]>([]);
  const [metaMitra, setMetaMitra] = useState("");
  const [metaPenerbit, setMetaPenerbit] = useState("");
  const [metaIsbn, setMetaIsbn] = useState("");
  const [metaJenisHki, setMetaJenisHki] = useState("");
  const [metaNomorSertifikat, setMetaNomorSertifikat] = useState("");
  const [metaPenyelenggara, setMetaPenyelenggara] = useState("");
  const [metaLinkSertifikat, setMetaLinkSertifikat] = useState("");
  const [metaSampulDepan, setMetaSampulDepan] = useState("");
  const [metaSampulBelakang, setMetaSampulBelakang] = useState("");
  const [isUploadingDepan, setIsUploadingDepan] = useState(false);
  const [isUploadingBelakang, setIsUploadingBelakang] = useState(false);

  const resetMeta = () => {
    setMetaJurnal(""); setMetaLink(""); setMetaPenulis([]);
    setMetaSumberDana(""); setMetaKetua([]); setMetaAnggota([]);
    setMetaMitra(""); setMetaPenerbit(""); setMetaIsbn("");
    setMetaJenisHki(""); setMetaNomorSertifikat("");
    setMetaPenyelenggara(""); setMetaLinkSertifikat("");
    setMetaSampulDepan(""); setMetaSampulBelakang("");
  };

  const populateMeta = (jenis: string, meta: Record<string, unknown> | null) => {
    resetMeta();
    if (!meta) return;
    if (jenis === "publikasi") {
      setMetaJurnal((meta.jurnal as string) || "");
      setMetaLink((meta.link as string) || "");
      setMetaPenulis((meta.penulis as PersonLink[]) || []);
    } else if (jenis === "penelitian") {
      setMetaSumberDana((meta.sumberDana as string) || "");
      setMetaKetua(meta.ketua ? [meta.ketua as PersonLink] : []);
      setMetaAnggota((meta.anggota as PersonLink[]) || []);
    } else if (jenis === "pengabdian") {
      setMetaMitra((meta.mitra as string) || "");
      setMetaKetua(meta.ketua ? [meta.ketua as PersonLink] : []);
      setMetaAnggota((meta.anggota as PersonLink[]) || []);
    } else if (jenis === "bukuAjar") {
      setMetaPenerbit((meta.penerbit as string) || "");
      setMetaIsbn((meta.isbn as string) || "");
      setMetaPenulis((meta.penulis as PersonLink[]) || []);
      setMetaSampulDepan((meta.sampul_depan as string) || "");
      setMetaSampulBelakang((meta.sampul_belakang as string) || "");
    } else if (jenis === "hki") {
      setMetaJenisHki((meta.jenisHki as string) || "");
      setMetaNomorSertifikat((meta.nomorSertifikat as string) || "");
    } else if (jenis === "sertifikasi") {
      setMetaPenyelenggara((meta.penyelenggara as string) || "");
      setMetaLinkSertifikat((meta.linkSertifikat as string) || "");
    }
  };

  const buildMetadata = (jenis: string): Record<string, unknown> => {
    switch (jenis) {
      case "publikasi": return { jurnal: metaJurnal, link: metaLink, penulis: metaPenulis };
      case "penelitian": return { sumberDana: metaSumberDana, ketua: metaKetua[0] || null, anggota: metaAnggota };
      case "pengabdian": return { mitra: metaMitra, ketua: metaKetua[0] || null, anggota: metaAnggota };
      case "bukuAjar": return { penerbit: metaPenerbit, isbn: metaIsbn, penulis: metaPenulis, sampul_depan: metaSampulDepan, sampul_belakang: metaSampulBelakang };
      case "hki": return { jenisHki: metaJenisHki, nomorSertifikat: metaNomorSertifikat };
      case "sertifikasi": return { penyelenggara: metaPenyelenggara, linkSertifikat: metaLinkSertifikat };
      default: return {};
    }
  };

  const inputCls = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

  const fetchData = async (active = true) => {
    try {
      const [pendingRes, karyaRes, dosenRes] = await Promise.all([
        cachedFetch<PendingKarya[]>("/api/karya-pending"),
        cachedFetch<Karya[]>("/api/karya"),
        cachedFetch<DosenOption[]>("/api/dosen"),
      ]);
      if (!active) return;
      if (pendingRes) setPendingList(pendingRes);
      if (karyaRes) setAllKarya(karyaRes);
      if (dosenRes) setDosenOptions(dosenRes);
    } catch (e) { console.error("Failed to fetch karya data", e); }
    finally { 
      if (active) setIsLoading(false); 
    }
  };

  useEffect(() => {
    let active = true;
    fetchData(active);
    return () => {
      active = false;
    };
  }, []);

  // ========== Pending actions ==========
  const handleApprove = async (id: string) => {
    showConfirm("Setujui Karya", "Setujui karya ini?", async () => {
      try {
        const res = await fetch(`/api/karya-pending/${id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal menyetujui karya");
        }
        invalidateCache("/api/karya-pending");
        invalidateCache("/api/karya");
        await fetchData();
        showSuccess("Pengajuan karya disetujui!");
        router.refresh();
      } catch (err: any) {
        showError(err.message || "Gagal memproses persetujuan");
      }
    });
  };

  const openRejectModal = (id: string) => { setRejectingId(id); setCatatan(""); setRejectModalOpen(true); };

  const handleReject = async () => {
    if (!rejectingId) return;
    try {
      const res = await fetch(`/api/karya-pending/${rejectingId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", catatan_admin: catatan || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menolak karya");
      }
      invalidateCache("/api/karya-pending");
      setRejectModalOpen(false); 
      await fetchData(); 
      showSuccess("Pengajuan karya ditolak!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Gagal memproses penolakan");
    }
  };

  const handleDeletePending = async (id: string) => {
    showConfirm("Hapus Pengajuan", "Hapus pengajuan ini? Tindakan ini tidak dapat dibatalkan.", async () => {
      try {
        const res = await fetch(`/api/karya-pending/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal menghapus pengajuan");
        }
        invalidateCache("/api/karya-pending");
        setPendingList(prev => prev.filter(k => k.id !== id));
        showSuccess("Pengajuan berhasil dihapus!");
        router.refresh();
      } catch (err: any) {
        showError(err.message || "Gagal menghapus pengajuan");
      }
    }, "danger");
  };

  // ========== Photo Upload ==========
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingPhoto(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append("file", files[i]);
        fd.append("jenis", (karyaForm.jenis as string) || "karya");
        const res = await fetch("/api/upload/karya", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          setFotoUrls(prev => [...prev, data.url]);
        }
      }
    } catch (err) { console.error("Photo upload failed", err); }
    finally { setIsUploadingPhoto(false); if (photoInputRef.current) photoInputRef.current.value = ""; }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, position: "depan" | "belakang") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (position === "depan") setIsUploadingDepan(true);
    else setIsUploadingBelakang(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("jenis", "bukuAjar");
      const res = await fetch("/api/upload/karya", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        if (position === "depan") setMetaSampulDepan(data.url);
        else setMetaSampulBelakang(data.url);
        showSuccess(`Sampul ${position === "depan" ? "depan" : "belakang"} berhasil diunggah!`);
      } else {
        throw new Error("Gagal mengunggah gambar");
      }
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan saat mengunggah.");
    } finally {
      if (position === "depan") setIsUploadingDepan(false);
      else setIsUploadingBelakang(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  // ========== Karya CRUD ==========
  const handleOpenAddKarya = () => {
    setEditingKaryaId(null);
    setKaryaForm({ dosen_id: dosenOptions[0]?.id || "", jenis: "publikasi", judul: "", tahun: new Date().getFullYear(), deskripsi: "" });
    resetMeta();
    setFotoUrls([]);
    setKaryaModalOpen(true);
  };

  const handleOpenEditKarya = (k: Karya) => {
    setEditingKaryaId(k.id);
    setKaryaForm({ dosen_id: k.dosen_id, jenis: k.jenis, judul: k.judul, tahun: k.tahun, deskripsi: k.deskripsi || "" });
    populateMeta(k.jenis, k.metadata);
    setFotoUrls(k.foto_urls || []);
    setKaryaModalOpen(true);
  };

  const handleKaryaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const jenis = karyaForm.jenis as string;
    const payload = {
      dosen_id: karyaForm.dosen_id,
      jenis,
      judul: karyaForm.judul,
      tahun: Number(karyaForm.tahun),
      deskripsi: karyaForm.deskripsi || null,
      metadata: buildMetadata(jenis),
      foto_urls: fotoUrls,
    };

    try {
      if (editingKaryaId) {
        const res = await fetch(`/api/karya/${editingKaryaId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal memperbarui karya");
        }
        invalidateCache("/api/karya");
        setKaryaModalOpen(false); 
        await fetchData(); 
      } else {
        const res = await fetch("/api/karya", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal menyimpan karya");
        }
        invalidateCache("/api/karya");
        setKaryaModalOpen(false); 
        await fetchData(); 
      }
      showSuccess("Karya berhasil disimpan!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Gagal menyimpan karya");
    }
  };

  const handleDeleteKarya = async (id: string) => {
    showConfirm("Hapus Karya", "Hapus karya ini? Tindakan ini tidak dapat dibatalkan.", async () => {
      try {
        const res = await fetch(`/api/karya/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal menghapus karya");
        }
        invalidateCache("/api/karya");
        setAllKarya(prev => prev.filter(k => k.id !== id));
        showSuccess("Karya berhasil dihapus!");
        router.refresh();
      } catch (err: any) {
        showError(err.message || "Gagal menghapus karya");
      }
    }, "danger");
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400 font-medium animate-pulse">Loading Karya...</div>;

  const pendingOnly = pendingList.filter(k => k.status === "pending");
  const filteredPending = pendingOnly.filter(k => {
    const q = pendingSearchQuery.toLowerCase();
    return (
      k.judul.toLowerCase().includes(q) ||
      (k.dosen?.nama || "").toLowerCase().includes(q) ||
      (jenisLabels[k.jenis] || k.jenis).toLowerCase().includes(q) ||
      String(k.tahun).includes(q)
    );
  });
  const totalPendingEntries = filteredPending.length;
  const totalPendingPages = Math.ceil(totalPendingEntries / pendingPageSize);
  const paginatedPending = filteredPending.slice(
    (pendingPage - 1) * pendingPageSize,
    pendingPage * pendingPageSize
  );

  const reviewedList = pendingList.filter(k => k.status !== "pending");
  const filteredReviewed = reviewedList.filter(k => {
    const q = reviewedSearchQuery.toLowerCase();
    return (
      k.judul.toLowerCase().includes(q) ||
      (k.dosen?.nama || "").toLowerCase().includes(q) ||
      (jenisLabels[k.jenis] || k.jenis).toLowerCase().includes(q) ||
      String(k.tahun).includes(q) ||
      k.status.toLowerCase().includes(q)
    );
  });
  const totalReviewedEntries = filteredReviewed.length;
  const totalReviewedPages = Math.ceil(totalReviewedEntries / reviewedSearchPageSize);
  const paginatedReviewed = filteredReviewed.slice(
    (reviewedPage - 1) * reviewedSearchPageSize,
    reviewedPage * reviewedSearchPageSize
  );

  const filteredAllKarya = allKarya.filter(k => {
    const q = allSearchQuery.toLowerCase();
    const dosenNama = dosenOptions.find(d => d.id === k.dosen_id)?.nama || k.dosen_id;
    return (
      k.judul.toLowerCase().includes(q) ||
      dosenNama.toLowerCase().includes(q) ||
      (jenisLabels[k.jenis] || k.jenis).toLowerCase().includes(q) ||
      String(k.tahun).includes(q)
    );
  });
  const totalAllKaryaEntries = filteredAllKarya.length;
  const totalAllKaryaPages = Math.ceil(totalAllKaryaEntries / allPageSize);
  const paginatedAllKarya = filteredAllKarya.slice(
    (allPage - 1) * allPageSize,
    allPage * allPageSize
  );

  const sectionTabs = [
    { key: "pending" as const, label: `Pengajuan (${pendingOnly.length})` },
    { key: "all" as const, label: `Semua Karya (${allKarya.length})` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Manajemen Karya</h1>
      <p className="text-gray-500 text-sm mb-6">Kelola pengajuan dan semua data karya dosen.</p>

      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {sectionTabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveSection(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors ${activeSection === tab.key ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========== PENDING TAB ========== */}
      {activeSection === "pending" && (
        <>
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <h2 className="text-lg font-bold text-amber-700 flex items-center gap-2">
                <HiOutlineClock className="w-5 h-5" /> Menunggu Persetujuan
              </h2>
              <div className="relative max-w-xs w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <HiOutlineMagnifyingGlass className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Cari pengajuan..."
                  value={pendingSearchQuery}
                  onChange={e => { setPendingSearchQuery(e.target.value); setPendingPage(1); }}
                  className="w-full pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-gray-900"
                />
                {pendingSearchQuery && (
                  <button onClick={() => { setPendingSearchQuery(""); setPendingPage(1); }} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600">
                    <HiOutlineXMark className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-amber-50 text-amber-800 font-semibold border-b border-amber-100">
                    <tr><th className="px-6 py-4">Dosen</th><th className="px-6 py-4">Judul</th><th className="px-6 py-4">Jenis</th><th className="px-6 py-4">Tahun</th><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4 text-right">Aksi</th></tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {paginatedPending.map(k => (
                      <tr key={k.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-gray-900">{k.dosen?.nama || "—"}</td>
                        <td className="px-6 py-3 text-gray-900 max-w-xs truncate">{k.judul}</td>
                        <td className="px-6 py-3"><span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">{jenisLabels[k.jenis] || k.jenis}</span></td>
                        <td className="px-6 py-3">{k.tahun}</td>
                        <td className="px-6 py-3 text-xs text-gray-400">{new Date(k.created_at).toLocaleDateString("id-ID")}</td>
                        <td className="px-6 py-3 text-right space-x-1">
                          <button onClick={() => { setViewingKarya(k); setDetailModalOpen(true); }} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer" title="Lihat Detail"><HiOutlineEye className="w-5 h-5" /></button>
                          <button onClick={() => handleApprove(k.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-green-600 hover:bg-green-50 transition-colors cursor-pointer" title="Setujui"><HiOutlineCheck className="w-5 h-5" /></button>
                          <button onClick={() => openRejectModal(k.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Tolak"><HiOutlineXMark className="w-5 h-5" /></button>
                          <button onClick={() => handleDeletePending(k.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors cursor-pointer" title="Hapus"><HiOutlineTrash className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                    {filteredPending.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                          {pendingSearchQuery ? "Tidak ada pengajuan yang cocok dengan pencarian." : "Tidak ada pengajuan yang menunggu persetujuan."}
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

          <div className="mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <h2 className="text-lg font-bold text-gray-700">Riwayat Review</h2>
              <div className="relative max-w-xs w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <HiOutlineMagnifyingGlass className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Cari riwayat..."
                  value={reviewedSearchQuery}
                  onChange={e => { setReviewedSearchQuery(e.target.value); setReviewedPage(1); }}
                  className="w-full pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-900"
                />
                {reviewedSearchQuery && (
                  <button onClick={() => { setReviewedSearchQuery(""); setReviewedPage(1); }} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600">
                    <HiOutlineXMark className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                    <tr><th className="px-6 py-4">Dosen</th><th className="px-6 py-4">Judul</th><th className="px-6 py-4">Jenis</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Aksi</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedReviewed.map(k => {
                      const cfg = statusConfig[k.status];
                      const Icon = cfg.icon;
                      return (
                        <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-3 font-medium text-gray-900">{k.dosen?.nama || "—"}</td>
                          <td className="px-6 py-3 text-gray-900 max-w-xs truncate">{k.judul}</td>
                          <td className="px-6 py-3"><span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">{jenisLabels[k.jenis] || k.jenis}</span></td>
                          <td className="px-6 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${cfg.cls}`}><Icon className="w-3.5 h-3.5" />{cfg.label}</span></td>
                          <td className="px-6 py-3 text-right"><button onClick={() => handleDeletePending(k.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors cursor-pointer" title="Hapus"><HiOutlineTrash className="w-4 h-4" /></button></td>
                        </tr>
                      );
                    })}
                    {filteredReviewed.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                          {reviewedSearchQuery ? "Tidak ada riwayat review yang cocok dengan pencarian." : "Belum ada riwayat review."}
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
                pageSize={reviewedSearchPageSize}
                onPageChange={setReviewedPage}
                onPageSizeChange={size => { setReviewedPageSize(size); setReviewedPage(1); }}
              />
            </div>
          </div>
        </>
      )}

      {/* ========== ALL KARYA TAB (with full CRUD) ========== */}
      {activeSection === "all" && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <HiOutlineMagnifyingGlass className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Cari karya (judul, dosen, jenis)..."
                value={allSearchQuery}
                onChange={(e) => {
                  setAllSearchQuery(e.target.value);
                  setAllPage(1);
                }}
                className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {allSearchQuery && (
                <button
                  onClick={() => {
                    setAllSearchQuery("");
                    setAllPage(1);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
              )}
            </div>
            <button onClick={handleOpenAddKarya}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm cursor-pointer whitespace-nowrap">
              <HiOutlinePlus className="w-5 h-5" /> Tambah Karya
            </button>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                  <tr><th className="px-6 py-4">Dosen</th><th className="px-6 py-4">Judul</th><th className="px-6 py-4">Jenis</th><th className="px-6 py-4">Tahun</th><th className="px-6 py-4 text-right">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedAllKarya.map(k => (
                    <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">{dosenOptions.find(d => d.id === k.dosen_id)?.nama || k.dosen_id}</td>
                      <td className="px-6 py-3 text-gray-900 max-w-xs truncate">{k.judul}</td>
                      <td className="px-6 py-3"><span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">{jenisLabels[k.jenis] || k.jenis}</span></td>
                      <td className="px-6 py-3">{k.tahun}</td>
                      <td className="px-6 py-3 text-right space-x-1">
                        <button onClick={() => handleOpenEditKarya(k)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer" title="Edit"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteKarya(k.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Hapus"><HiOutlineTrash className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredAllKarya.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        {allSearchQuery ? "Tidak ada karya yang cocok dengan pencarian." : "Belum ada data karya."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={allPage}
              totalPages={totalAllKaryaPages}
              totalEntries={totalAllKaryaEntries}
              pageSize={allPageSize}
              onPageChange={setAllPage}
              onPageSizeChange={size => { setAllPageSize(size); setAllPage(1); }}
            />
          </div>
        </>
      )}

      {/* Reject Modal */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Tolak Pengajuan Karya">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Berikan catatan atau alasan penolakan (opsional).</p>
          <textarea rows={3} value={catatan} onChange={e => setCatatan(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            placeholder="Alasan penolakan..." />
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button onClick={() => setRejectModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Batal</button>
            <button onClick={handleReject} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors">Tolak Pengajuan</button>
          </div>
        </div>
      </Modal>

      {/* Karya Add/Edit Modal */}
      <Modal isOpen={karyaModalOpen} onClose={() => setKaryaModalOpen(false)} title={editingKaryaId ? "Edit Karya" : "Tambah Karya Baru"}>
        <form onSubmit={handleKaryaSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dosen</label>
            <ComboBox
              options={dosenOptions}
              value={String(karyaForm.dosen_id || "")}
              onChange={(val) => setKaryaForm({ ...karyaForm, dosen_id: val })}
              placeholder="Pilih dosen..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Karya</label>
            <textarea required rows={2} value={karyaForm.judul || ""} onChange={e => setKaryaForm({ ...karyaForm, judul: e.target.value })} className={inputCls + " resize-none"} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <ComboBox
                options={[
                  { id: "publikasi", nama: "Publikasi" },
                  { id: "penelitian", nama: "Penelitian" },
                  { id: "pengabdian", nama: "Pengabdian" },
                  { id: "bukuAjar", nama: "Buku Ajar" },
                  { id: "hki", nama: "HKI" },
                  { id: "sertifikasi", nama: "Sertifikasi" }
                ]}
                value={String(karyaForm.jenis || "publikasi")}
                onChange={val => setKaryaForm({ ...karyaForm, jenis: val })}
                placeholder="Pilih Kategori..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
              <input type="number" required value={karyaForm.tahun || ""} onChange={e => setKaryaForm({ ...karyaForm, tahun: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (opsional)</label>
            <textarea rows={2} value={karyaForm.deskripsi || ""} onChange={e => setKaryaForm({ ...karyaForm, deskripsi: e.target.value })} className={inputCls + " resize-none"} />
          </div>

          {/* ===== Jenis-specific metadata fields ===== */}
          <div className="border-t border-gray-100 pt-4 mt-2 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Detail {jenisLabels[karyaForm.jenis as string] || ""}</p>

            {karyaForm.jenis === "publikasi" && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Jurnal</label>
                  <input type="text" value={metaJurnal} onChange={e => setMetaJurnal(e.target.value)} className={inputCls} placeholder="Contoh: IEEE Transactions" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Link Publikasi</label>
                  <input type="url" value={metaLink} onChange={e => setMetaLink(e.target.value)} className={inputCls} placeholder="https://..." />
                </div>
                <PersonLinker label="Penulis" dosenOptions={dosenOptions} value={metaPenulis} onChange={setMetaPenulis} />
              </>
            )}

            {karyaForm.jenis === "penelitian" && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Sumber Dana</label>
                  <input type="text" value={metaSumberDana} onChange={e => setMetaSumberDana(e.target.value)} className={inputCls} placeholder="Contoh: Kemendikbud Ristek" />
                </div>
                <PersonLinker label="Ketua" dosenOptions={dosenOptions} value={metaKetua} onChange={setMetaKetua} single />
                <PersonLinker label="Anggota" dosenOptions={dosenOptions} value={metaAnggota} onChange={setMetaAnggota} />
              </>
            )}

            {karyaForm.jenis === "pengabdian" && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mitra</label>
                  <input type="text" value={metaMitra} onChange={e => setMetaMitra(e.target.value)} className={inputCls} placeholder="Contoh: Desa Buha" />
                </div>
                <PersonLinker label="Ketua" dosenOptions={dosenOptions} value={metaKetua} onChange={setMetaKetua} single />
                <PersonLinker label="Anggota" dosenOptions={dosenOptions} value={metaAnggota} onChange={setMetaAnggota} />
              </>
            )}

            {karyaForm.jenis === "bukuAjar" && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Penerbit</label>
                  <input type="text" value={metaPenerbit} onChange={e => setMetaPenerbit(e.target.value)} className={inputCls} placeholder="Contoh: Polimdo Press" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">ISBN</label>
                  <input type="text" value={metaIsbn} onChange={e => setMetaIsbn(e.target.value)} className={inputCls} placeholder="978-..." />
                </div>
                <PersonLinker label="Penulis" dosenOptions={dosenOptions} value={metaPenulis} onChange={setMetaPenulis} />
                
                {/* Book Covers Upload Options */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sampul Depan</label>
                    {metaSampulDepan ? (
                      <div className="relative w-28 h-36 rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                        <img src={metaSampulDepan} alt="Sampul Depan" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setMetaSampulDepan("")}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold hover:bg-black/70 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-28 h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-primary-400 transition-colors">
                        <span className="text-[10px] text-gray-400 font-semibold text-center px-2">Upload Sampul Depan</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCoverUpload(e, "depan")}
                          className="hidden"
                          disabled={isUploadingDepan}
                        />
                        {isUploadingDepan && <span className="text-[9px] text-primary-500 mt-1 animate-pulse">Mengupload...</span>}
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sampul Belakang</label>
                    {metaSampulBelakang ? (
                      <div className="relative w-28 h-36 rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                        <img src={metaSampulBelakang} alt="Sampul Belakang" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setMetaSampulBelakang("")}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold hover:bg-black/70 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-28 h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-primary-400 transition-colors">
                        <span className="text-[10px] text-gray-400 font-semibold text-center px-2">Upload Sampul Belakang</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCoverUpload(e, "belakang")}
                          className="hidden"
                          disabled={isUploadingBelakang}
                        />
                        {isUploadingBelakang && <span className="text-[9px] text-primary-500 mt-1 animate-pulse">Mengupload...</span>}
                      </label>
                    )}
                  </div>
                </div>
              </>
            )}

            {karyaForm.jenis === "hki" && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis HKI</label>
                  <input type="text" value={metaJenisHki} onChange={e => setMetaJenisHki(e.target.value)} className={inputCls} placeholder="Paten / Hak Cipta" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor Sertifikat</label>
                  <input type="text" value={metaNomorSertifikat} onChange={e => setMetaNomorSertifikat(e.target.value)} className={inputCls} placeholder="P00202312345" />
                </div>
              </>
            )}

            {karyaForm.jenis === "sertifikasi" && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Penyelenggara</label>
                  <input type="text" value={metaPenyelenggara} onChange={e => setMetaPenyelenggara(e.target.value)} className={inputCls} placeholder="Contoh: LSP Kelistrikan" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Link Sertifikat</label>
                  <input type="url" value={metaLinkSertifikat} onChange={e => setMetaLinkSertifikat(e.target.value)} className={inputCls} placeholder="https://drive.google.com/..." />
                </div>
              </>
            )}
          </div>

          {/* ===== Photo Upload ===== */}
          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Foto Dokumentasi (untuk Galeri Tridharma)</p>
            {fotoUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-3">
                {fotoUrls.map((url, i) => (
                  <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => handleRemovePhoto(i)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <HiOutlineTrash className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" id="karya-photo-upload" />
              <button type="button" onClick={() => photoInputRef.current?.click()} disabled={isUploadingPhoto}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50">
                <HiOutlinePhoto className="w-4 h-4" />
                {isUploadingPhoto ? "Mengupload..." : "Tambah Foto"}
              </button>
              {fotoUrls.length === 0 && <span className="text-xs text-gray-400">Belum ada foto</span>}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button type="button" onClick={() => setKaryaModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Batal</button>
            <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors">Simpan</button>
          </div>
        </form>
      </Modal>

      {/* Detail View Modal */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Detail Pengajuan Karya">
        {viewingKarya && (() => {
          const k = viewingKarya;
          const md = k.metadata || {};
          const metaVal = (key: string) => md[key] as any;
          const personList = (val: any): {id?: string; nama: string}[] => {
            if (!val) return [];
            return Array.isArray(val) ? val : [val];
          };

          return (
            <div className="space-y-5">
              {/* Header info */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Judul</p>
                <p className="text-base font-bold text-gray-900">{k.judul}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Dosen</p>
                  <p className="text-sm font-medium text-gray-800">{k.dosen?.nama || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Jenis</p>
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-700">{jenisLabels[k.jenis] || k.jenis}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tahun</p>
                  <p className="text-sm font-medium text-gray-800">{k.tahun}</p>
                </div>
              </div>

              {k.deskripsi && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Deskripsi</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100 leading-relaxed">{k.deskripsi}</p>
                </div>
              )}

              {/* Metadata details */}
              {k.metadata && Object.keys(k.metadata).length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Detail {jenisLabels[k.jenis] || k.jenis}</p>
                  <div className="space-y-3">
                    {metaVal("jurnal") && <div><span className="text-xs text-gray-500 font-medium">Jurnal:</span> <span className="text-sm text-gray-800">{metaVal("jurnal")}</span></div>}
                    {metaVal("link") && <div><span className="text-xs text-gray-500 font-medium">Link:</span> <a href={metaVal("link")} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline break-all">{metaVal("link")}</a></div>}
                    {metaVal("sumberDana") && <div><span className="text-xs text-gray-500 font-medium">Sumber Dana:</span> <span className="text-sm text-gray-800">{metaVal("sumberDana")}</span></div>}
                    {metaVal("mitra") && <div><span className="text-xs text-gray-500 font-medium">Mitra:</span> <span className="text-sm text-gray-800">{metaVal("mitra")}</span></div>}
                    {metaVal("penerbit") && <div><span className="text-xs text-gray-500 font-medium">Penerbit:</span> <span className="text-sm text-gray-800">{metaVal("penerbit")}</span></div>}
                    {metaVal("isbn") && <div><span className="text-xs text-gray-500 font-medium">ISBN:</span> <span className="text-sm text-gray-800">{metaVal("isbn")}</span></div>}
                    {metaVal("jenisHki") && <div><span className="text-xs text-gray-500 font-medium">Jenis HKI:</span> <span className="text-sm text-gray-800">{metaVal("jenisHki")}</span></div>}

                    {/* Sampul Buku Ajar */}
                    {(metaVal("sampul_depan") || metaVal("sampul_belakang")) && (
                      <div className="flex gap-4 mt-3 pb-2">
                        {metaVal("sampul_depan") && (
                          <div>
                            <span className="text-xs text-gray-500 font-medium block mb-1">Sampul Depan:</span>
                            <div className="w-20 h-28 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                              <img src={metaVal("sampul_depan")} alt="Sampul Depan" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                        {metaVal("sampul_belakang") && (
                          <div>
                            <span className="text-xs text-gray-500 font-medium block mb-1">Sampul Belakang:</span>
                            <div className="w-20 h-28 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                              <img src={metaVal("sampul_belakang")} alt="Sampul Belakang" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {metaVal("nomorSertifikat") && <div><span className="text-xs text-gray-500 font-medium">Nomor Sertifikat:</span> <span className="text-sm text-gray-800">{metaVal("nomorSertifikat")}</span></div>}
                    {metaVal("penyelenggara") && <div><span className="text-xs text-gray-500 font-medium">Penyelenggara:</span> <span className="text-sm text-gray-800">{metaVal("penyelenggara")}</span></div>}
                    {metaVal("linkSertifikat") && <div><span className="text-xs text-gray-500 font-medium">Link Sertifikat:</span> <a href={metaVal("linkSertifikat")} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline break-all">{metaVal("linkSertifikat")}</a></div>}

                    {personList(metaVal("penulis")).length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500 font-medium">Penulis:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">{personList(metaVal("penulis")).map((p, i) => <span key={i} className="px-2 py-0.5 rounded-lg text-xs bg-primary-50 text-primary-700 font-medium">{p.nama}</span>)}</div>
                      </div>
                    )}
                    {metaVal("ketua") && (
                      <div>
                        <span className="text-xs text-gray-500 font-medium">Ketua:</span>
                        <span className="ml-1 px-2 py-0.5 rounded-lg text-xs bg-primary-50 text-primary-700 font-medium">{(metaVal("ketua") as any).nama}</span>
                      </div>
                    )}
                    {personList(metaVal("anggota")).length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500 font-medium">Anggota:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">{personList(metaVal("anggota")).map((p, i) => <span key={i} className="px-2 py-0.5 rounded-lg text-xs bg-gray-100 text-gray-700 font-medium">{p.nama}</span>)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Photos */}
              {k.foto_urls && k.foto_urls.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Foto Dokumentasi ({k.foto_urls.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {k.foto_urls.map((url: string, i: number) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                        <img src={url} alt={`Foto ${i + 1}`} className="w-full h-28 object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end border-t border-gray-100">
                <button onClick={() => setDetailModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Tutup</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={() => { setConfirmOpen(false); confirmCallback.current?.(); confirmCallback.current = null; }}
        onCancel={() => { setConfirmOpen(false); confirmCallback.current = null; }}
        title={confirmTitle}
        message={confirmMsg}
        confirmLabel="OK"
        variant={confirmVariant}
      />
    </div>
  );
}
