"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/universal/Modal";
import ConfirmDialog from "@/components/universal/ConfirmDialog";
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineArrowUpTray, HiOutlineDocumentText, HiOutlineMagnifyingGlass, HiOutlineXMark } from "react-icons/hi2";
import { cachedFetch, invalidateCache } from "@/lib/fetchCache";
import ComboBox from "@/components/universal/ComboBox";
import { useNotification } from "@/context/NotificationContext";
import TablePagination from "@/components/universal/TablePagination";

interface MataKuliah { kode: string; nama: string; sks: number; semester: number; jenis: string | null; deskripsi?: string | null; }
interface Cpl { kode: string; deskripsi: string; kategori?: string | null; }
interface CplKategori { id: number; nama: string; }
interface KurikulumAktif { nama: string; deskripsi: string; berlaku_sejak: string; file_url: string | null; }
interface VisiMisiRow {
  id: string;
  tipe: "visi" | "misi" | "tujuan";
  konten: string;
  urutan: number;
}
type Tab = "kurikulum" | "visimisi" | "mataKuliah" | "cpl";

export default function AdminKurikulumPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState<Tab>("kurikulum");
  const [kurikulum, setKurikulum] = useState<KurikulumAktif>({ nama: "", deskripsi: "", berlaku_sejak: "", file_url: null });
  const [isUploading, setIsUploading] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  const [mkModalOpen, setMkModalOpen] = useState(false);
  const [mkEditingKode, setMkEditingKode] = useState<string | null>(null);
  const [mkForm, setMkForm] = useState<Partial<MataKuliah>>({});
  const [cplList, setCplList] = useState<Cpl[]>([]);
  const [cplModalOpen, setCplModalOpen] = useState(false);
  const [cplEditingKode, setCplEditingKode] = useState<string | null>(null);
  const [cplForm, setCplForm] = useState<Partial<Cpl>>({});
  const [categories, setCategories] = useState<CplKategori[]>([]);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [isCatSubmitting, setIsCatSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMkLoading, setIsMkLoading] = useState(false);
  const [isCplLoading, setIsCplLoading] = useState(false);
  const [visiMisiList, setVisiMisiList] = useState<VisiMisiRow[]>([]);
  const [visiMisiModalOpen, setVisiMisiModalOpen] = useState(false);
  const [visiMisiEditingId, setVisiMisiEditingId] = useState<string | null>(null);
  const [visiMisiForm, setVisiMisiForm] = useState({
    tipe: "visi" as "visi" | "misi" | "tujuan",
    konten: "",
    urutan: 1,
  });
  const [isVisiMisiLoading, setIsVisiMisiLoading] = useState(false);
  const [isVisiMisiSubmitting, setIsVisiMisiSubmitting] = useState(false);
  const hasFetchedVisiMisi = useRef(false);

  // Search & Pagination States
  const [mkSearchQuery, setMkSearchQuery] = useState("");
  const [mkPage, setMkPage] = useState(1);
  const [mkPageSize, setMkPageSize] = useState(10);

  const [cplSearchQuery, setCplSearchQuery] = useState("");
  const [cplPage, setcplPage] = useState(1);
  const [cplPageSize, setCplPageSize] = useState(10);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");
  const confirmCallback = useRef<(() => void) | null>(null);

  const showConfirm = (title: string, message: string, onOk: () => void) => {
    setConfirmTitle(title);
    setConfirmMsg(message);
    confirmCallback.current = onOk;
    setConfirmOpen(true);
  };
  const hasFetchedMK = useRef(false);
  const hasFetchedCPL = useRef(false);

  const fetchKurikulum = async () => {
    try {
      const data = await cachedFetch<any>("/api/kurikulum");
      if (data) {
        setKurikulum({ nama: data.kurikulum?.nama || "", deskripsi: data.kurikulum?.deskripsi || "", berlaku_sejak: data.kurikulum?.berlaku_sejak || "", file_url: data.kurikulum?.file_url || null });
      }
    } catch (e) { console.error("Failed to fetch kurikulum", e); }
    finally { setIsLoading(false); }
  };

  // Always fetch kurikulum aktif on mount
  useEffect(() => {
    fetchKurikulum();
  }, []);

  // Lazy fetch mata kuliah when tab is first accessed
  useEffect(() => {
    if (activeTab !== "mataKuliah" || hasFetchedMK.current) return;
    hasFetchedMK.current = true;
    setIsMkLoading(true);
    cachedFetch<MataKuliah[]>("/api/mata-kuliah")
      .then(data => setMataKuliahList(data || []))
      .catch(e => console.error("Failed to fetch mata kuliah", e))
      .finally(() => setIsMkLoading(false));
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const data = await cachedFetch<CplKategori[]>("/api/cpl-kategori");
      if (data) setCategories(data);
    } catch (e) {
      console.error("Failed to fetch CPL categories", e);
    }
  };

  // Lazy fetch CPL when tab is first accessed
  useEffect(() => {
    if (activeTab !== "cpl" || hasFetchedCPL.current) return;
    hasFetchedCPL.current = true;
    setIsCplLoading(true);
    Promise.all([
      cachedFetch<Cpl[]>("/api/cpl"),
      fetchCategories()
    ])
      .then(([cplData]) => {
        if (cplData) setCplList(cplData);
      })
      .catch(e => console.error("Failed to fetch CPL data", e))
      .finally(() => setIsCplLoading(false));
  }, [activeTab]);

  const fetchVisiMisi = async () => {
    setIsVisiMisiLoading(true);
    try {
      const res = await fetch("/api/config?section=visi_misi_tujuan");
      const data = await res.json();
      if (data && data.visi_misi_tujuan) {
        const mapped = data.visi_misi_tujuan.map((row: any) => ({
          id: row.id,
          tipe: row.kategori,
          konten: row.konten,
          urutan: row.urutan,
        }));
        setVisiMisiList(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch Visi Misi", e);
    } finally {
      setIsVisiMisiLoading(false);
    }
  };

  // Lazy fetch Visi Misi when tab is first accessed
  useEffect(() => {
    if (activeTab !== "visimisi" || hasFetchedVisiMisi.current) return;
    hasFetchedVisiMisi.current = true;
    fetchVisiMisi();
  }, [activeTab]);

  const handleKurikulumSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/kurikulum", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(kurikulum) });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan kurikulum");
      }
      invalidateCache("/api/kurikulum");
      await fetchKurikulum();
      showSuccess("Data kurikulum berhasil disimpan!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Gagal menyimpan data.");
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/kurikulum", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setKurikulum(prev => ({ ...prev, file_url: data.url }));
        invalidateCache("/api/kurikulum");
        await fetchKurikulum();
        showSuccess("Dokumen PDF berhasil diupload!");
        router.refresh();
      } else {
        const err = await res.json();
        showError(err.error || "Gagal mengupload PDF.");
      }
    } catch (err: any) {
      showError(err.message || "Gagal mengupload PDF.");
    } finally {
      setIsUploading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  const handleMkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mkEditingKode) {
        const res = await fetch(`/api/mata-kuliah/${encodeURIComponent(mkEditingKode)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mkForm) });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal mengubah mata kuliah");
        }
        const u = await res.json(); 
        setMataKuliahList(prev => prev.map(m => m.kode === mkEditingKode ? u : m)); 
        invalidateCache("/api/mata-kuliah");
      } else {
        const res = await fetch("/api/mata-kuliah", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mkForm) });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal membuat mata kuliah");
        }
        const c = await res.json(); 
        setMataKuliahList(prev => [...prev, c].sort((a, b) => a.semester - b.semester || a.kode.localeCompare(b.kode))); 
        invalidateCache("/api/mata-kuliah");
      }
      setMkModalOpen(false);
      showSuccess("Mata kuliah berhasil disimpan!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Gagal menyimpan mata kuliah");
    }
  };

  const handleMkDelete = async (kode: string) => {
    showConfirm("Hapus Mata Kuliah", "Hapus mata kuliah ini? Tindakan ini tidak dapat dibatalkan.", async () => {
      try {
        const res = await fetch(`/api/mata-kuliah/${encodeURIComponent(kode)}`, { method: "DELETE" });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal menghapus mata kuliah");
        }
        setMataKuliahList(prev => prev.filter(m => m.kode !== kode));
        invalidateCache("/api/mata-kuliah");
        showSuccess("Mata kuliah berhasil dihapus!");
        router.refresh();
      } catch (err: any) {
        showError(err.message || "Terjadi kesalahan");
      }
    });
  };

  const handleCplSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (cplEditingKode) {
        const res = await fetch(`/api/cpl/${encodeURIComponent(cplEditingKode)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deskripsi: cplForm.deskripsi, kategori: cplForm.kategori }) });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal mengubah CPL");
        }
        const u = await res.json(); 
        setCplList(prev => prev.map(c => c.kode === cplEditingKode ? u : c)); 
        invalidateCache("/api/cpl");
      } else {
        const res = await fetch("/api/cpl", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cplForm) });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal membuat CPL");
        }
        const c = await res.json(); 
        setCplList(prev => [...prev, c].sort((a, b) => a.kode.localeCompare(b.kode))); 
        invalidateCache("/api/cpl");
      }
      setCplModalOpen(false);
      showSuccess("CPL berhasil disimpan!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Gagal menyimpan CPL");
    }
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setIsCatSubmitting(true);
    try {
      const res = await fetch("/api/cpl-kategori", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: catName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal membuat kategori");
      }
      invalidateCache("/api/cpl-kategori");
      await fetchCategories();
      setCatModalOpen(false);
      setCatName("");
      showSuccess("Kategori CPL baru berhasil ditambahkan!");
    } catch (err: any) {
      showError(err.message || "Gagal menambahkan kategori");
    } finally {
      setIsCatSubmitting(false);
    }
  };

  const handleCplDelete = async (kode: string) => {
    showConfirm("Hapus CPL", "Hapus CPL ini? Tindakan ini tidak dapat dibatalkan.", async () => {
      try {
        const res = await fetch(`/api/cpl/${encodeURIComponent(kode)}`, { method: "DELETE" });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal menghapus CPL");
        }
        setCplList(prev => prev.filter(c => c.kode !== kode));
        invalidateCache("/api/cpl");
        showSuccess("CPL berhasil dihapus!");
        router.refresh();
      } catch (err: any) {
        showError(err.message || "Terjadi kesalahan");
      }
    });
  };

  const getNextVisiMisiUrutan = (tipe: "visi" | "misi" | "tujuan") => {
    const items = visiMisiList.filter((item) => item.tipe === tipe);
    if (items.length === 0) return 1;
    return Math.max(...items.map((i) => i.urutan)) + 1;
  };

  const handleOpenVisiMisiAddType = (tipe: "visi" | "misi" | "tujuan") => {
    setVisiMisiEditingId(null);
    setVisiMisiForm({
      tipe,
      konten: "",
      urutan: getNextVisiMisiUrutan(tipe),
    });
    setVisiMisiModalOpen(true);
  };

  const handleOpenVisiMisiEdit = (row: VisiMisiRow) => {
    setVisiMisiEditingId(row.id);
    setVisiMisiForm({
      tipe: row.tipe,
      konten: row.konten,
      urutan: row.urutan,
    });
    setVisiMisiModalOpen(true);
  };

  const handleVisiMisiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVisiMisiSubmitting(true);
    try {
      let url = "/api/config";
      let method = "POST";
      let payload: any = { section: "visi_misi_tujuan" };

      let dataToSubmit: any = {
        kategori: visiMisiForm.tipe,
        konten: visiMisiForm.konten,
        urutan: visiMisiForm.urutan,
      };

      if (visiMisiEditingId) {
        method = "PUT";
        dataToSubmit.id = visiMisiEditingId;
      }

      payload.data = dataToSubmit;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan data");
      }

      invalidateCache("/api/config");
      setVisiMisiModalOpen(false);
      await fetchVisiMisi();
      showSuccess("Data visi/misi/tujuan berhasil disimpan!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan.");
    } finally {
      setIsVisiMisiSubmitting(false);
    }
  };

  const handleVisiMisiDelete = async (id: string) => {
    showConfirm("Hapus Visi/Misi/Tujuan", "Hapus item ini? Tindakan ini tidak dapat dibatalkan.", async () => {
      try {
        const res = await fetch(`/api/config?section=visi_misi_tujuan&id=${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Gagal menghapus");
        }

        invalidateCache("/api/config");
        await fetchVisiMisi();
        showSuccess("Item berhasil dihapus!");
        router.refresh();
      } catch (err: any) {
        showError(err.message || "Terjadi kesalahan");
      }
    });
  };

  const filteredMataKuliah = mataKuliahList.filter((mk) => {
    const q = mkSearchQuery.toLowerCase();
    return (
      mk.kode.toLowerCase().includes(q) ||
      mk.nama.toLowerCase().includes(q) ||
      (mk.jenis || "").toLowerCase().includes(q) ||
      String(mk.sks).includes(q) ||
      String(mk.semester).includes(q)
    );
  });
  const totalMkEntries = filteredMataKuliah.length;
  const totalMkPages = Math.ceil(totalMkEntries / mkPageSize);
  const paginatedMataKuliah = filteredMataKuliah.slice(
    (mkPage - 1) * mkPageSize,
    mkPage * mkPageSize
  );

  const filteredCpl = cplList.filter((cpl) => {
    const q = cplSearchQuery.toLowerCase();
    return cpl.kode.toLowerCase().includes(q) || cpl.deskripsi.toLowerCase().includes(q);
  });
  const totalCplEntries = filteredCpl.length;
  const totalCplPages = Math.ceil(totalCplEntries / cplPageSize);
  const paginatedCpl = filteredCpl.slice(
    (cplPage - 1) * cplPageSize,
    cplPage * cplPageSize
  );

  if (isLoading) return <div className="text-center py-12 text-gray-400 font-medium animate-pulse">Loading Kurikulum...</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "kurikulum", label: "Kurikulum Aktif" },
    { key: "visimisi", label: "Visi, Misi & Tujuan" },
    { key: "mataKuliah", label: hasFetchedMK.current ? `Mata Kuliah (${mataKuliahList.length})` : "Mata Kuliah" },
    { key: "cpl", label: hasFetchedCPL.current ? `CPL (${cplList.length})` : "CPL" },
  ];

  const inputCls = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";
  const disabledInputCls = "w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm cursor-not-allowed";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Manajemen Kurikulum</h1>
      <p className="text-gray-500 text-sm mb-6">Kelola data kurikulum, mata kuliah, dan capaian pembelajaran.</p>

      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors ${activeTab === tab.key ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "kurikulum" && (
        <form onSubmit={handleKurikulumSave} className="space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kurikulum</label>
            <input type="text" required value={kurikulum.nama} onChange={e => setKurikulum({ ...kurikulum, nama: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea rows={4} value={kurikulum.deskripsi} onChange={e => setKurikulum({ ...kurikulum, deskripsi: e.target.value })} className={inputCls + " resize-none"} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku Sejak</label>
            <input type="text" value={kurikulum.berlaku_sejak} onChange={e => setKurikulum({ ...kurikulum, berlaku_sejak: e.target.value })} className={inputCls} placeholder="Tahun Akademik 2022/2023" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dokumen PDF Kurikulum</label>
            {kurikulum.file_url && (
              <div className="flex items-center gap-2 mb-3">
                <a href={kurikulum.file_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition-colors">
                  <HiOutlineDocumentText className="w-5 h-5" /> Lihat PDF Saat Ini
                </a>
                <button
                  type="button"
                  onClick={() => setKurikulum(prev => ({ ...prev, file_url: null }))}
                  className="inline-flex items-center justify-center p-2 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                  title="Hapus dokumen PDF"
                >
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" id="pdf-upload" />
              <button type="button" onClick={() => pdfInputRef.current?.click()} disabled={isUploading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50">
                <HiOutlineArrowUpTray className="w-4 h-4" />
                {isUploading ? "Mengupload..." : kurikulum.file_url ? "Ganti PDF" : "Upload PDF"}
              </button>
              {!kurikulum.file_url && <span className="text-xs text-gray-400">Belum ada dokumen</span>}
            </div>
          </div>
          <div className="pt-6 border-t border-gray-100">
            <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm">Simpan Perubahan</button>
          </div>
        </form>
      )}

      {activeTab === "visimisi" && (
        <>
          {isVisiMisiLoading ? (
            <div className="text-center py-12 text-gray-400 font-medium animate-pulse">Loading Visi, Misi &amp; Tujuan...</div>
          ) : (() => {
            const visiItems = visiMisiList.filter((item) => item.tipe === "visi").sort((a, b) => a.urutan - b.urutan);
            const misiItems = visiMisiList.filter((item) => item.tipe === "misi").sort((a, b) => a.urutan - b.urutan);
            const tujuanItems = visiMisiList.filter((item) => item.tipe === "tujuan").sort((a, b) => a.urutan - b.urutan);

            return (
              <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* TABEL VISI */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                      <div>
                        <h4 className="font-bold text-primary-950 text-base">Visi Program Studi</h4>
                        <p className="text-gray-500 text-xs mt-0.5">Visi utama program studi.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenVisiMisiAddType("visi")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                      >
                        <HiOutlinePlus className="w-3.5 h-3.5" /> Tambah Visi
                      </button>
                    </div>

                    <div className="overflow-hidden border border-gray-100 rounded-xl">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-primary-50/30">
                            <th className="text-left px-4 py-2.5 font-bold text-primary-900 w-16">No</th>
                            <th className="text-left px-4 py-2.5 font-bold text-primary-900">Konten / Uraian</th>
                            <th className="text-right px-4 py-2.5 font-bold text-primary-900 w-24">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visiItems.map((item, idx) => (
                            <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50/20">
                              <td className="px-4 py-3 text-gray-500 font-medium">{idx + 1}</td>
                              <td className="px-4 py-3 text-gray-700 leading-relaxed text-xs sm:text-sm">{item.konten}</td>
                              <td className="px-4 py-3 text-right space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenVisiMisiEdit(item)}
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 cursor-pointer"
                                >
                                  <HiOutlinePencilSquare className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleVisiMisiDelete(item.id)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                                >
                                  <HiOutlineTrash className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {visiItems.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">
                                Belum ada data visi.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* TABEL MISI */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                      <div>
                        <h4 className="font-bold text-primary-950 text-base">Misi Program Studi</h4>
                        <p className="text-gray-500 text-xs mt-0.5">Daftar misi program studi.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenVisiMisiAddType("misi")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                      >
                        <HiOutlinePlus className="w-3.5 h-3.5" /> Tambah Misi
                      </button>
                    </div>

                    <div className="overflow-hidden border border-gray-100 rounded-xl">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-primary-50/30">
                            <th className="text-left px-4 py-2.5 font-bold text-primary-900 w-16">No</th>
                            <th className="text-left px-4 py-2.5 font-bold text-primary-900">Konten / Uraian</th>
                            <th className="text-right px-4 py-2.5 font-bold text-primary-900 w-24">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {misiItems.map((item, idx) => (
                            <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50/20">
                              <td className="px-4 py-3 text-gray-500 font-medium">{idx + 1}</td>
                              <td className="px-4 py-3 text-gray-700 leading-relaxed text-xs sm:text-sm">{item.konten}</td>
                              <td className="px-4 py-3 text-right space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenVisiMisiEdit(item)}
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 cursor-pointer"
                                >
                                  <HiOutlinePencilSquare className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleVisiMisiDelete(item.id)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                                >
                                  <HiOutlineTrash className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {misiItems.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">
                                Belum ada data misi.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* TABEL TUJUAN */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                      <div>
                        <h4 className="font-bold text-primary-950 text-base">Tujuan Program Studi</h4>
                        <p className="text-gray-500 text-xs mt-0.5">Daftar tujuan program studi.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenVisiMisiAddType("tujuan")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                      >
                        <HiOutlinePlus className="w-3.5 h-3.5" /> Tambah Tujuan
                      </button>
                    </div>

                    <div className="overflow-hidden border border-gray-100 rounded-xl">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-primary-50/30">
                            <th className="text-left px-4 py-2.5 font-bold text-primary-900 w-16">No</th>
                            <th className="text-left px-4 py-2.5 font-bold text-primary-900">Konten / Uraian</th>
                            <th className="text-right px-4 py-2.5 font-bold text-primary-900 w-24">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tujuanItems.map((item, idx) => (
                            <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50/20">
                              <td className="px-4 py-3 text-gray-500 font-medium">{idx + 1}</td>
                              <td className="px-4 py-3 text-gray-700 leading-relaxed text-xs sm:text-sm">{item.konten}</td>
                              <td className="px-4 py-3 text-right space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenVisiMisiEdit(item)}
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 cursor-pointer"
                                >
                                  <HiOutlinePencilSquare className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleVisiMisiDelete(item.id)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                                >
                                  <HiOutlineTrash className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {tujuanItems.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">
                                Belum ada data tujuan.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {activeTab === "mataKuliah" && (
        <>
          {isMkLoading ? (
            <div className="text-center py-12 text-gray-400 font-medium animate-pulse">Loading Mata Kuliah...</div>
          ) : (
          <>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div className="relative max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <HiOutlineMagnifyingGlass className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Cari mata kuliah..."
                value={mkSearchQuery}
                onChange={e => { setMkSearchQuery(e.target.value); setMkPage(1); }}
                className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-900"
              />
              {mkSearchQuery && (
                <button onClick={() => { setMkSearchQuery(""); setMkPage(1); }} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600">
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
              )}
            </div>
            <button onClick={() => { setMkEditingKode(null); setMkForm({ kode: "", nama: "", sks: 2, semester: 1, jenis: "Teori" }); setMkModalOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm cursor-pointer w-full sm:w-auto justify-center">
              <HiOutlinePlus className="w-5 h-5" /> Tambah Mata Kuliah
            </button>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                  <tr><th className="px-6 py-4">Kode</th><th className="px-6 py-4">Nama</th><th className="px-6 py-4">SKS</th><th className="px-6 py-4">Smt</th><th className="px-6 py-4">Jenis</th><th className="px-6 py-4 text-right">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedMataKuliah.map(mk => (
                    <tr key={mk.kode} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs font-bold text-primary-700">{mk.kode}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{mk.nama}</td>
                      <td className="px-6 py-3">{mk.sks}</td>
                      <td className="px-6 py-3">{mk.semester}</td>
                      <td className="px-6 py-3"><span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">{mk.jenis || "—"}</span></td>
                      <td className="px-6 py-3 text-right space-x-1">
                        <button onClick={() => { setMkEditingKode(mk.kode); setMkForm(mk); setMkModalOpen(true); }} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer" title="Edit"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                        <button onClick={() => handleMkDelete(mk.kode)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Hapus"><HiOutlineTrash className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredMataKuliah.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Tidak ada data mata kuliah.</td></tr>}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={mkPage}
              totalPages={totalMkPages}
              totalEntries={totalMkEntries}
              pageSize={mkPageSize}
              onPageChange={setMkPage}
              onPageSizeChange={size => { setMkPageSize(size); setMkPage(1); }}
            />
          </div>
          <Modal isOpen={mkModalOpen} onClose={() => setMkModalOpen(false)} title={mkEditingKode ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}>
            <form onSubmit={handleMkSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Kode</label><input type="text" required disabled={!!mkEditingKode} value={mkForm.kode || ""} onChange={e => setMkForm({ ...mkForm, kode: e.target.value })} className={mkEditingKode ? disabledInputCls : inputCls} placeholder="TL101" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama</label><input type="text" required value={mkForm.nama || ""} onChange={e => setMkForm({ ...mkForm, nama: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">SKS</label><input type="number" required min={1} max={8} value={mkForm.sks || ""} onChange={e => setMkForm({ ...mkForm, sks: Number(e.target.value) })} className={inputCls} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Semester</label><input type="number" required min={1} max={8} value={mkForm.semester || ""} onChange={e => setMkForm({ ...mkForm, semester: Number(e.target.value) })} className={inputCls} /></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                  <ComboBox
                    options={[
                      { id: "Teori", nama: "Teori" },
                      { id: "Praktik", nama: "Praktik" },
                      { id: "Teori & Praktik", nama: "Teori & Praktik" }
                    ]}
                    value={mkForm.jenis || "Teori"}
                    onChange={val => setMkForm({ ...mkForm, jenis: val })}
                    placeholder="Pilih Jenis..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea rows={3} value={mkForm.deskripsi || ""} onChange={e => setMkForm({ ...mkForm, deskripsi: e.target.value })} className={inputCls + " resize-none"} placeholder="Masukkan deskripsi mata kuliah..." />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setMkModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors">Simpan</button>
              </div>
            </form>
          </Modal>
          </>)}
        </>
      )}

      {activeTab === "cpl" && (
        <>
          {isCplLoading ? (
            <div className="text-center py-12 text-gray-400 font-medium animate-pulse">Loading CPL...</div>
          ) : (
          <>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div className="relative max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <HiOutlineMagnifyingGlass className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Cari CPL..."
                value={cplSearchQuery}
                onChange={e => { setCplSearchQuery(e.target.value); setcplPage(1); }}
                className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-900"
              />
              {cplSearchQuery && (
                <button onClick={() => { setCplSearchQuery(""); setcplPage(1); }} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600">
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => { setCatModalOpen(true); setCatName(""); }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 bg-white rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm cursor-pointer justify-center w-full sm:w-auto">
                <HiOutlinePlus className="w-5 h-5 text-gray-400" /> Kategori CPL
              </button>
              <button onClick={() => { setCplEditingKode(null); setCplForm({ kode: "", deskripsi: "", kategori: "" }); setCplModalOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm cursor-pointer justify-center w-full sm:w-auto">
                <HiOutlinePlus className="w-5 h-5" /> Tambah CPL
              </button>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 w-28">Kode</th>
                    <th className="px-6 py-4 w-40">Kategori</th>
                    <th className="px-6 py-4">Deskripsi</th>
                    <th className="px-6 py-4 text-right w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedCpl.map(cpl => (
                    <tr key={cpl.kode} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs font-bold text-primary-700">{cpl.kode}</td>
                      <td className="px-6 py-3">
                        {cpl.kategori ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-primary-50 text-primary-700 border border-primary-100">
                            {cpl.kategori}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-900 text-sm leading-relaxed">{cpl.deskripsi}</td>
                      <td className="px-6 py-3 text-right space-x-1">
                        <button onClick={() => { setCplEditingKode(cpl.kode); setCplForm(cpl); setCplModalOpen(true); }} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer" title="Edit"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                        <button onClick={() => handleCplDelete(cpl.kode)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Hapus"><HiOutlineTrash className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredCpl.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Tidak ada data CPL.</td></tr>}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={cplPage}
              totalPages={totalCplPages}
              totalEntries={totalCplEntries}
              pageSize={cplPageSize}
              onPageChange={setcplPage}
              onPageSizeChange={size => { setCplPageSize(size); setcplPage(1); }}
            />
          </div>
          <Modal isOpen={cplModalOpen} onClose={() => setCplModalOpen(false)} title={cplEditingKode ? "Edit CPL" : "Tambah CPL"}>
            <form onSubmit={handleCplSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Kode CPL</label><input type="text" required disabled={!!cplEditingKode} value={cplForm.kode || ""} onChange={e => setCplForm({ ...cplForm, kode: e.target.value })} className={cplEditingKode ? disabledInputCls : inputCls} placeholder="CPL-01" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori CPL (opsional)</label>
                <ComboBox
                  options={categories.map(c => ({ id: c.nama, nama: c.nama }))}
                  value={cplForm.kategori || ""}
                  onChange={val => setCplForm({ ...cplForm, kategori: val })}
                  placeholder="Pilih Kategori CPL..."
                />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label><textarea required rows={4} value={cplForm.deskripsi || ""} onChange={e => setCplForm({ ...cplForm, deskripsi: e.target.value })} className={inputCls + " resize-none"} /></div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setCplModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors">Simpan</button>
              </div>
            </form>
          </Modal>
          </>)}
        </>
      )}

      <Modal
        isOpen={visiMisiModalOpen}
        onClose={() => setVisiMisiModalOpen(false)}
        title={
          visiMisiEditingId
            ? `Edit ${visiMisiForm.tipe === "visi" ? "Visi" : visiMisiForm.tipe === "misi" ? "Misi" : "Tujuan"}`
            : `Tambah ${visiMisiForm.tipe === "visi" ? "Visi" : visiMisiForm.tipe === "misi" ? "Misi" : "Tujuan"}`
        }
      >
        <form onSubmit={handleVisiMisiSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Uraian / Teks</label>
            <textarea
              rows={4}
              required
              value={visiMisiForm.konten}
              onChange={(e) => setVisiMisiForm({ ...visiMisiForm, konten: e.target.value })}
              className={inputCls + " resize-none"}
              placeholder={`Masukkan konten ${visiMisiForm.tipe}...`}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={() => setVisiMisiModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              disabled={isVisiMisiSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isVisiMisiSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isVisiMisiSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={catModalOpen} onClose={() => setCatModalOpen(false)} title="Tambah Kategori CPL">
        <form onSubmit={handleCatSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Kategori</label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className={inputCls}
              placeholder="Contoh: Sikap, Keterampilan Umum"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={() => setCatModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              disabled={isCatSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCatSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              {isCatSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={() => { setConfirmOpen(false); confirmCallback.current?.(); confirmCallback.current = null; }}
        onCancel={() => { setConfirmOpen(false); confirmCallback.current = null; }}
        title={confirmTitle}
        message={confirmMsg}
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  );
}
