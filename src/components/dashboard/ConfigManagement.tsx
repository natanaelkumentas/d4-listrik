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

interface VisiMisiRow {
  id: string;
  tipe: "visi" | "misi" | "tujuan";
  konten: string;
  urutan: number;
}

interface DosenOption {
  id: string;
  nama: string;
}

export default function ConfigManagement() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState<"prodi" | "visimisi" | "sambutan" | "footer">("prodi");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const [visiMisiList, setVisiMisiList] = useState<VisiMisiRow[]>([]);
  const [kontakList, setKontakList] = useState<any[]>([]);

  // Search & Pagination states
  const [visimisiSearchQuery, setVisimisiSearchQuery] = useState("");
  const [visimisiPage, setVisimisiPage] = useState(1);
  const [visimisiPageSize, setVisimisiPageSize] = useState(10);

  // Modal / Editor states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"visimisi" | "kontak" | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [visiMisiForm, setVisiMisiForm] = useState({
    tipe: "visi" as "visi" | "misi" | "tujuan",
    konten: "",
    urutan: 1,
  });

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
        if (configData.visi_misi_tujuan) {
          const mapped = configData.visi_misi_tujuan.map((row: any) => ({
            id: row.id,
            tipe: row.kategori,
            konten: row.konten,
            urutan: row.urutan,
          }));
          setVisiMisiList(mapped);
        }
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

  // Save prodi info & logo
  const handleSaveProdi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const mappedProdiInfo = {
        nama: prodiInfo.nama_prodi,
        nama_alternatif: prodiInfo.nama_prodi_alt,
        nama_kampus: prodiInfo.kampus,
        deskripsi: prodiInfo.deskripsi,
        hero_bg_url: prodiInfo.hero_bg_url || null,
      };
      const mappedLogo = {
        file_url: logo.logo_url || "",
        alt_text: "Logo",
      };

      const p1 = fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "prodi_info", data: mappedProdiInfo }),
      });
      const p2 = fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "logo", data: mappedLogo }),
      });

      await Promise.all([p1, p2]);
      invalidateCache("/api/config");
      await fetchData();
      showSuccess("Informasi Prodi, Logo, & Foto Latar berhasil disimpan!");
      router.refresh();
    } catch (err) {
      console.error(err);
      showError("Gagal menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
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
        showSuccess("Logo berhasil diupload!");
      } else {
        showError("Gagal mengupload logo.");
      }
    } catch (err) {
      console.error("Upload logo failed", err);
    } finally {
      setIsSubmitting(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  // Hero Background upload
  const handleHeroBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
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
        showSuccess("Foto latar hero berhasil diupload!");
      } else {
        showError("Gagal mengunggah foto latar.");
      }
    } catch (err) {
      console.error("Upload hero background failed", err);
      showError("Terjadi kesalahan saat mengunggah.");
    } finally {
      setIsSubmitting(false);
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



  // Visi Misi Operations
  const getNextUrutan = (tipe: "visi" | "misi" | "tujuan") => {
    const items = visiMisiList.filter((item) => item.tipe === tipe);
    if (items.length === 0) return 1;
    return Math.max(...items.map((i) => i.urutan)) + 1;
  };

  const handleOpenVisiMisiAddType = (tipe: "visi" | "misi" | "tujuan") => {
    setEditingId(null);
    setVisiMisiForm({
      tipe,
      konten: "",
      urutan: getNextUrutan(tipe),
    });
    setModalType("visimisi");
    setIsModalOpen(true);
  };

  const handleOpenVisiMisiEdit = (row: VisiMisiRow) => {
    setEditingId(row.id);
    setVisiMisiForm({
      tipe: row.tipe,
      konten: row.konten,
      urutan: row.urutan,
    });
    setModalType("visimisi");
    setIsModalOpen(true);
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
      let payload: any = { section: modalType === "visimisi" ? "visi_misi_tujuan" : modalType };



      let dataToSubmit: any = {};
      if (modalType === "visimisi") {
        dataToSubmit = {
          kategori: visiMisiForm.tipe,
          konten: visiMisiForm.konten,
          urutan: visiMisiForm.urutan,
        };
      } else if (modalType === "kontak") {
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



  const filteredVisiMisi = visiMisiList.filter(item => {
    const q = visimisiSearchQuery.toLowerCase();
    return (
      item.tipe.toLowerCase().includes(q) ||
      item.konten.toLowerCase().includes(q) ||
      String(item.urutan).includes(q)
    );
  });
  const totalVisiMisiEntries = filteredVisiMisi.length;
  const totalVisiMisiPages = Math.ceil(totalVisiMisiEntries / visimisiPageSize);
  const paginatedVisiMisi = filteredVisiMisi.slice(
    (visimisiPage - 1) * visimisiPageSize,
    visimisiPage * visimisiPageSize
  );

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
          onClick={() => setActiveTab("visimisi")}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors cursor-pointer ${
            activeTab === "visimisi"
              ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          Visi, Misi & Tujuan
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
        <form onSubmit={handleSaveProdi} className="space-y-6 max-w-2xl">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
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
                rows={4}
                required
                value={prodiInfo.deskripsi}
                onChange={(e) => setProdiInfo({ ...prodiInfo, deskripsi: e.target.value })}
                className={inputCls + " resize-none"}
              />
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
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
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <UploadIcon className="w-4 h-4" /> Ganti Logo
                </button>
                {logo.logo_url && (
                  <button
                    type="button"
                    onClick={() => setLogo({ logo_url: "" })}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 bg-white hover:bg-red-50 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <TrashIcon className="w-4 h-4" /> Hapus Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
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
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <UploadIcon className="w-4 h-4" /> Unggah Foto Latar
                </button>
                {prodiInfo.hero_bg_url && (
                  <button
                    type="button"
                    onClick={() => setProdiInfo({ ...prodiInfo, hero_bg_url: "" })}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 bg-white hover:bg-red-50 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <TrashIcon className="w-4 h-4" /> Hapus Foto Latar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-50">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md cursor-pointer"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      )}



      {/* VISI MISI TAB */}
      {activeTab === "visimisi" && (() => {
        const visiItems = visiMisiList.filter((item) => item.tipe === "visi").sort((a, b) => a.urutan - b.urutan);
        const misiItems = visiMisiList.filter((item) => item.tipe === "misi").sort((a, b) => a.urutan - b.urutan);
        const tujuanItems = visiMisiList.filter((item) => item.tipe === "tujuan").sort((a, b) => a.urutan - b.urutan);

        return (
          <div className="space-y-8">
            <div>
              <h3 className="font-bold text-primary-950 text-lg">Visi, Misi &amp; Tujuan Prodi</h3>
              <p className="text-gray-500 text-xs mt-1">Kelola poin visi, misi, dan tujuan program studi yang tampil pada halaman profil.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* TABEL VISI */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <div>
                    <h4 className="font-bold text-primary-950 text-base">Visi Program Studi</h4>
                    <p className="text-gray-500 text-xs mt-0.5">Visi utama program studi.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenVisiMisiAddType("visi")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    <PlusIcon className="w-3.5 h-3.5" /> Tambah Visi
                  </button>
                </div>

                <div className="overflow-hidden border border-gray-100 rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary-50/30">
                        <th className="text-left px-4 py-2.5 font-bold text-primary-900 w-16">No</th>
                        <th className="text-left px-4 py-2.5 font-bold text-primary-900">Konten / Uraian</th>
                        <th className="text-right px-4 py-2.5 font-bold text-primary-900 w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiItems.map((item, idx) => (
                        <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50/20">
                          <td className="px-4 py-3 text-gray-500 font-medium">{idx + 1}</td>
                          <td className="px-4 py-3 text-gray-700 leading-relaxed text-xs sm:text-sm">{item.konten}</td>
                          <td className="px-4 py-3 text-right space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenVisiMisiEdit(item)}
                              className="inline-flex items-center justify-center p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 cursor-pointer"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(item.id, "visi_misi_tujuan")}
                              className="inline-flex items-center justify-center p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {visiItems.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">
                            Belum ada data visi.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABEL MISI */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <div>
                    <h4 className="font-bold text-primary-950 text-base">Misi Program Studi</h4>
                    <p className="text-gray-500 text-xs mt-0.5">Daftar misi program studi.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenVisiMisiAddType("misi")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    <PlusIcon className="w-3.5 h-3.5" /> Tambah Misi
                  </button>
                </div>

                <div className="overflow-hidden border border-gray-100 rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary-50/30">
                        <th className="text-left px-4 py-2.5 font-bold text-primary-900 w-16">No</th>
                        <th className="text-left px-4 py-2.5 font-bold text-primary-900">Konten / Uraian</th>
                        <th className="text-right px-4 py-2.5 font-bold text-primary-900 w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {misiItems.map((item, idx) => (
                        <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50/20">
                          <td className="px-4 py-3 text-gray-500 font-medium">{idx + 1}</td>
                          <td className="px-4 py-3 text-gray-700 leading-relaxed text-xs sm:text-sm">{item.konten}</td>
                          <td className="px-4 py-3 text-right space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenVisiMisiEdit(item)}
                              className="inline-flex items-center justify-center p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 cursor-pointer"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(item.id, "visi_misi_tujuan")}
                              className="inline-flex items-center justify-center p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {misiItems.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">
                            Belum ada data misi.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABEL TUJUAN */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <div>
                    <h4 className="font-bold text-primary-950 text-base">Tujuan Program Studi</h4>
                    <p className="text-gray-500 text-xs mt-0.5">Daftar tujuan program studi.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenVisiMisiAddType("tujuan")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    <PlusIcon className="w-3.5 h-3.5" /> Tambah Tujuan
                  </button>
                </div>

                <div className="overflow-hidden border border-gray-100 rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary-50/30">
                        <th className="text-left px-4 py-2.5 font-bold text-primary-900 w-16">No</th>
                        <th className="text-left px-4 py-2.5 font-bold text-primary-900">Konten / Uraian</th>
                        <th className="text-right px-4 py-2.5 font-bold text-primary-900 w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tujuanItems.map((item, idx) => (
                        <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50/20">
                          <td className="px-4 py-3 text-gray-500 font-medium">{idx + 1}</td>
                          <td className="px-4 py-3 text-gray-700 leading-relaxed text-xs sm:text-sm">{item.konten}</td>
                          <td className="px-4 py-3 text-right space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenVisiMisiEdit(item)}
                              className="inline-flex items-center justify-center p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 cursor-pointer"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(item.id, "visi_misi_tujuan")}
                              className="inline-flex items-center justify-center p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {tujuanItems.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">
                            Belum ada data tujuan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
        title={
          modalType === "visimisi"
            ? editingId
              ? `Edit ${visiMisiForm.tipe === "visi" ? "Visi" : visiMisiForm.tipe === "misi" ? "Misi" : "Tujuan"}`
              : `Tambah ${visiMisiForm.tipe === "visi" ? "Visi" : visiMisiForm.tipe === "misi" ? "Misi" : "Tujuan"}`
            : ""
        }
      >

        {modalType === "visimisi" && (
          <form onSubmit={handleModalSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Uraian / Teks</label>
              <textarea
                rows={4}
                required
                value={visiMisiForm.konten}
                onChange={(e) => setVisiMisiForm({ ...visiMisiForm, konten: e.target.value })}
                className={inputCls + " resize-none"}
                placeholder={`Masukkan konten ${visiMisiForm.tipe}...`}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        )}
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
