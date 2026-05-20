"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/universal/Modal";
import PersonLinker from "@/components/universal/PersonLinker";
import { cachedFetch, invalidateCache } from "@/lib/fetchCache";
import type { PersonLink } from "@/components/universal/PersonLinker";
import { HiOutlineCheck, HiOutlineXMark, HiOutlineTrash, HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlinePlus, HiOutlinePencilSquare, HiOutlinePhoto, HiOutlineXCircle as HiXCircle } from "react-icons/hi2";
import { useRef } from "react";

interface PendingKarya {
  id: string;
  dosen_id: string;
  jenis: string;
  judul: string;
  tahun: number;
  deskripsi: string | null;
  metadata: Record<string, unknown> | null;
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
  const [pendingList, setPendingList] = useState<PendingKarya[]>([]);
  const [allKarya, setAllKarya] = useState<Karya[]>([]);
  const [dosenOptions, setDosenOptions] = useState<DosenOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [activeSection, setActiveSection] = useState<"pending" | "all">("pending");

  // CRUD modal state
  const [karyaModalOpen, setKaryaModalOpen] = useState(false);
  const [editingKaryaId, setEditingKaryaId] = useState<string | null>(null);
  const [karyaForm, setKaryaForm] = useState<Record<string, string | number>>({});
  const [fotoUrls, setFotoUrls] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  const resetMeta = () => {
    setMetaJurnal(""); setMetaLink(""); setMetaPenulis([]);
    setMetaSumberDana(""); setMetaKetua([]); setMetaAnggota([]);
    setMetaMitra(""); setMetaPenerbit(""); setMetaIsbn("");
    setMetaJenisHki(""); setMetaNomorSertifikat("");
    setMetaPenyelenggara(""); setMetaLinkSertifikat("");
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
      case "bukuAjar": return { penerbit: metaPenerbit, isbn: metaIsbn, penulis: metaPenulis };
      case "hki": return { jenisHki: metaJenisHki, nomorSertifikat: metaNomorSertifikat };
      case "sertifikasi": return { penyelenggara: metaPenyelenggara, linkSertifikat: metaLinkSertifikat };
      default: return {};
    }
  };

  const inputCls = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

  const fetchData = async () => {
    try {
      const [pendingRes, karyaRes, dosenRes] = await Promise.all([
        cachedFetch<PendingKarya[]>("/api/karya-pending"),
        cachedFetch<Karya[]>("/api/karya"),
        cachedFetch<DosenOption[]>("/api/dosen"),
      ]);
      if (pendingRes) setPendingList(pendingRes);
      if (karyaRes) setAllKarya(karyaRes);
      if (dosenRes) setDosenOptions(dosenRes);
    } catch (e) { console.error("Failed to fetch karya data", e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // ========== Pending actions ==========
  const handleApprove = async (id: string) => {
    if (!confirm("Setujui karya ini?")) return;
    const res = await fetch(`/api/karya-pending/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    if (res.ok) {
        invalidateCache("/api/karya-pending");
        invalidateCache("/api/karya");
        fetchData();
    }
  };

  const openRejectModal = (id: string) => { setRejectingId(id); setCatatan(""); setRejectModalOpen(true); };

  const handleReject = async () => {
    if (!rejectingId) return;
    const res = await fetch(`/api/karya-pending/${rejectingId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", catatan_admin: catatan || null }),
    });
    if (res.ok) { 
        invalidateCache("/api/karya-pending");
        setRejectModalOpen(false); 
        fetchData(); 
    }
  };

  const handleDeletePending = async (id: string) => {
    if (!confirm("Hapus pengajuan ini?")) return;
    const res = await fetch(`/api/karya-pending/${id}`, { method: "DELETE" });
    if (res.ok) {
        invalidateCache("/api/karya-pending");
        setPendingList(prev => prev.filter(k => k.id !== id));
    }
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

    if (editingKaryaId) {
      const res = await fetch(`/api/karya/${editingKaryaId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) { 
        invalidateCache("/api/karya");
        setKaryaModalOpen(false); 
        fetchData(); 
      }
    } else {
      const res = await fetch("/api/karya", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) { 
        invalidateCache("/api/karya");
        setKaryaModalOpen(false); 
        fetchData(); 
      }
    }
  };

  const handleDeleteKarya = async (id: string) => {
    if (!confirm("Hapus karya ini?")) return;
    const res = await fetch(`/api/karya/${id}`, { method: "DELETE" });
    if (res.ok) {
        invalidateCache("/api/karya");
        setAllKarya(prev => prev.filter(k => k.id !== id));
    }
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">Memuat data karya...</div>;

  const pendingOnly = pendingList.filter(k => k.status === "pending");
  const reviewedList = pendingList.filter(k => k.status !== "pending");

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
          {pendingOnly.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2"><HiOutlineClock className="w-5 h-5" /> Menunggu Persetujuan</h2>
              <div className="bg-white border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-amber-50 text-amber-800 font-semibold border-b border-amber-100">
                      <tr><th className="px-6 py-4">Dosen</th><th className="px-6 py-4">Judul</th><th className="px-6 py-4">Jenis</th><th className="px-6 py-4">Tahun</th><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4 text-right">Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {pendingOnly.map(k => (
                        <tr key={k.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="px-6 py-3 font-medium text-gray-900">{k.dosen?.nama || "—"}</td>
                          <td className="px-6 py-3 text-gray-900 max-w-xs truncate">{k.judul}</td>
                          <td className="px-6 py-3"><span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">{jenisLabels[k.jenis] || k.jenis}</span></td>
                          <td className="px-6 py-3">{k.tahun}</td>
                          <td className="px-6 py-3 text-xs text-gray-400">{new Date(k.created_at).toLocaleDateString("id-ID")}</td>
                          <td className="px-6 py-3 text-right space-x-1">
                            <button onClick={() => handleApprove(k.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-green-600 hover:bg-green-50 transition-colors" title="Setujui"><HiOutlineCheck className="w-5 h-5" /></button>
                            <button onClick={() => openRejectModal(k.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors" title="Tolak"><HiOutlineXMark className="w-5 h-5" /></button>
                            <button onClick={() => handleDeletePending(k.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors" title="Hapus"><HiOutlineTrash className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {pendingOnly.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">Tidak ada pengajuan yang menunggu persetujuan.</div>
          )}

          {reviewedList.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-gray-700 mb-3">Riwayat Review</h2>
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                      <tr><th className="px-6 py-4">Dosen</th><th className="px-6 py-4">Judul</th><th className="px-6 py-4">Jenis</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {reviewedList.map(k => {
                        const cfg = statusConfig[k.status];
                        const Icon = cfg.icon;
                        return (
                          <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-3 font-medium text-gray-900">{k.dosen?.nama || "—"}</td>
                            <td className="px-6 py-3 text-gray-900 max-w-xs truncate">{k.judul}</td>
                            <td className="px-6 py-3"><span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">{jenisLabels[k.jenis] || k.jenis}</span></td>
                            <td className="px-6 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${cfg.cls}`}><Icon className="w-3.5 h-3.5" />{cfg.label}</span></td>
                            <td className="px-6 py-3 text-right"><button onClick={() => handleDeletePending(k.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors" title="Hapus"><HiOutlineTrash className="w-4 h-4" /></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========== ALL KARYA TAB (with full CRUD) ========== */}
      {activeSection === "all" && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={handleOpenAddKarya}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm">
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
                  {allKarya.map(k => (
                    <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">{dosenOptions.find(d => d.id === k.dosen_id)?.nama || k.dosen_id}</td>
                      <td className="px-6 py-3 text-gray-900 max-w-xs truncate">{k.judul}</td>
                      <td className="px-6 py-3"><span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">{jenisLabels[k.jenis] || k.jenis}</span></td>
                      <td className="px-6 py-3">{k.tahun}</td>
                      <td className="px-6 py-3 text-right space-x-1">
                        <button onClick={() => handleOpenEditKarya(k)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors" title="Edit"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteKarya(k.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors" title="Hapus"><HiOutlineTrash className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {allKarya.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Belum ada data karya.</td></tr>}
                </tbody>
              </table>
            </div>
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
            <select required value={karyaForm.dosen_id || ""} onChange={e => setKaryaForm({ ...karyaForm, dosen_id: e.target.value })} className={inputCls}>
              <option value="" disabled>Pilih dosen...</option>
              {dosenOptions.map(d => <option key={d.id} value={d.id}>{d.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Karya</label>
            <textarea required rows={2} value={karyaForm.judul || ""} onChange={e => setKaryaForm({ ...karyaForm, judul: e.target.value })} className={inputCls + " resize-none"} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select required value={karyaForm.jenis || "publikasi"} onChange={e => setKaryaForm({ ...karyaForm, jenis: e.target.value })} className={inputCls}>
                <option value="publikasi">Publikasi</option><option value="penelitian">Penelitian</option><option value="pengabdian">Pengabdian</option>
                <option value="bukuAjar">Buku Ajar</option><option value="hki">HKI</option><option value="sertifikasi">Sertifikasi</option>
              </select>
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
    </div>
  );
}
