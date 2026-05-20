"use client";

import { useState, useRef, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { Dosen } from "@/data/dosen";
import Modal from "@/components/universal/Modal";
import ConfirmDialog from "@/components/universal/ConfirmDialog";
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineArrowUpTray, HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";
import Image from "next/image";

export default function AdminDosenPage() {
  const { dosenList, addDosen, updateDosen, deleteDosen, ensureDosenLoaded } = useData();

  useEffect(() => { ensureDosenLoaded(); }, [ensureDosenLoaded]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Dosen>>({});
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ nama: "", nidn: "", email: "", bidangKeahlian: [] });
    setPassword("");
    setShowPassword(false);
    setFormError("");
    setSuccessMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dosen: Dosen) => {
    setEditingId(dosen.id);
    setFormData(dosen);
    setPassword("");
    setShowPassword(false);
    setFormError("");
    setSuccessMsg("");
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setConfirmOpen(true);
  };

  const executeDelete = () => {
    if (deletingId) deleteDosen(deletingId);
    setConfirmOpen(false);
    setDeletingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      if (editingId) {
        await updateDosen(editingId, formData as Dosen);
        setIsModalOpen(false);
      } else {
        // Validation for new dosen
        if (!formData.email) {
          setFormError("Email wajib diisi untuk membuat akun dosen.");
          setIsSubmitting(false);
          return;
        }
        if (!password) {
          setFormError("Password wajib diisi untuk membuat akun dosen.");
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setFormError("Password harus minimal 6 karakter.");
          setIsSubmitting(false);
          return;
        }

        await addDosen(formData as Dosen, password);
        setSuccessMsg(`Akun dosen berhasil dibuat! Dosen dapat login menggunakan email: ${formData.email}`);
        
        // Auto-close after showing success
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccessMsg("");
        }, 3000);
      }
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formData.id) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("dosen_id", formData.id);
      const res = await fetch("/api/upload/dosen", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, foto: data.url }));
      }
    } catch (err) { console.error("Upload failed", err); }
    finally { setIsUploading(false); if (photoInputRef.current) photoInputRef.current.value = ""; }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Dosen</h1>
          <p className="text-gray-500 text-sm">Kelola data dosen program studi.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Tambah Dosen
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Nama Dosen</th>
                <th className="px-6 py-4">NIDN</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dosenList.map((dosen) => (
                <tr key={dosen.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{dosen.nama}</td>
                  <td className="px-6 py-4">{dosen.nidn}</td>
                  <td className="px-6 py-4">{dosen.email || "-"}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(dosen)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Edit"
                    >
                      <HiOutlinePencilSquare className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(dosen.id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      title="Hapus"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {dosenList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    Belum ada data dosen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Dosen" : "Tambah Dosen Baru"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error message */}
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
              {formError}
            </div>
          )}

          {/* Success message */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-green-50 text-green-700 text-sm font-medium border border-green-100">
              ✅ {successMsg}
            </div>
          )}

          {/* Photo upload */}
          {editingId && (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 shrink-0">
                <Image src={formData.foto || "/images/default-profile.svg"} alt="Foto" width={64} height={64} className="w-full h-full object-cover" />
              </div>
              <div>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => photoInputRef.current?.click()} disabled={isUploading}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50">
                    <HiOutlineArrowUpTray className="w-3.5 h-3.5" />
                    {isUploading ? "Mengupload..." : "Ubah Foto"}
                  </button>
                  {formData.foto && (
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, foto: null }))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 bg-white hover:bg-red-50 transition-colors">
                      <HiOutlineTrash className="w-3.5 h-3.5" /> Hapus
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG. Maks 50MB.</p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap (beserta gelar)</label>
            <input
              type="text"
              required
              value={formData.nama || ""}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIDN</label>
              <input
                type="text"
                required
                value={formData.nidn || ""}
                onChange={(e) => setFormData({ ...formData, nidn: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email {!editingId && <span className="text-red-500">*</span>}
              </label>
              <input
                type="email"
                required={!editingId}
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="email@polimdo.ac.id"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon / WhatsApp</label>
              <input
                type="text"
                value={formData.telepon || ""}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Contoh: 08123456789"
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              {/* Spacer or additional fields if needed, we put other fields below */}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan Fungsional</label>
              <input
                type="text"
                value={formData.jabatan || ""}
                onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Contoh: Lektor Kepala, Asisten Ahli"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pangkat / Golongan</label>
              <input
                type="text"
                value={formData.pangkat || ""}
                onChange={(e) => setFormData({ ...formData, pangkat: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Contoh: Pembina - IV/a, Penata - III/c"
              />
            </div>
          </div>

          {/* Password field — only shown when adding a new dosen */}
          {!editingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Dosen akan menggunakan email & password ini untuk login ke dashboard.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Studi (Homebase)</label>
            <input
              type="text"
              value={formData.programStudi || ""}
              onChange={(e) => setFormData({ ...formData, programStudi: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="D4 Teknik Listrik"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pendidikan Terakhir</label>
            <input
              type="text"
              value={formData.pendidikanTerakhir || ""}
              onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="S2 Teknik Elektro, Universitas..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bidang Keahlian (pisahkan dengan koma)</label>
            <input
              type="text"
              value={formData.bidangKeahlian?.join(", ") || ""}
              onChange={(e) => setFormData({ ...formData, bidangKeahlian: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Sistem Tenaga Listrik, Energi Terbarukan"
            />
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
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={executeDelete}
        onCancel={() => { setConfirmOpen(false); setDeletingId(null); }}
        title="Hapus Dosen"
        message="Apakah Anda yakin ingin menghapus dosen ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  );
}
