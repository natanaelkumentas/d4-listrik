"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "@/components/universal/Modal";
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineArrowUpTray, HiOutlineDocumentText } from "react-icons/hi2";
import { cachedFetch, invalidateCache } from "@/lib/fetchCache";

interface MataKuliah { kode: string; nama: string; sks: number; semester: number; jenis: string | null; }
interface Cpl { kode: string; deskripsi: string; }
interface KurikulumAktif { nama: string; deskripsi: string; berlaku_sejak: string; file_url: string | null; }
type Tab = "kurikulum" | "mataKuliah" | "cpl";

export default function AdminKurikulumPage() {
  const [activeTab, setActiveTab] = useState<Tab>("kurikulum");
  const [kurikulum, setKurikulum] = useState<KurikulumAktif>({ nama: "", deskripsi: "", berlaku_sejak: "", file_url: null });
  const [kurikulumSaved, setKurikulumSaved] = useState(false);
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
  const [isLoading, setIsLoading] = useState(true);
  const [isMkLoading, setIsMkLoading] = useState(false);
  const [isCplLoading, setIsCplLoading] = useState(false);
  const hasFetchedMK = useRef(false);
  const hasFetchedCPL = useRef(false);

  // Always fetch kurikulum aktif on mount
  useEffect(() => {
    const fetchKurikulum = async () => {
      try {
        const data = await cachedFetch<any>("/api/kurikulum");
        if (data) {
          setKurikulum({ nama: data.kurikulum?.nama || "", deskripsi: data.kurikulum?.deskripsi || "", berlaku_sejak: data.kurikulum?.berlaku_sejak || "", file_url: data.kurikulum?.file_url || null });
        }
      } catch (e) { console.error("Failed to fetch kurikulum", e); }
      finally { setIsLoading(false); }
    };
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

  // Lazy fetch CPL when tab is first accessed
  useEffect(() => {
    if (activeTab !== "cpl" || hasFetchedCPL.current) return;
    hasFetchedCPL.current = true;
    setIsCplLoading(true);
    cachedFetch<Cpl[]>("/api/cpl")
      .then(data => setCplList(data || []))
      .catch(e => console.error("Failed to fetch CPL", e))
      .finally(() => setIsCplLoading(false));
  }, [activeTab]);

  const handleKurikulumSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/kurikulum", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(kurikulum) });
    if (res.ok) { 
      invalidateCache("/api/kurikulum");
      setKurikulumSaved(true); 
      setTimeout(() => setKurikulumSaved(false), 3000); 
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
      }
    } catch (err) { console.error("Upload failed", err); }
    finally { setIsUploading(false); if (pdfInputRef.current) pdfInputRef.current.value = ""; }
  };

  const handleMkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mkEditingKode) {
      const res = await fetch(`/api/mata-kuliah/${encodeURIComponent(mkEditingKode)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mkForm) });
      if (res.ok) { 
        const u = await res.json(); 
        setMataKuliahList(prev => prev.map(m => m.kode === mkEditingKode ? u : m)); 
        invalidateCache("/api/mata-kuliah");
      }
    } else {
      const res = await fetch("/api/mata-kuliah", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mkForm) });
      if (res.ok) { 
        const c = await res.json(); 
        setMataKuliahList(prev => [...prev, c].sort((a, b) => a.semester - b.semester || a.kode.localeCompare(b.kode))); 
        invalidateCache("/api/mata-kuliah");
      }
    }
    setMkModalOpen(false);
  };

  const handleMkDelete = async (kode: string) => {
    if (!confirm("Hapus mata kuliah ini?")) return;
    const res = await fetch(`/api/mata-kuliah/${encodeURIComponent(kode)}`, { method: "DELETE" });
    if (res.ok) {
      setMataKuliahList(prev => prev.filter(m => m.kode !== kode));
      invalidateCache("/api/mata-kuliah");
    }
  };

  const handleCplSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cplEditingKode) {
      const res = await fetch(`/api/cpl/${encodeURIComponent(cplEditingKode)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deskripsi: cplForm.deskripsi }) });
      if (res.ok) { 
        const u = await res.json(); 
        setCplList(prev => prev.map(c => c.kode === cplEditingKode ? u : c)); 
        invalidateCache("/api/cpl");
      }
    } else {
      const res = await fetch("/api/cpl", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cplForm) });
      if (res.ok) { 
        const c = await res.json(); 
        setCplList(prev => [...prev, c].sort((a, b) => a.kode.localeCompare(b.kode))); 
        invalidateCache("/api/cpl");
      }
    }
    setCplModalOpen(false);
  };

  const handleCplDelete = async (kode: string) => {
    if (!confirm("Hapus CPL ini?")) return;
    const res = await fetch(`/api/cpl/${encodeURIComponent(kode)}`, { method: "DELETE" });
    if (res.ok) {
      setCplList(prev => prev.filter(c => c.kode !== kode));
      invalidateCache("/api/cpl");
    }
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">Memuat data kurikulum...</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "kurikulum", label: "Kurikulum Aktif" },
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
          {kurikulumSaved && <div className="p-4 rounded-xl bg-green-50 text-green-700 border border-green-100 font-medium text-sm animate-fade-in">Data kurikulum berhasil disimpan!</div>}
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

      {activeTab === "mataKuliah" && (
        <>
          {isMkLoading ? (
            <div className="text-center py-12 text-gray-400">Memuat data mata kuliah...</div>
          ) : (
          <>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setMkEditingKode(null); setMkForm({ kode: "", nama: "", sks: 2, semester: 1, jenis: "Teori" }); setMkModalOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm">
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
                  {mataKuliahList.map(mk => (
                    <tr key={mk.kode} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs font-bold text-primary-700">{mk.kode}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{mk.nama}</td>
                      <td className="px-6 py-3">{mk.sks}</td>
                      <td className="px-6 py-3">{mk.semester}</td>
                      <td className="px-6 py-3"><span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">{mk.jenis || "—"}</span></td>
                      <td className="px-6 py-3 text-right space-x-1">
                        <button onClick={() => { setMkEditingKode(mk.kode); setMkForm(mk); setMkModalOpen(true); }} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors" title="Edit"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                        <button onClick={() => handleMkDelete(mk.kode)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors" title="Hapus"><HiOutlineTrash className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {mataKuliahList.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Belum ada data mata kuliah.</td></tr>}
                </tbody>
              </table>
            </div>
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
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label><select value={mkForm.jenis || "Teori"} onChange={e => setMkForm({ ...mkForm, jenis: e.target.value })} className={inputCls}><option value="Teori">Teori</option><option value="Praktik">Praktik</option><option value="Teori & Praktik">Teori &amp; Praktik</option></select></div>
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
            <div className="text-center py-12 text-gray-400">Memuat data CPL...</div>
          ) : (
          <>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setCplEditingKode(null); setCplForm({ kode: "", deskripsi: "" }); setCplModalOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm">
              <HiOutlinePlus className="w-5 h-5" /> Tambah CPL
            </button>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                  <tr><th className="px-6 py-4 w-28">Kode</th><th className="px-6 py-4">Deskripsi</th><th className="px-6 py-4 text-right w-28">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cplList.map(cpl => (
                    <tr key={cpl.kode} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs font-bold text-primary-700">{cpl.kode}</td>
                      <td className="px-6 py-3 text-gray-900 text-sm leading-relaxed">{cpl.deskripsi}</td>
                      <td className="px-6 py-3 text-right space-x-1">
                        <button onClick={() => { setCplEditingKode(cpl.kode); setCplForm(cpl); setCplModalOpen(true); }} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors" title="Edit"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                        <button onClick={() => handleCplDelete(cpl.kode)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors" title="Hapus"><HiOutlineTrash className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {cplList.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">Belum ada data CPL.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <Modal isOpen={cplModalOpen} onClose={() => setCplModalOpen(false)} title={cplEditingKode ? "Edit CPL" : "Tambah CPL"}>
            <form onSubmit={handleCplSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Kode CPL</label><input type="text" required disabled={!!cplEditingKode} value={cplForm.kode || ""} onChange={e => setCplForm({ ...cplForm, kode: e.target.value })} className={cplEditingKode ? disabledInputCls : inputCls} placeholder="CPL-01" /></div>
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
    </div>
  );
}
