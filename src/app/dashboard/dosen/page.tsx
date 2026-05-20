"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Dosen } from "@/data/dosen";
import { HiOutlineArrowUpTray, HiOutlineTrash } from "react-icons/hi2";
import Image from "next/image";

export default function DosenProfilePage() {
  const { user } = useAuth();
  const { dosenList, updateDosen, ensureDosenLoaded } = useData();
  const [formData, setFormData] = useState<Partial<Dosen>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [bidangInput, setBidangInput] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ensureDosenLoaded();
  }, [ensureDosenLoaded]);

  useEffect(() => {
    if (user && user.role === "dosen") {
      const dosenData = dosenList.find((d) => d.nidn === user.nidn);
      if (dosenData) {
        setFormData(dosenData);
        setBidangInput(dosenData.bidangKeahlian?.join(", ") || "");
      }
    }
  }, [user, dosenList]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && formData.id) {
      updateDosen(formData.id, formData as Dosen);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  if (!user || user.role !== "dosen") return null;

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
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 text-sm mt-1">Perbarui informasi profil dan kepakaran Anda.</p>
      </div>

      {isSaved && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-700 border border-green-100 font-medium text-sm animate-fade-in">
          Data profil berhasil disimpan!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Photo upload */}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 shrink-0">
            <Image src={formData.foto || "/images/default-profile.svg"} alt="Foto" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <div>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => photoInputRef.current?.click()} disabled={isUploading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50">
                <HiOutlineArrowUpTray className="w-4 h-4" />
                {isUploading ? "Mengupload..." : "Ubah Foto Profil"}
              </button>
              {formData.foto && (
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, foto: null }))}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-red-600 border border-red-200 bg-white hover:bg-red-50 transition-colors">
                  <HiOutlineTrash className="w-4 h-4" /> Hapus
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG. Maks 50MB.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap & Gelar</label>
            <input
              type="text"
              required
              value={formData.nama || ""}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIDN</label>
            <input
              type="text"
              required
              disabled
              value={formData.nidn || ""}
              className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
              title="Hubungi Admin untuk mengubah NIDN"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pendidikan Terakhir</label>
            <input
              type="text"
              value={formData.pendidikanTerakhir || ""}
              onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Studi</label>
            <input
              type="text"
              value={formData.programStudi || ""}
              onChange={(e) => setFormData({ ...formData, programStudi: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bidang Keahlian (pisahkan dengan koma)</label>
          <input
            type="text"
            value={bidangInput}
            onChange={(e) => {
              const val = e.target.value;
              setBidangInput(val);
              setFormData({ ...formData, bidangKeahlian: val.split(",").map(s => s.trim()).filter(Boolean) });
            }}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="pt-6 border-t border-gray-100">
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm"
          >
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
}
