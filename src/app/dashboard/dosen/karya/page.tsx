"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Dosen, KaryaItem } from "@/data/dosen";
import Modal from "@/components/universal/Modal";
import PersonLinker from "@/components/universal/PersonLinker";
import { cachedFetch, invalidateCache } from "@/lib/fetchCache";
import type { PersonLink } from "@/components/universal/PersonLinker";
import { HiOutlinePlus, HiOutlineTrash, HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlinePhoto } from "react-icons/hi2";
import { useRef } from "react";

interface PendingKarya {
  id: string;
  jenis: string;
  judul: string;
  tahun: number;
  status: "pending" | "approved" | "rejected";
  catatan_admin: string | null;
  created_at: string;
}

const statusConfig = {
  pending: { label: "Menunggu Approval", cls: "bg-amber-100 text-amber-700", icon: HiOutlineClock },
  approved: { label: "Disetujui", cls: "bg-green-100 text-green-700", icon: HiOutlineCheckCircle },
  rejected: { label: "Ditolak", cls: "bg-red-100 text-red-700", icon: HiOutlineXCircle },
};

const jenisLabels: Record<string, string> = {
  publikasi: "Publikasi", penelitian: "Penelitian", pengabdian: "Pengabdian",
  bukuAjar: "Buku Ajar", hki: "HKI", sertifikasi: "Sertifikasi",
};

export default function DosenKaryaPage() {
  const { user } = useAuth();
  const { dosenList, ensureDosenLoaded } = useData();
  const [dosen, setDosen] = useState<Dosen | null>(null);
  const [pendingList, setPendingList] = useState<PendingKarya[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string | number>>({ jenis: "publikasi" });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [dosenOptions, setDosenOptions] = useState<{id: string; nama: string}[]>([]);

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
  const [fotoUrls, setFotoUrls] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const resetMeta = () => {
    setMetaJurnal(""); setMetaLink(""); setMetaPenulis([]);
    setMetaSumberDana(""); setMetaKetua([]); setMetaAnggota([]);
    setMetaMitra(""); setMetaPenerbit(""); setMetaIsbn("");
    setMetaJenisHki(""); setMetaNomorSertifikat("");
    setMetaPenyelenggara(""); setMetaLinkSertifikat("");
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

  useEffect(() => {
    ensureDosenLoaded();
  }, [ensureDosenLoaded]);

  useEffect(() => {
    if (user && user.role === "dosen") {
      const d = dosenList.find((d) => d.nidn === user.nidn);
      if (d) setDosen(d);
    }
  }, [user, dosenList]);

  // Fetch pending submissions + dosen options
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pendingRes, dosenRes] = await Promise.all([
          cachedFetch<PendingKarya[]>("/api/karya-pending"),
          cachedFetch<any[]>("/api/dosen"),
        ]);
        if (pendingRes) setPendingList(pendingRes);
        if (dosenRes) {
          setDosenOptions(dosenRes.map((d: {id: string; nama: string}) => ({ id: d.id, nama: d.nama })));
        }
      } catch (e) { console.error("Failed to fetch data", e); }
    };
    if (user) fetchData();
  }, [user, submitSuccess]);

  if (!user || user.role !== "dosen" || !dosen) return null;

  const allKarya = Object.values(dosen.karya || {}).flat() as KaryaItem[];

  const handleOpenAdd = () => {
    setFormData({ judul: "", jenis: "publikasi", tahun: new Date().getFullYear(), deskripsi: "" });
    resetMeta();
    setFotoUrls([]);
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingPhoto(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append("file", files[i]);
        fd.append("jenis", (formData.jenis as string) || "karya");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const jenis = formData.jenis as string;
      const res = await fetch("/api/karya-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dosen_id: dosen.id,
          jenis,
          judul: formData.judul,
          tahun: Number(formData.tahun),
          deskripsi: formData.deskripsi || null,
          metadata: buildMetadata(jenis),
          foto_urls: fotoUrls,
        }),
      });

      if (res.ok) {
        invalidateCache("/api/karya-pending");
        setIsModalOpen(false);
        setSubmitSuccess(prev => !prev);
      }
    } catch (e) { console.error("Failed to submit karya", e); }
  };

  const handleDeletePending = async (id: string) => {
    if (!confirm("Batalkan pengajuan ini?")) return;
    const res = await fetch(`/api/karya-pending/${id}`, { method: "DELETE" });
    if (res.ok) {
        invalidateCache("/api/karya-pending");
        setPendingList(prev => prev.filter(k => k.id !== id));
    }
  };

  const pendingOnly = pendingList.filter(k => k.status === "pending");
  const reviewedList = pendingList.filter(k => k.status !== "pending");

  const inputCls = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Karya & Kontribusi</h1>
          <p className="text-gray-500 text-sm">Ajukan karya baru untuk disetujui oleh admin.</p>
        </div>
        <button onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm">
          <HiOutlinePlus className="w-5 h-5" /> Ajukan Karya
        </button>
      </div>

      {/* Pending Submissions */}
      {pendingOnly.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold text-amber-700 mb-3 flex items-center gap-2"><HiOutlineClock className="w-5 h-5" /> Menunggu Persetujuan ({pendingOnly.length})</h2>
          <div className="bg-white border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-amber-50 text-amber-800 font-semibold border-b border-amber-100">
                  <tr><th className="px-6 py-4">Judul</th><th className="px-6 py-4">Kategori</th><th className="px-6 py-4">Tahun</th><th className="px-6 py-4">Tanggal Ajuan</th><th className="px-6 py-4 text-right">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {pendingOnly.map(k => (
                    <tr key={k.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900 max-w-xs truncate">{k.judul}</td>
                      <td className="px-6 py-3"><span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">{jenisLabels[k.jenis] || k.jenis}</span></td>
                      <td className="px-6 py-3">{k.tahun}</td>
                      <td className="px-6 py-3 text-xs text-gray-400">{new Date(k.created_at).toLocaleDateString("id-ID")}</td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => handleDeletePending(k.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors" title="Batalkan"><HiOutlineTrash className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reviewed (approved/rejected) */}
      {reviewedList.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold text-gray-700 mb-3">Riwayat Pengajuan</h2>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                  <tr><th className="px-6 py-4">Judul</th><th className="px-6 py-4">Jenis</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Catatan</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reviewedList.map(k => {
                    const cfg = statusConfig[k.status];
                    const Icon = cfg.icon;
                    return (
                      <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3 font-medium text-gray-900 max-w-xs truncate">{k.judul}</td>
                        <td className="px-6 py-3"><span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">{jenisLabels[k.jenis] || k.jenis}</span></td>
                        <td className="px-6 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${cfg.cls}`}><Icon className="w-3.5 h-3.5" />{cfg.label}</span></td>
                        <td className="px-6 py-3 text-xs text-gray-500">{k.catatan_admin || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Approved Karya (from karya table) */}
      <h2 className="text-base font-bold text-gray-700 mb-3">Karya Terpublikasi ({allKarya.length})</h2>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
              <tr><th className="px-6 py-4">Judul</th><th className="px-6 py-4">Kategori</th><th className="px-6 py-4">Tahun</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allKarya.map(k => (
                <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 max-w-md truncate">{k.judul}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">{jenisLabels[k.jenis] || k.jenis}</span></td>
                  <td className="px-6 py-4">{k.tahun}</td>
                </tr>
              ))}
              {allKarya.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">Belum ada karya terpublikasi.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajukan Karya Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Karya</label>
            <textarea required rows={2} value={formData.judul || ""} onChange={e => setFormData({ ...formData, judul: e.target.value })} className={inputCls + " resize-none"} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select required value={formData.jenis || "publikasi"} onChange={e => setFormData({ ...formData, jenis: e.target.value })} className={inputCls}>
                <option value="publikasi">Publikasi</option><option value="penelitian">Penelitian</option><option value="pengabdian">Pengabdian</option>
                <option value="bukuAjar">Buku Ajar</option><option value="hki">HKI</option><option value="sertifikasi">Sertifikasi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
              <input type="number" required value={formData.tahun || ""} onChange={e => setFormData({ ...formData, tahun: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (opsional)</label>
            <textarea rows={2} value={formData.deskripsi || ""} onChange={e => setFormData({ ...formData, deskripsi: e.target.value })} className={inputCls + " resize-none"} />
          </div>

          {/* ===== Jenis-specific metadata fields ===== */}
          <div className="border-t border-gray-100 pt-4 mt-2 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Detail {jenisLabels[formData.jenis as string] || ""}</p>

            {formData.jenis === "publikasi" && (
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

            {formData.jenis === "penelitian" && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Sumber Dana</label>
                  <input type="text" value={metaSumberDana} onChange={e => setMetaSumberDana(e.target.value)} className={inputCls} placeholder="Contoh: Kemendikbud Ristek" />
                </div>
                <PersonLinker label="Ketua" dosenOptions={dosenOptions} value={metaKetua} onChange={setMetaKetua} single />
                <PersonLinker label="Anggota" dosenOptions={dosenOptions} value={metaAnggota} onChange={setMetaAnggota} />
              </>
            )}

            {formData.jenis === "pengabdian" && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mitra</label>
                  <input type="text" value={metaMitra} onChange={e => setMetaMitra(e.target.value)} className={inputCls} placeholder="Contoh: Desa Buha" />
                </div>
                <PersonLinker label="Ketua" dosenOptions={dosenOptions} value={metaKetua} onChange={setMetaKetua} single />
                <PersonLinker label="Anggota" dosenOptions={dosenOptions} value={metaAnggota} onChange={setMetaAnggota} />
              </>
            )}

            {formData.jenis === "bukuAjar" && (
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

            {formData.jenis === "hki" && (
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

            {formData.jenis === "sertifikasi" && (
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
              <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" id="dosen-karya-photo-upload" />
              <button type="button" onClick={() => photoInputRef.current?.click()} disabled={isUploadingPhoto}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50">
                <HiOutlinePhoto className="w-4 h-4" />
                {isUploadingPhoto ? "Mengupload..." : "Tambah Foto"}
              </button>
              {fotoUrls.length === 0 && <span className="text-xs text-gray-400">Belum ada foto</span>}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 text-amber-700 text-xs border border-amber-100">
            <strong>Info:</strong> Karya yang diajukan akan ditinjau oleh admin sebelum dipublikasikan.
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Batal</button>
            <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors">Ajukan Karya</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
