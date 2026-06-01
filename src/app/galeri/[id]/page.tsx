"use client";

import { useEffect, useState } from "react";
import { useData } from "@/context/DataContext";
import { notFound, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  HiArrowLeft,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineBookOpen,
  HiOutlineBuildingOffice,
  HiOutlineIdentification,
  HiOutlineLink,
  HiOutlineUserGroup,
  HiOutlineMapPin
} from "react-icons/hi2";
import { GaleriItem } from "@/types/galeri";
import { cachedFetch } from "@/lib/fetchCache";

const jenisLabels: Record<string, string> = {
  publikasi: "Publikasi",
  penelitian: "Penelitian",
  pengabdian: "Pengabdian",
  bukuAjar: "Buku Ajar",
};

const jenisGradients: Record<string, string> = {
  publikasi: "from-primary-700 to-primary-900",
  penelitian: "from-primary-700 to-primary-900",
  pengabdian: "from-primary-700 to-primary-900",
  bukuAjar: "from-primary-700 to-primary-900",
};

function PersonBadgeList({ title, persons }: { title: string, persons: any }) {
  if (!persons) return null;
  const pList = Array.isArray(persons) ? persons : [persons];
  if (pList.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {pList.map((p: any, i: number) => (
          p.id ? (
            <Link key={i} href={`/staf/${p.id}`} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 font-medium text-sm transition-colors shadow-sm">
              <HiOutlineUserGroup className="mr-1.5" />
              {p.nama}
            </Link>
          ) : (
            <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 font-medium text-sm border border-gray-200">
              {p.nama}
            </span>
          )
        ))}
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 min-w-[200px]">
      <div className="mt-0.5 text-primary-500 flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <div className="text-gray-800 font-medium mt-1 text-sm sm:text-base break-words">{value}</div>
      </div>
    </div>
  );
}

export default function GaleriDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { dosenList, ensureDosenLoaded } = useData();
  
  const [karyaItem, setKaryaItem] = useState<GaleriItem | null>(null);
  const [originalKarya, setOriginalKarya] = useState<any | null>(null);
  const [isKaryaLoading, setIsKaryaLoading] = useState(false);

  const [kegiatanItem, setKegiatanItem] = useState<GaleriItem | null>(null);
  const [originalKegiatan, setOriginalKegiatan] = useState<any | null>(null);
  const [isKegiatanLoading, setIsKegiatanLoading] = useState(false);

  const [fasilitasItem, setFasilitasItem] = useState<GaleriItem | null>(null);
  const [originalFasilitas, setOriginalFasilitas] = useState<any | null>(null);
  const [isFasilitasLoading, setIsFasilitasLoading] = useState(false);

  useEffect(() => {
    ensureDosenLoaded();
  }, [ensureDosenLoaded]);

  // If it's a karya-prefixed ID, fetch from karya API
  const isKarya = id.startsWith("karya-");
  const realKaryaId = isKarya ? id.replace("karya-", "") : null;

  // If it's a kegiatan-prefixed ID, fetch from kegiatan API
  const isKegiatan = id.startsWith("kegiatan-");
  const realKegiatanId = isKegiatan ? id.replace("kegiatan-", "") : null;

  // If it's a fasilitas-prefixed ID, fetch from fasilitas API
  const isFasilitas = id.startsWith("fasilitas-");
  const realFasilitasId = isFasilitas ? id.replace("fasilitas-", "") : null;

  useEffect(() => {
    if (!isKarya || !realKaryaId) return;
    setIsKaryaLoading(true);
    cachedFetch<any[]>("/api/karya")
      .then((karyaList) => {
        if (!karyaList) return;
        const k = karyaList.find((karya: any) => karya.id === realKaryaId);
        if (k) {
          setOriginalKarya(k);
          setKaryaItem({
            id: `karya-${k.id}`,
            judul: k.judul,
            deskripsi: k.deskripsi || "",
            tanggal: `${k.tahun}-01-01`,
            kategori: "tridharma",
            foto: k.foto_urls || [],
            warna: jenisGradients[k.jenis] || "from-blue-600 to-indigo-700",
            subLabel: jenisLabels[k.jenis] || k.jenis,
          });
        }
      })
      .catch((err) => console.error("Failed to fetch karya detail", err))
      .finally(() => setIsKaryaLoading(false));
  }, [isKarya, realKaryaId]);

  useEffect(() => {
    if (!isKegiatan || !realKegiatanId) return;
    setIsKegiatanLoading(true);
    cachedFetch<any[]>("/api/kegiatan")
      .then((kegiatanList) => {
        if (!kegiatanList) return;
        const k = kegiatanList.find((item: any) => item.id === realKegiatanId);
        if (k) {
          setOriginalKegiatan(k);
          setKegiatanItem({
            id: `kegiatan-${k.id}`,
            judul: k.nama,
            deskripsi: k.deskripsi || "",
            tanggal: k.tanggal,
            kategori: "kegiatan",
            foto: k.foto_urls || [],
            warna: "from-primary-700 to-primary-900",
            subLabel: k.kategori,
          });
        }
      })
      .catch((err) => console.error("Failed to fetch kegiatan detail", err))
      .finally(() => setIsKegiatanLoading(false));
  }, [isKegiatan, realKegiatanId]);

  useEffect(() => {
    if (!isFasilitas || !realFasilitasId) return;
    setIsFasilitasLoading(true);
    cachedFetch<any[]>("/api/fasilitas")
      .then((fasList) => {
        if (!fasList) return;
        const f = fasList.find((item: any) => item.id === realFasilitasId);
        if (f) {
          setOriginalFasilitas(f);
          const photos = Array.isArray(f.foto_urls) && f.foto_urls.length > 0
            ? f.foto_urls
            : ["/images/default.svg"];
          setFasilitasItem({
            id: `fasilitas-${f.id}`,
            judul: f.nama,
            deskripsi: f.deskripsi || "",
            tanggal: f.created_at || new Date().toISOString(),
            kategori: "fasilitas",
            foto: photos,
            warna: "from-primary-700 to-primary-900",
            subLabel: f.no_ruangan ? `Ruang ${f.no_ruangan}` : "Fasilitas Lab",
          });
        }
      })
      .catch((err) => console.error("Failed to fetch fasilitas detail", err))
      .finally(() => setIsFasilitasLoading(false));
  }, [isFasilitas, realFasilitasId]);

  const item = isKarya
    ? karyaItem
    : isKegiatan
      ? kegiatanItem
      : fasilitasItem;

  const isLoading = isKarya
    ? isKaryaLoading
    : isKegiatan
      ? isKegiatanLoading
      : isFasilitasLoading;

  if (isLoading) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-500 font-medium animate-pulse">Loading Galeri...</p>
    </div>
  );

  if (!item) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Galeri Tidak Ditemukan</h1>
      <Link href="/galeri" className="text-primary-600 hover:underline">Kembali ke galeri</Link>
    </div>
  );

  const dateObj = new Date(item.tanggal);
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(dateObj);

  const categoryLabel = item.kategori === "fasilitas"
    ? "Fasilitas"
    : item.kategori === "kegiatan"
      ? `Kegiatan · ${item.subLabel}`
      : item.subLabel
        ? `Tridharma · ${item.subLabel}`
        : "Tridharma";

  // === Karya dosen-linking helpers ===
  const linkPenulisList = (persons: any[] | undefined): any[] => {
    if (!originalKarya) return [];
    const k = originalKarya;
    const list = persons ? (Array.isArray(persons) ? [...persons] : [persons]) : [];
    const uploader = dosenList.find(d => d.id === k.dosen_id);
    if (uploader) {
      const isSameAsUploader = (p: any) => {
        if (p.id === uploader.id) return true;
        const cleanPName = p.nama.split(",")[0].trim().toLowerCase();
        const cleanUploaderName = uploader.nama.split(",")[0].trim().toLowerCase();
        return cleanPName === cleanUploaderName || cleanUploaderName.includes(cleanPName) || cleanPName.includes(cleanUploaderName);
      };
      const uploaderIndex = list.findIndex(isSameAsUploader);
      if (uploaderIndex !== -1) {
        list[uploaderIndex] = { id: uploader.id, nama: uploader.nama };
      } else {
        list.unshift({ id: uploader.id, nama: uploader.nama });
      }
    }
    return list.map(p => {
      if (p.id) {
        const match = dosenList.find(d => d.id === p.id);
        if (match) return { id: match.id, nama: match.nama };
        return p;
      }
      const cleanName = p.nama.split(",")[0].trim().toLowerCase();
      const match = dosenList.find(d => {
        const cleanDosenName = d.nama.split(",")[0].trim().toLowerCase();
        return cleanDosenName === cleanName || cleanDosenName.includes(cleanName);
      });
      if (match) return { id: match.id, nama: match.nama };
      return p;
    });
  };

  const linkSinglePerson = (person: any | undefined): any => {
    if (!originalKarya) return null;
    const k = originalKarya;
    if (!person) {
      const uploader = dosenList.find(d => d.id === k.dosen_id);
      return uploader ? { id: uploader.id, nama: uploader.nama } : { id: "", nama: "Dosen" };
    }
    if (person.id) {
      const match = dosenList.find(d => d.id === person.id);
      if (match) return { id: match.id, nama: match.nama };
      return person;
    }
    const cleanName = person.nama.split(",")[0].trim().toLowerCase();
    const match = dosenList.find(d => {
      const cleanDosenName = d.nama.split(",")[0].trim().toLowerCase();
      return cleanDosenName === cleanName || cleanDosenName.includes(cleanName);
    });
    if (match) return { id: match.id, nama: match.nama };
    return person;
  };

  const linkAnggotaList = (persons: any[] | undefined): any[] => {
    const list = persons ? (Array.isArray(persons) ? [...persons] : [persons]) : [];
    return list.map(p => {
      if (p.id) {
        const match = dosenList.find(d => d.id === p.id);
        if (match) return { id: match.id, nama: match.nama };
        return p;
      }
      const cleanName = p.nama.split(",")[0].trim().toLowerCase();
      const match = dosenList.find(d => {
        const cleanDosenName = d.nama.split(",")[0].trim().toLowerCase();
        return cleanDosenName === cleanName || cleanDosenName.includes(cleanName);
      });
      if (match) return { id: match.id, nama: match.nama };
      return p;
    });
  };

  // === Karya: meta info shown under title ===
  const getKaryaMetaInfo = () => {
    if (!originalKarya) return null;
    const k = originalKarya;
    const md = k.metadata || {};
    const meta = (key: string) => md[key] ?? k[key];

    switch (k.jenis) {
      case "publikasi": {
        const jurnal = meta("jurnal");
        const link = meta("link");
        return (
          <>
            {jurnal && <InfoItem icon={HiOutlineBookOpen} label="Jurnal / Konferensi" value={jurnal} />}
            {link && (
              <div className="flex items-start gap-3 min-w-[200px]">
                <div className="mt-0.5 text-primary-500 flex-shrink-0">
                  <HiOutlineLink className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tautan</p>
                  <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-600 hover:underline font-medium text-sm sm:text-base mt-1 truncate">
                    Kunjungi Publikasi
                  </a>
                </div>
              </div>
            )}
          </>
        );
      }
      case "penelitian": {
        const sumberDana = meta("sumberDana");
        return <>{sumberDana && <InfoItem icon={HiOutlineBuildingOffice} label="Sumber Dana" value={sumberDana} />}</>;
      }
      case "pengabdian": {
        const mitra = meta("mitra");
        return <>{mitra && <InfoItem icon={HiOutlineBuildingOffice} label="Mitra" value={mitra} />}</>;
      }
      case "bukuAjar": {
        const penerbit = meta("penerbit");
        const isbn = meta("isbn");
        return (
          <>
            {penerbit && <InfoItem icon={HiOutlineBuildingOffice} label="Penerbit" value={penerbit} />}
            {isbn && <InfoItem icon={HiOutlineIdentification} label="ISBN" value={isbn} />}
          </>
        );
      }
      default:
        return null;
    }
  };

  // === Karya: dosen sidebar shown beside description ===
  const getKaryaDosenSidebar = () => {
    if (!originalKarya) return null;
    const k = originalKarya;
    const md = k.metadata || {};
    const meta = (key: string) => md[key] ?? k[key];

    let sections: { title: string; persons: any[] }[] = [];

    switch (k.jenis) {
      case "publikasi": {
        const penulis = linkPenulisList(meta("penulis"));
        if (penulis.length > 0) sections.push({ title: "Penulis", persons: penulis });
        break;
      }
      case "penelitian": {
        const ketua = linkSinglePerson(meta("ketua"));
        const anggota = linkAnggotaList(meta("anggota"));
        if (ketua) sections.push({ title: "Ketua Peneliti", persons: [ketua] });
        if (anggota.length > 0) sections.push({ title: "Anggota", persons: anggota });
        break;
      }
      case "pengabdian": {
        const ketua = linkSinglePerson(meta("ketua"));
        const anggota = linkAnggotaList(meta("anggota"));
        if (ketua) sections.push({ title: "Ketua", persons: [ketua] });
        if (anggota.length > 0) sections.push({ title: "Anggota", persons: anggota });
        break;
      }
      case "bukuAjar": {
        const penulis = linkPenulisList(meta("penulis"));
        if (penulis.length > 0) sections.push({ title: "Penulis", persons: penulis });
        break;
      }
    }

    if (sections.length === 0) return null;

    return (
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 h-fit">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Dosen Terkait</h3>
        <div className="space-y-4">
          {sections.map((section, i) => (
            <div key={i}>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{section.title}</p>
              <div className="flex flex-col gap-1.5">
                {section.persons.map((p: any, j: number) => (
                  p.id ? (
                    <Link key={j} href={`/staf/${p.id}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 text-primary-700 hover:bg-primary-50 font-medium text-sm transition-colors shadow-sm">
                      <HiOutlineUserGroup className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{p.nama}</span>
                    </Link>
                  ) : (
                    <span key={j} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 text-gray-600 font-medium text-sm">
                      <HiOutlineUserGroup className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{p.nama}</span>
                    </span>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <section className={`bg-gradient-to-br ${item.warna} pt-24 pb-8 min-h-[250px]`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" />
      </section>

      <section className="py-10 -mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in-up">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/galeri");
                }
              }}
              className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white font-medium mb-6 transition-colors drop-shadow-md cursor-pointer bg-transparent border-0"
            >
              <HiArrowLeft className="w-4 h-4" />
              Kembali ke Galeri
            </button>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
              {/* === 1. TITLE + META INFO === */}
              <div className="p-6 sm:p-10 border-b border-gray-100 bg-gray-50/50">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wider mb-4">
                  <HiOutlineTag className="w-3.5 h-3.5" />
                  {categoryLabel}
                </span>

                <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 leading-tight mb-6">
                  {item.judul}
                </h1>

                {/* Meta columns arranged horizontally */}
                <div className="flex flex-wrap gap-x-8 gap-y-6 pt-6 border-t border-gray-100">
                  {/* Date Column */}
                  <InfoItem icon={HiOutlineCalendar} label="Tanggal / Tahun" value={formattedDate} />

                  {/* Kegiatan Location */}
                  {isKegiatan && originalKegiatan?.lokasi && (
                    <InfoItem icon={HiOutlineMapPin} label="Lokasi" value={originalKegiatan.lokasi} />
                  )}

                  {/* Karya Specific Meta Fields */}
                  {isKarya && getKaryaMetaInfo()}

                  {/* Fasilitas Specific Meta Fields */}
                  {isFasilitas && originalFasilitas && (
                    <>
                      {originalFasilitas.no_ruangan && (
                        <InfoItem icon={HiOutlineBuildingOffice} label="Nomor Ruangan" value={`Ruang ${originalFasilitas.no_ruangan}`} />
                      )}
                      {originalFasilitas.kepala_lab && (
                        <InfoItem 
                          icon={HiOutlineUserGroup} 
                          label="Kepala Lab / Ruang" 
                          value={(() => {
                            const cleanName = originalFasilitas.kepala_lab.split(",")[0].trim().toLowerCase();
                            const matched = dosenList.find((d) => {
                              const cleanDosenName = d.nama.split(",")[0].trim().toLowerCase();
                              return cleanDosenName === cleanName || cleanDosenName.includes(cleanName) || cleanName.includes(cleanDosenName);
                            });
                            if (matched) {
                              return (
                                <Link href={`/staf/${matched.id}`} className="text-primary-600 hover:underline hover:text-primary-700 transition-colors font-semibold">
                                  {originalFasilitas.kepala_lab}
                                </Link>
                              );
                            }
                            return originalFasilitas.kepala_lab;
                          })()} 
                        />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* === 3. DESCRIPTION (with dosen sidebar for karya) === */}
              <div className="p-6 sm:p-10 border-b border-gray-100">
                {isKarya ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Deskripsi</h2>
                      <p className="text-gray-600 text-base leading-relaxed whitespace-pre-wrap">
                        {item.deskripsi || "Tidak ada deskripsi."}
                      </p>
                    </div>
                    <div className="lg:col-span-1">
                      {getKaryaDosenSidebar()}
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Deskripsi</h2>
                    <p className="text-gray-600 text-base leading-relaxed whitespace-pre-wrap">
                      {item.deskripsi || "Tidak ada deskripsi."}
                    </p>
                  </>
                )}
              </div>

              {/* === 4. PHOTOS === */}
              <div className="p-6 sm:p-10 bg-white">
                {isKarya && originalKarya?.jenis === "bukuAjar" && (originalKarya.metadata?.sampul_depan || originalKarya.metadata?.sampul_belakang) && (
                  <div className="mb-10">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Sampul Buku</h3>
                    <div className="flex flex-wrap gap-8 justify-start">
                      {originalKarya.metadata?.sampul_depan && (
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-semibold text-gray-500 mb-2">Sampul Depan</span>
                          <div className="relative w-40 h-56 sm:w-48 sm:h-64 rounded-xl overflow-hidden shadow-md border border-gray-200 bg-gray-50">
                            <img
                              src={originalKarya.metadata.sampul_depan as string}
                              alt="Sampul Depan"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                      {originalKarya.metadata?.sampul_belakang && (
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-semibold text-gray-500 mb-2">Sampul Belakang</span>
                          <div className="relative w-40 h-56 sm:w-48 sm:h-64 rounded-xl overflow-hidden shadow-md border border-gray-200 bg-gray-50">
                            <img
                              src={originalKarya.metadata.sampul_belakang as string}
                              alt="Sampul Belakang"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Dokumentasi Terkait</h2>

                {(!item.foto || item.foto.length === 0) ? (
                  <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <img
                      src="/images/default.svg"
                      alt="Placeholder"
                      className="w-full h-auto object-cover aspect-video opacity-20"
                    />
                  </div>
                ) : (
                  <div className={`grid gap-6 ${item.foto.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {item.foto.map((url, idx) => (
                      <div key={idx} className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100 group">
                        <img
                          src={url}
                          alt={`${item.judul} - Foto ${idx + 1}`}
                          className="w-full h-auto object-cover aspect-video group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

