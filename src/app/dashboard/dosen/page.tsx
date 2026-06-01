"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Dosen } from "@/types/dosen";
import { HiOutlineArrowUpTray, HiOutlineTrash, HiCheck, HiExclamationTriangle, HiXCircle } from "react-icons/hi2";
import Image from "next/image";

export default function DosenProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { dosenList, ensureDosenLoaded } = useData();
  const [formData, setFormData] = useState<Partial<Dosen>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [bidangInput, setBidangInput] = useState("");
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
    ensureDosenLoaded();
    fetchPendingRequest();
  }, [ensureDosenLoaded]);

  useEffect(() => {
    if (user && user.role === "dosen") {
      const dosenData = dosenList.find((d) => d.nip === user.nip);
      if (dosenData) {
        setFormData({
          ...dosenData,
          social_media: dosenData.social_media || {},
          visibility_settings: dosenData.visibility_settings || {},
        });
        setBidangInput(dosenData.bidangKeahlian?.join(", ") || "");
      }
    }
  }, [user, dosenList]);

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
              foto_url: formData.foto,
              jabatan: formData.jabatan,
              pangkat: formData.pangkat,
              email: formData.email,
              telepon: formData.telepon,
              bidang_keahlian: formData.bidangKeahlian,
              program_studi: formData.programStudi,
              pendidikan_terakhir: formData.pendidikanTerakhir,
              social_media: formData.social_media || {},
              visibility_settings: formData.visibility_settings || {},
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
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const updateSocialMedia = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_media: {
        ...(prev.social_media || {}),
        [platform]: value
      }
    }));
  };

  const toggleVisibility = (key: string) => {
    setFormData(prev => {
      const currentVal = prev.visibility_settings?.[key] !== false; // defaults to true
      return {
        ...prev,
        visibility_settings: {
          ...(prev.visibility_settings || {}),
          [key]: !currentVal
        }
      };
    });
  };

  return (
    <div>
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 text-sm mt-1">Perbarui informasi profil, kepakaran, dan visibilitas kontak Anda.</p>
      </div>

      {pendingRequest?.status === "pending" && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 font-medium text-sm flex items-start gap-3 shadow-sm">
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
            <Image src={formData.foto || "/images/default-profile.svg"} alt="Foto" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <div>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => photoInputRef.current?.click()} disabled={isUploading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-all disabled:opacity-50 hover:border-primary-400">
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
            <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG. Maks 50MB.</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap & Gelar</label>
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

        {/* Contact Info with Visibility Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <label className="flex items-center gap-2 mt-2 select-none">
              <input
                type="checkbox"
                checked={formData.visibility_settings?.email !== false}
                onChange={() => toggleVisibility("email")}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-xs text-gray-500">Tampilkan email ke publik</span>
            </label>
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
            <label className="flex items-center gap-2 mt-2 select-none">
              <input
                type="checkbox"
                checked={formData.visibility_settings?.telepon !== false}
                onChange={() => toggleVisibility("telepon")}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-xs text-gray-500">Tampilkan telepon ke publik</span>
            </label>
          </div>
        </div>

        {/* Academic / Job details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Jabatan Fungsional</label>
            <input
              type="text"
              value={formData.jabatan || ""}
              onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Contoh: Lektor Kepala, Asisten Ahli"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Pangkat / Golongan</label>
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
            <label className="block text-sm font-bold text-gray-700 mb-1">Pendidikan Terakhir</label>
            <input
              type="text"
              value={formData.pendidikanTerakhir || ""}
              onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Program Studi</label>
            <input
              type="text"
              value={formData.programStudi || ""}
              onChange={(e) => setFormData({ ...formData, programStudi: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Bidang Keahlian (pisahkan dengan koma)</label>
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

        {/* Social Media Section */}
        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Media Sosial & Akademik</h3>
          <div className="space-y-4">
            {/* Google Scholar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-medium text-gray-700">Google Scholar</label>
              </div>
              <div className="w-full sm:w-2/3 flex flex-col gap-1.5">
                <input
                  type="url"
                  placeholder="https://scholar.google.com/citations?user=..."
                  value={formData.social_media?.google_scholar || ""}
                  onChange={(e) => updateSocialMedia("google_scholar", e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <label className="flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={formData.visibility_settings?.google_scholar !== false}
                    onChange={() => toggleVisibility("google_scholar")}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">Tampilkan ke publik</span>
                </label>
              </div>
            </div>

            {/* ResearchGate */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-medium text-gray-700">ResearchGate</label>
              </div>
              <div className="w-full sm:w-2/3 flex flex-col gap-1.5">
                <input
                  type="url"
                  placeholder="https://www.researchgate.net/profile/..."
                  value={formData.social_media?.research_gate || ""}
                  onChange={(e) => updateSocialMedia("research_gate", e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <label className="flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={formData.visibility_settings?.research_gate !== false}
                    onChange={() => toggleVisibility("research_gate")}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">Tampilkan ke publik</span>
                </label>
              </div>
            </div>

            {/* LinkedIn */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
              </div>
              <div className="w-full sm:w-2/3 flex flex-col gap-1.5">
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.social_media?.linkedin || ""}
                  onChange={(e) => updateSocialMedia("linkedin", e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <label className="flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={formData.visibility_settings?.linkedin !== false}
                    onChange={() => toggleVisibility("linkedin")}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">Tampilkan ke publik</span>
                </label>
              </div>
            </div>

            {/* Instagram */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-medium text-gray-700">Instagram</label>
              </div>
              <div className="w-full sm:w-2/3 flex flex-col gap-1.5">
                <input
                  type="url"
                  placeholder="https://instagram.com/..."
                  value={formData.social_media?.instagram || ""}
                  onChange={(e) => updateSocialMedia("instagram", e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <label className="flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={formData.visibility_settings?.instagram !== false}
                    onChange={() => toggleVisibility("instagram")}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">Tampilkan ke publik</span>
                </label>
              </div>
            </div>

            {/* Facebook */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-medium text-gray-700">Facebook</label>
              </div>
              <div className="w-full sm:w-2/3 flex flex-col gap-1.5">
                <input
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={formData.social_media?.facebook || ""}
                  onChange={(e) => updateSocialMedia("facebook", e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <label className="flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={formData.visibility_settings?.facebook !== false}
                    onChange={() => toggleVisibility("facebook")}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">Tampilkan ke publik</span>
                </label>
              </div>
            </div>
          </div>
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
