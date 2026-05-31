"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { HiOutlinePencilSquare as EditIcon, HiOutlineTrash as TrashIcon, HiOutlinePlus as PlusIcon, HiOutlineArrowUpTray as UploadIcon, HiOutlineGlobeAlt as GlobeIcon, HiOutlineIdentification as ShieldIcon, HiOutlineMagnifyingGlass, HiOutlineXMark } from "react-icons/hi2";
import Modal from "@/components/universal/Modal";
import ConfirmDialog from "@/components/universal/ConfirmDialog";
import { invalidateCache } from "@/lib/fetchCache";
import ComboBox from "@/components/universal/ComboBox";
import { useNotification } from "@/context/NotificationContext";
import TablePagination from "@/components/universal/TablePagination";

interface DosenOption {
  id: string;
  nama: string;
}

export default function ConfigManagement() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState<"prodi" | "sambutan" | "footer">("prodi");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingProdiInfo, setIsSubmittingProdiInfo] = useState(false);
  const [isSubmittingLogo, setIsSubmittingLogo] = useState(false);
  const [isSubmittingHeroBg, setIsSubmittingHeroBg] = useState(false);
  const [isSubmittingKajur, setIsSubmittingKajur] = useState(false);
  const [isSubmittingKaprodi, setIsSubmittingKaprodi] = useState(false);

  // DB Config states
  const [prodiInfo, setProdiInfo] = useState({ nama_prodi: "", nama_prodi_alt: "", kampus: "", deskripsi: "", hero_bg_url: "" });
  const [logo, setLogo] = useState({ logo_url: "" });
  const [sambutanKajur, setSambutanKajur] = useState({ kutipan: "", dosen_id: "" });
  const [sambutanKaprodi, setSambutanKaprodi] = useState({ kutipan: "", dosen_id: "" });
  const [footer, setFooter] = useState({ deskripsi: "", copyright: "" });
  const [dosenList, setDosenList] = useState<DosenOption[]>([]);

  // List arrays
  const [kontakList, setKontakList] = useState<any[]>([]);

  // Modal / Editor states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"kontak" | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [kontakForm, setKontakForm] = useState({
    tipe: "",
    label: "",
    url_atau_nomor: "",
    urutan: 1,
  });

  // Confirm states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{ id: string; section: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroBgInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [configData, dosenData] = await Promise.all([
        fetch("/api/config?section=all").then((r) => r.json()),
        fetch("/api/dosen").then((r) => r.json()),
      ]);

      if (configData) {
        if (configData.prodi_info) {
          setProdiInfo({
            nama_prodi: configData.prodi_info.nama || "",
            nama_prodi_alt: configData.prodi_info.nama_alternatif || "",
            kampus: configData.prodi_info.nama_kampus || "",
            deskripsi: configData.prodi_info.deskripsi || "",
            hero_bg_url: configData.prodi_info.hero_bg_url || "",
          });
        }
        if (configData.logo) {
          setLogo({
            logo_url: configData.logo.file_url || "",
          });
        }
        if (configData.sambutan_kajur) {
          setSambutanKajur({
            kutipan: configData.sambutan_kajur.kutipan || "",
            dosen_id: configData.sambutan_kajur.dosen_id || "",
          });
        }
        if (configData.sambutan_kaprodi) {
          setSambutanKaprodi({
            kutipan: configData.sambutan_kaprodi.kutipan || "",
            dosen_id: configData.sambutan_kaprodi.dosen_id || "",
          });
        }
        if (configData.footer) setFooter(configData.footer);
        if (configData.kontak) setKontakList(configData.kontak);
      }

      if (dosenData) {
        setDosenList(
          dosenData.map((d: any) => ({
            id: d.id,
            nama: d.nama,
          }))
        );
      }
    } catch (e) {
      console.error("Failed to load configs", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save prodi info
  const handleSaveProdiInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProdiInfo(true);
    try {
      const mappedProdiInfo = {
        nama: prodiInfo.nama_prodi,
        nama_alternatif: prodiInfo.nama_prodi_alt,
        nama_kampus: prodiInfo.kampus,
        deskripsi: prodiInfo.deskripsi,
        hero_bg_url: prodiInfo.hero_bg_url || null,
      };

      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "prodi_info", data: mappedProdiInfo }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan informasi prodi");
      }

      invalidateCache("/api/config");
      await fetchData();
      showSuccess("Informasi Umum Prodi berhasil disimpan!");
      router.refresh();
    } catch (err) {
      console.error(err);
      showError("Gagal menyimpan data.");
    } finally {
      setIsSubmittingProdiInfo(false);
    }
  };

  // Save Logo
  const handleSaveLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLogo(true);
    try {
      const mappedLogo = {
        file_url: logo.logo_url || "",
        alt_text: "Logo",
      };

      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "logo", data: mappedLogo }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan logo");
      }

      invalidateCache("/api/config");
      await fetchData();
      showSuccess("Logo Program Studi berhasil disimpan!");
      router.refresh();
    } catch (err) {
      console.error(err);
      showError("Gagal menyimpan data.");
    } finally {
      setIsSubmittingLogo(false);
    }
  };

  // Save Hero Background
  const handleSaveHeroBg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingHeroBg(true);
    try {
      const mappedProdiInfo = {
        nama: prodiInfo.nama_prodi,
        nama_alternatif: prodiInfo.nama_prodi_alt,
        nama_kampus: prodiInfo.kampus,
        deskripsi: prodiInfo.deskripsi,
        hero_bg_url: prodiInfo.hero_bg_url || null,
      };

      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "prodi_info", data: mappedProdiInfo }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan foto latar hero");
      }

      invalidateCache("/api/config");
      await fetchData();
      showSuccess("Foto Latar Hero berhasil disimpan!");
      router.refresh();
    } catch (err) {
      console.error(err);
      showError("Gagal menyimpan data.");
    } finally {
      setIsSubmittingHeroBg(false);
    }
  };

  // Logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmittingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/galeri", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        const data = await res.json();
        setLogo({ logo_url: data.url });
        showSuccess("Logo berhasil diupload! Klik 'Simpan Perubahan' untuk menyimpan secara permanen.");
      } else {
        showError("Gagal mengupload logo.");
      }
    } catch (err) {
      console.error("Upload logo failed", err);
    } finally {
      setIsSubmittingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  // Hero Background upload
  const handleHeroBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmittingHeroBg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/hero", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        const data = await res.json();
        setProdiInfo((prev) => ({ ...prev, hero_bg_url: data.url }));
        showSuccess("Foto latar hero berhasil diupload! Klik 'Simpan Perubahan' untuk menyimpan secara permanen.");
      } else {
        showError("Gagal mengunggah foto latar.");
      }
    } catch (err) {
      console.error("Upload hero background failed", err);
      showError("Terjadi kesalahan saat mengunggah.");
    } finally {
      setIsSubmittingHeroBg(false);
      if (heroBgInputRef.current) heroBgInputRef.current.value = "";
    }
  };

  // Save Sambutan Kajur
  const handleSaveSambutanKajur = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingKajur(true);
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "sambutan_kajur", data: sambutanKajur }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan sambutan Kajur");

      invalidateCache("/api/config");
      await fetchData();
      showSuccess("Sambutan Ketua Jurusan berhasil disimpan!");
      router.refresh();
    } catch (err) {
      console.error(err);
      showError("Gagal menyimpan Sambutan Ketua Jurusan.");
    } finally {
      setIsSubmittingKajur(false);
    }
  };

  // Save Sambutan Kaprodi
  const handleSaveSambutanKaprodi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingKaprodi(true);
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "sambutan_kaprodi", data: sambutanKaprodi }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan sambutan Kaprodi");

      invalidateCache("/api/config");
      await fetchData();
      showSuccess("Sambutan Ketua Program Studi berhasil disimpan!");
      router.refresh();
    } catch (err) {
      console.error(err);
      showError("Gagal menyimpan Sambutan Ketua Program Studi.");
    } finally {
      setIsSubmittingKaprodi(false);
    }
  };

  // Save Footer
  const handleSaveFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "footer", data: footer }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan footer");

      invalidateCache("/api/config");
      await fetchData();
      showSuccess("Footer berhasil disimpan!");
      router.refresh();
    } catch (err) {
      console.error(err);
      showError("Gagal menyimpan Footer.");
    } finally {
      setIsSubmitting(false);
    }
  };



  // Kontak Operations
  const handleOpenKontakAdd = () => {
    setEditingId(null);
    setKontakForm({
      tipe: "",
      label: "",
      url_atau_nomor: "",
      urutan: kontakList.length + 1,
    });
    setModalType("kontak");
    setIsModalOpen(true);
  };

  const handleOpenKontakEdit = (k: any) => {
    setEditingId(k.id);
    setKontakForm({
      tipe: k.tipe,
      label: k.label,
      url_atau_nomor: k.url_atau_nomor,
      urutan: k.urutan,
    });
    setModalType("kontak");
    setIsModalOpen(true);
  };

  // Save Modal Submit
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let url = "/api/config";
      let method = "POST";
      let payload: any = { section: modalType };

      let dataToSubmit: any = {};
      if (modalType === "kontak") {
        dataToSubmit = { ...kontakForm };
      }

      if (editingId) {
        method = "PUT";
        dataToSubmit.id = editingId;
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
      setIsModalOpen(false);
      await fetchData();
      showSuccess("Data berhasil disimpan!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (id: string, section: string) => {
    setConfirmData({ id, section });
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmData) return;
    try {
      const res = await fetch(`/api/config?section=${confirmData.section}&id=${confirmData.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus");
      }

      invalidateCache("/api/config");
      await fetchData();
      showSuccess("Data berhasil dihapus!");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan");
    } finally {
      setConfirmOpen(false);
      setConfirmData(null);
    }
  };





  if (isLoading) {
    return <div className="text-center py-12 text-gray-400 font-medium animate-pulse">Loading Konfigurasi Website...</div>;
  }

  const inputCls = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-primary-950";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Konfigurasi Website</h1>
      <p className="text-gray-500 text-sm mb-6">Kelola informasi program studi, visi-misi, dan kontak program studi.</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("prodi")}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors cursor-pointer ${
            activeTab === "prodi"
              ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          Prodi Info & Logo
        </button>

        <button
          onClick={() => setActiveTab("sambutan")}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors cursor-pointer ${
            activeTab === "sambutan"
              ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          Sambutan
        </button>
        <button
          onClick={() => setActiveTab("footer")}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors cursor-pointer ${
            activeTab === "footer"
              ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          Footer
        </button>
      </div>

      {/* PRODI TAB */}
      {activeTab === "prodi" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch max-w-5xl">
          {/* COLUMN 1: Informasi Umum Prodi */}
          <form onSubmit={handleSaveProdiInfo} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between h-full">
            <div className="space-y-4">
              <h3 className="font-bold text-primary-950 text-base border-b border-gray-50 pb-2">Informasi Umum Prodi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Nama Prodi</label>
                  <input
                    type="text"
                    required
                    value={prodiInfo.nama_prodi}
                    onChange={(e) => setProdiInfo({ ...prodiInfo, nama_prodi: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Singkatan / Alt</label>
                  <input
                    type="text"
                    required
                    value={prodiInfo.nama_prodi_alt}
                    onChange={(e) => setProdiInfo({ ...prodiInfo, nama_prodi_alt: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Kampus / Institusi</label>
                <input
                  type="text"
                  required
                  value={prodiInfo.kampus}
                  onChange={(e) => setProdiInfo({ ...prodiInfo, kampus: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Deskripsi Singkat Prodi</label>
                <textarea
                  rows={6}
                  required
                  value={prodiInfo.deskripsi}
                  onChange={(e) => setProdiInfo({ ...prodiInfo, deskripsi: e.target.value })}
                  className={inputCls + " resize-none"}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-50 mt-4">
              <button
                type="submit"
                disabled={isSubmittingProdiInfo}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmittingProdiInfo ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>

          {/* COLUMN 2: Logo and Hero Background Stack */}
          <div className="space-y-6">
            {/* Logo Program Studi */}
            <form onSubmit={handleSaveLogo} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-primary-950 text-base border-b border-gray-50 pb-2">Logo Program Studi</h3>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-xl border border-gray-100 flex items-center justify-center bg-gray-50 p-2 shrink-0">
                  {logo.logo_url ? (
                    <img src={logo.logo_url} alt="Logo Prodi" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <GlobeIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isSubmittingLogo}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <UploadIcon className="w-4 h-4" /> Ganti Logo
                  </button>
                  {logo.logo_url && (
                    <button
                      type="button"
                      onClick={() => setLogo({ logo_url: "" })}
                      disabled={isSubmittingLogo}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 bg-white hover:bg-red-50 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <TrashIcon className="w-4 h-4" /> Hapus Logo
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-50 mt-2">
                <button
                  type="submit"
                  disabled={isSubmittingLogo}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingLogo ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>

            {/* Foto Latar Hero (Home Background) */}
            <form onSubmit={handleSaveHeroBg} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-primary-950 text-base border-b border-gray-50 pb-2">Foto Latar Hero (Home Background)</h3>
              <div className="flex flex-col gap-4">
                <div className="w-full h-48 rounded-xl border border-gray-100 flex items-center justify-center bg-gray-50 overflow-hidden relative">
                  {prodiInfo.hero_bg_url ? (
                    <img src={prodiInfo.hero_bg_url} alt="Hero Background" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center w-full h-full relative flex items-center justify-center">
                      <img src="/images/hero-bg.jpg" alt="Default Hero Background" className="w-full h-full object-cover opacity-50 absolute inset-0" />
                      <div className="relative z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-xs font-medium text-gray-600 shadow-sm border border-gray-100">
                        Menggunakan Gambar Default (public/images/hero-bg.jpg)
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    ref={heroBgInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleHeroBgUpload}
                    className="hidden"
                    id="hero-bg-upload"
                  />
                  <button
                    type="button"
                    onClick={() => heroBgInputRef.current?.click()}
                    disabled={isSubmittingHeroBg}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <UploadIcon className="w-4 h-4" /> Unggah Foto Latar
                  </button>
                  {prodiInfo.hero_bg_url && (
                    <button
                      type="button"
                      onClick={() => setProdiInfo({ ...prodiInfo, hero_bg_url: "" })}
                      disabled={isSubmittingHeroBg}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 bg-white hover:bg-red-50 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <TrashIcon className="w-4 h-4" /> Hapus Foto Latar
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-50 mt-2">
                <button
                  type="submit"
                  disabled={isSubmittingHeroBg}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingHeroBg ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}





      {/* SAMBUTAN TAB */}
      {activeTab === "sambutan" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start max-w-5xl">
          {/* Sambutan Kajur */}
          <form onSubmit={handleSaveSambutanKajur} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-primary-950 text-base border-b border-gray-50 pb-2">Sambutan Ketua Jurusan</h3>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Pilih Dosen Kajur</label>
              <ComboBox
                options={dosenList}
                value={sambutanKajur.dosen_id || ""}
                onChange={(val) => setSambutanKajur({ ...sambutanKajur, dosen_id: val })}
                placeholder="-- Pilih Dosen Kajur --"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Teks Sambutan</label>
              <textarea
                rows={5}
                required
                value={sambutanKajur.kutipan}
                onChange={(e) => setSambutanKajur({ ...sambutanKajur, kutipan: e.target.value })}
                className={inputCls + " resize-none"}
                placeholder="Tulis sambutan ketua jurusan..."
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-50">
              <button
                type="submit"
                disabled={isSubmittingKajur}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md cursor-pointer transition-colors disabled:opacity-50"
              >
                {isSubmittingKajur ? "Menyimpan..." : "Simpan Sambutan Kajur"}
              </button>
            </div>
          </form>

          {/* Sambutan Kaprodi */}
          <form onSubmit={handleSaveSambutanKaprodi} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-primary-950 text-base border-b border-gray-50 pb-2">Sambutan Ketua Program Studi</h3>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Pilih Dosen Kaprodi</label>
              <ComboBox
                options={dosenList}
                value={sambutanKaprodi.dosen_id || ""}
                onChange={(val) => setSambutanKaprodi({ ...sambutanKaprodi, dosen_id: val })}
                placeholder="-- Pilih Dosen Kaprodi --"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Teks Sambutan</label>
              <textarea
                rows={5}
                required
                value={sambutanKaprodi.kutipan}
                onChange={(e) => setSambutanKaprodi({ ...sambutanKaprodi, kutipan: e.target.value })}
                className={inputCls + " resize-none"}
                placeholder="Tulis sambutan ketua program studi..."
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-50">
              <button
                type="submit"
                disabled={isSubmittingKaprodi}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md cursor-pointer transition-colors disabled:opacity-50"
              >
                {isSubmittingKaprodi ? "Menyimpan..." : "Simpan Sambutan Kaprodi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FOOTER TAB */}
      {activeTab === "footer" && (
        <form onSubmit={handleSaveFooter} className="space-y-6 max-w-2xl">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-primary-950 text-base border-b border-gray-50 pb-2">Footer Program Studi</h3>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Deskripsi Singkat Footer</label>
              <textarea
                rows={3}
                required
                value={footer.deskripsi}
                onChange={(e) => setFooter({ ...footer, deskripsi: e.target.value })}
                className={inputCls + " resize-none"}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Teks Copyright</label>
              <input
                type="text"
                required
                value={footer.copyright}
                onChange={(e) => setFooter({ ...footer, copyright: e.target.value })}
                className={inputCls}
                placeholder="Contoh: D4 Teknik Listrik - Politeknik Negeri Manado"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Simbol © dan tahun saat ini akan ditambahkan secara otomatis.</span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-50">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md cursor-pointer"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Footer"}
            </button>
          </div>
        </form>
      )}

      {/* Editor Modal for List-items */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title=""
      >
        {null}
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
        title="Hapus Data"
        message="Hapus item konfigurasi ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  );
}
