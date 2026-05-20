"use client";

import { useState, useRef, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { GaleriItem } from "@/data/galeri";
import Modal from "@/components/universal/Modal";
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineArrowUpTray, HiOutlineXMark } from "react-icons/hi2";
import Image from "next/image";

export default function AdminGaleriPage() {
  const { galeriList, addGaleri, updateGaleri, deleteGaleri, ensureGaleriLoaded } = useData();

  useEffect(() => { ensureGaleriLoaded(); }, [ensureGaleriLoaded]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<GaleriItem>>({});
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ id: `galeri-${Date.now()}`, judul: "", deskripsi: "", kategori: "fasilitas", tanggal: new Date().toISOString().split("T")[0], foto: [], warna: "from-blue-500 to-indigo-600" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: GaleriItem) => {
    setEditingId(item.id);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus galeri ini?")) {
      deleteGaleri(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateGaleri(editingId, formData as GaleriItem);
    } else {
      addGaleri(formData as GaleriItem);
    }
    setIsModalOpen(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (editingId) fd.append("galeri_id", editingId);
      const res = await fetch("/api/upload/galeri", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, foto: [...(prev.foto || []), data.url] }));
      }
    } catch (err) { console.error("Upload failed", err); }
    finally { setIsUploading(false); if (imageInputRef.current) imageInputRef.current.value = ""; }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({ ...prev, foto: (prev.foto || []).filter((_, i) => i !== index) }));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Galeri</h1>
          <p className="text-gray-500 text-sm">Kelola dokumentasi fasilitas dan tridharma.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition-colors shadow-sm"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Tambah Galeri
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Judul</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {galeriList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.judul}</td>
                  <td className="px-6 py-4 capitalize">{item.kategori}</td>
                  <td className="px-6 py-4">{item.tanggal}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors"
                      title="Edit"
                    >
                      <HiOutlinePencilSquare className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      title="Hapus"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {galeriList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    Belum ada data galeri.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Galeri" : "Tambah Galeri Baru"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Galeri</label>
            <input
              type="text"
              required
              value={formData.judul || ""}
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Lengkap</label>
            <textarea
              required
              rows={3}
              value={formData.deskripsi || ""}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                required
                value={formData.kategori || "fasilitas"}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value as "fasilitas" | "tridharma" })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="fasilitas">Fasilitas</option>
                <option value="tridharma">Tridharma Perguruan Tinggi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Kegiatan</label>
              <input
                type="date"
                required
                value={formData.tanggal || ""}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
          
          {/* Image upload section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Foto Galeri</label>
            {(formData.foto && formData.foto.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.foto.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                    <Image src={url} alt={`Foto ${idx + 1}`} width={80} height={80} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => handleRemoveImage(idx)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <HiOutlineXMark className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <button type="button" onClick={() => imageInputRef.current?.click()} disabled={isUploading}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50">
                <HiOutlineArrowUpTray className="w-3.5 h-3.5" />
                {isUploading ? "Mengupload..." : "Tambah Foto"}
              </button>
              <span className="text-xs text-gray-400">{formData.foto?.length || 0} foto</span>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 transition-colors"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
