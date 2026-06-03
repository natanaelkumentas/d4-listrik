"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { HiOutlinePlus as PlusIcon, HiOutlinePencilSquare as EditIcon, HiOutlineTrash as TrashIcon, HiOutlineArrowUpTray as UploadIcon, HiPhoto } from "react-icons/hi2";
import Modal from "@/components/universal/Modal";
import ConfirmDialog from "@/components/universal/ConfirmDialog";
import { cachedFetch, invalidateCache } from "@/lib/fetchCache";
import { useNotification } from "@/context/NotificationContext";
import { useData } from "@/context/DataContext";
import ImageLightbox from "@/components/universal/ImageLightbox";

interface FasilitasItem {
  id: string;
  nama: string;
  deskripsi: string | null;
  foto_urls: string[];
  kepala_lab: string | null;
  no_ruangan: string | null;
}

export default function FasilitasManagement() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [items, setItems] = useState<FasilitasItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { dosenList, ensureDosenLoaded } = useData();

  // Searchable combobox states
  const [dosenSearch, setDosenSearch] = useState("");
  const [isDosenDropdownOpen, setIsDosenDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal editor states
  const [isOpen, setIsOpen] = useState(false);
  const [isLab, setIsLab] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nama: "",
    deskripsi: "",
    kepala_lab: "",
    no_ruangan: "",
    foto_urls: [] as string[],
  });

  // Confirm dialog states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    try {
      const data = await fetch("/api/fasilitas").then((r) => r.json());
      setItems(data || []);
    } catch (e) {
      console.error("Failed to load facilities", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    ensureDosenLoaded();
  }, [ensureDosenLoaded]);

  // Click outside dropdown handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDosenDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setDosenSearch("");
    setIsLab(true);
    setForm({
      nama: "",
      deskripsi: "",
      kepala_lab: "",
      no_ruangan: "",
      foto_urls: [],
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (item: FasilitasItem) => {
    setEditingId(item.id);
    setDosenSearch(item.kepala_lab || "");
    setIsLab(!!item.kepala_lab);
    setForm({
      nama: item.nama,
      deskripsi: item.deskripsi || "",
      kepala_lab: item.kepala_lab || "",
      no_ruangan: item.no_ruangan || "",
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
        fd.append("folder", "fasilitas");
        // Upload to /api/upload/galeri with fasilitas folder
        const res = await fetch("/api/upload/galeri", {
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
          showError(`Gagal mengupload "${file.name}".`);
        }
      }
    } catch (err) {
      console.error("Upload failed", err);
      showError("Terjadi kesalahan saat mengupload foto.");
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
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/fasilitas/${editingId}` : "/api/fasilitas";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...form,
        kepala_lab: isLab ? form.kepala_lab : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan data");
      }

      invalidateCache("/api/fasilitas");
      setIsOpen(false);
      await fetchItems();
      showSuccess("Fasilitas berhasil disimpan!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (id: string) => {
    setDeletingId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/fasilitas/${deletingId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus data");
      }

      invalidateCache("/api/fasilitas");
      await fetchItems();
      showSuccess("Fasilitas berhasil dihapus!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan");
    } finally {
      setConfirmOpen(false);
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400 font-medium animate-pulse">Loading Fasilitas...</div>;
  }

  const inputCls = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-primary-950";

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Manajemen Fasilitas</h1>
          <p className="text-gray-500 text-sm">Kelola daftar laboratorium, ruang perkuliahan, dan inventaris prodi.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          <PlusIcon className="w-5 h-5" /> Tambah Fasilitas
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
          >
            <div>
              {/* Cover Photo */}
              <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                <img
                  src={item.foto_urls?.[0] || "/images/default.svg"}
                  alt={item.nama}
                  onClick={() => {
                    if (item.foto_urls && item.foto_urls.length > 0) {
                      setLightboxImages(item.foto_urls);
                      setLightboxIndex(0);
                      setLightboxOpen(true);
                    }
                  }}
                  className={`w-full h-full object-cover ${
                    item.foto_urls && item.foto_urls.length > 0 ? "cursor-zoom-in hover:scale-105 transition-transform duration-500" : ""
                  }`}
                />
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold font-mono">
                  Room: {item.no_ruangan || "-"}
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-bold text-primary-950 text-base mb-1.5">{item.nama}</h3>
                {item.kepala_lab ? (
                  <p className="text-xs text-gray-400 mb-3 font-semibold">Ka. Lab: {item.kepala_lab}</p>
                ) : (
                  <p className="text-xs text-gray-400 mb-3 font-semibold">Tipe: Non-Laboratorium</p>
                )}
                <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{item.deskripsi || "—"}</p>
              </div>
            </div>

            <div className="px-5 pb-5 pt-3 border-t border-gray-50 flex justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(item)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                title="Edit"
              >
                <EditIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleOpenDelete(item.id)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                title="Hapus"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-400">
            Belum ada data fasilitas. Silakan tambahkan.
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingId ? "Edit Fasilitas" : "Tambah Fasilitas"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Fasilitas</label>
              <input
                type="text"
                required
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                className={inputCls}
                placeholder="Contoh: Laboratorium Sistem Proteksi"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">No. Ruangan</label>
              <input
                type="text"
                value={form.no_ruangan}
                onChange={(e) => setForm({ ...form, no_ruangan: e.target.value })}
                className={inputCls}
                placeholder="Contoh: Lab 201"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipe Fasilitas</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="tipe_fasilitas"
                    checked={isLab}
                    onChange={() => setIsLab(true)}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  Laboratorium (Lab)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="tipe_fasilitas"
                    checked={!isLab}
                    onChange={() => {
                      setIsLab(false);
                      setForm(prev => ({ ...prev, kepala_lab: "" }));
                      setDosenSearch("");
                    }}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  Non-Laboratorium
                </label>
              </div>
            </div>

            {isLab && (
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kepala Laboratorium</label>
                <input
                  type="text"
                  value={dosenSearch}
                  onFocus={() => setIsDosenDropdownOpen(true)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDosenSearch(val);
                    setForm({ ...form, kepala_lab: val });
                  }}
                  className={inputCls}
                  placeholder="Cari & pilih dosen, atau ketik langsung..."
                />
                {isDosenDropdownOpen && (
                  <div className="absolute z-[110] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                    {dosenList.filter((d) =>
                      d.nama.toLowerCase().includes(dosenSearch.toLowerCase())
                    ).length > 0 ? (
                      dosenList
                        .filter((d) =>
                          d.nama.toLowerCase().includes(dosenSearch.toLowerCase())
                        )
                        .map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, kepala_lab: d.nama });
                              setDosenSearch(d.nama);
                              setIsDosenDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-primary-50 text-sm text-primary-950 font-medium transition-colors border-b border-gray-50 last:border-b-0 cursor-pointer"
                          >
                            {d.nama}
                          </button>
                        ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-gray-400 italic">
                        Tidak ada dosen yang cocok. Tekan Enter/Ketik untuk input manual.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi</label>
            <textarea
              rows={4}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              className={inputCls + " resize-none"}
              placeholder="Jelaskan fasilitas, fungsi alat, dan sarana di laboratorium..."
            />
          </div>

          {/* Photo upload section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Daftar Foto Fasilitas</label>
            
            {/* Thumbnails grid */}
            {form.foto_urls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                {form.foto_urls.map((url, idx) => (
                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group border border-gray-100">
                    <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                    >
                      Hapus
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
                id="facility-photo-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <UploadIcon className="w-4 h-4" />
                {isUploading ? "Mengupload..." : "Upload Foto (Bisa banyak)"}
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6 font-medium">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Fasilitas"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
        title="Hapus Fasilitas"
        message="Hapus fasilitas laboratorium ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        variant="danger"
      />

      <ImageLightbox
        isOpen={lightboxOpen}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
