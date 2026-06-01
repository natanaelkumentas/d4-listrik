"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Pegawai } from "@/types/pegawai";
import { HiOutlineArrowUpTray, HiOutlineTrash, HiCheck, HiExclamationTriangle, HiXCircle } from "react-icons/hi2";
import Image from "next/image";

export default function PegawaiProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { pegawaiList, ensurePegawaiLoaded } = useData();
  const [formData, setFormData] = useState<Partial<Pegawai>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const fetchPendingRequest = async () => {
    try {
      const res = await fetch("/api/profile-pending");
      if (res.ok) {
        const data = await res.json();
        setPendingRequest(data);
      }
    } catch (e) {
      console.error("Failed to fetch pending request status", e);
    }
  };

  useEffect(() => {
    ensurePegawaiLoaded();
    fetchPendingRequest();
  }, [ensurePegawaiLoaded]);

  useEffect(() => {
    if (user && user.role === "pegawai") {
      const pegawaiData = pegawaiList.find((p) => p.nip === user.nip || p.id === user.id);
      if (pegawaiData) {
        setFormData(pegawaiData);
      }
    }
  }, [user, pegawaiList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && formData.id) {
      setIsSaving(true);
      setErrorMsg("");
      try {
        const res = await fetch("/api/profile-pending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              nama: formData.nama,
              foto_url: formData.foto_url,
              email: formData.email,
              telepon: formData.telepon,
              pendidikan_terakhir: formData.pendidikan_terakhir,
            }
          })
        });

        if (res.ok) {
          setIsSaved(true);
          await fetchPendingRequest();
          setTimeout(() => {
            setIsSaved(false);
          }, 3000);
        } else {
          const err = await res.json();
          setErrorMsg(err.error || "Gagal mengirimkan permohonan update");
        }
      } catch (err) {
        setErrorMsg("Terjadi kesalahan jaringan.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (!user || user.role !== "pegawai") return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formData.id) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("pegawai_id", formData.id);
      const res = await fetch("/api/upload/pegawai", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, foto_url: data.url }));
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 text-sm mt-1">Perbarui informasi profil staf dan biodata Anda.</p>
      </div>

      {pendingRequest?.status === "pending" && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 font-medium text-sm flex items-start gap-3 shadow-sm animate-fade-in">
          <HiExclamationTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Menunggu Persetujuan Admin</p>
            <p className="text-amber-700 text-xs font-normal mt-0.5">Perubahan profil Anda sedang ditinjau oleh administrator. Anda masih dapat memperbarui permohonan Anda kembali.</p>
          </div>
        </div>
      )}

      {pendingRequest?.status === "rejected" && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 border border-red-100 font-medium text-sm flex items-start gap-3 shadow-sm">
          <HiXCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Permohonan Terakhir Ditolak</p>
            <p className="text-red-700 text-xs font-normal mt-0.5">Alasan penolakan: &quot;{pendingRequest.rejected_reason || "Tidak ditentukan"}&quot;. Silakan perbaiki data di bawah dan ajukan kembali.</p>
          </div>
        </div>
      )}

      {isSaved && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-800 border border-green-100 font-medium text-sm flex items-center gap-2 shadow-sm animate-fade-in">
          <HiCheck className="w-5 h-5 text-green-600" />
          Permohonan perubahan profil berhasil dikirim ke admin!
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 border border-red-100 font-medium text-sm shadow-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white border border-gray-100 p-6 sm:p-8 rounded-2xl shadow-sm">
        {/* Photo upload */}
        <div className="flex items-center gap-5 border-b border-gray-100 pb-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 shrink-0 relative">
            <Image src={formData.foto_url || "/images/default-profile.svg"} alt="Foto" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <div>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => photoInputRef.current?.click()} disabled={isUploading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-all disabled:opacity-50 hover:border-primary-400">
                <HiOutlineArrowUpTray className="w-4 h-4" />
                {isUploading ? "Mengupload..." : "Ubah Foto Profil"}
              </button>
              {formData.foto_url && (
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, foto_url: null }))}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-red-600 border border-red-200 bg-white hover:bg-red-50 transition-colors">
                  <HiOutlineTrash className="w-4 h-4" /> Hapus
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG. Maks 50MB.</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={formData.nama || ""}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">NIP</label>
            <input
              type="text"
              required
              disabled
              value={formData.nip || ""}
              className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
              title="Hubungi Admin untuk mengubah NIP"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">No. Telepon / WhatsApp</label>
            <input
              type="text"
              value={formData.telepon || ""}
              onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Contoh: 08123456789"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Pendidikan Terakhir</label>
          <input
            type="text"
            value={formData.pendidikan_terakhir || ""}
            onChange={(e) => setFormData({ ...formData, pendidikan_terakhir: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            * Perubahan Anda akan disimpan sebagai draf pending dan harus disetujui admin sebelum ditampilkan ke publik.
          </p>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
          >
            {isSaving ? "Mengirim..." : "Ajukan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
