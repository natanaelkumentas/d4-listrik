"use client";

import { useEffect } from "react";
import { useData } from "@/context/DataContext";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { KaryaCategory, karyaCategoryLabels, KaryaItem, PersonLink, Publikasi, Penelitian, Pengabdian, BukuAjar, Hki, Sertifikasi } from "@/types/dosen";
import { HiArrowLeft, HiOutlineCalendar, HiOutlineDocumentText, HiOutlineLink, HiOutlineBuildingOffice, HiOutlineIdentification, HiOutlineBookOpen, HiOutlineUserGroup } from "react-icons/hi2";

function PersonBadgeList({ title, persons }: { title: string, persons: PersonLink | PersonLink[] }) {
  if (!persons) return null;
  const pList = Array.isArray(persons) ? persons : [persons];
  if (pList.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {pList.map((p, i) => (
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

function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 min-w-[200px]">
      <div className="mt-0.5 text-primary-500 flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-gray-800 font-medium mt-1 text-sm sm:text-base break-words">{value}</p>
      </div>
    </div>
  );
}

export default function KaryaDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const kategori = params.kategori as string;
  const karyaId = params.karyaId as string;

  const { dosenList, ensureDosenLoaded } = useData();

  useEffect(() => { ensureDosenLoaded(); }, [ensureDosenLoaded]);

  const dosen = dosenList.find((d) => d.id === id);

  if (!dosen) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dosen Tidak Ditemukan</h1>
      <Link href="/staf" className="text-primary-600 hover:underline">Kembali</Link>
    </div>
  );

  const validCategories = ["publikasi", "penelitian", "pengabdian", "bukuAjar", "hki", "sertifikasi"];
  if (!validCategories.includes(kategori)) notFound();

  const cat = kategori as KaryaCategory;
  // If the `karya` structure is an array (our new simple CRUD)
  // Or it could be an object with categories (from old mock data).
  // I need to handle both since the simple CRUD created `dosen.karya: KaryaItem[]` 
  // but the original data has `dosen.karya: { publikasi: Publikasi[], ... }`
  let karya: KaryaItem | undefined;
  
  if (Array.isArray(dosen.karya)) {
    // New CRUD format
    karya = dosen.karya.find((k) => k.id === karyaId && k.kategori === kategori);
  } else if (dosen.karya && typeof dosen.karya === 'object') {
    // Old format
    const items = dosen.karya[cat] || [];
    karya = items.find((k: KaryaItem) => k.id === karyaId);
  }

  if (!karya) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Karya Tidak Ditemukan</h1>
      <Link href={`/staf/${id}`} className="text-primary-600 hover:underline">Kembali ke profil</Link>
    </div>
  );

  // Ensure all registered dosen are linked and the creator/uploader is present
  const linkPenulisList = (persons: PersonLink | PersonLink[] | undefined): PersonLink[] => {
    const list = persons ? (Array.isArray(persons) ? [...persons] : [persons]) : [];
    const uploader = dosenList.find(d => d.id === (karya as any)?.dosen_id);
    if (uploader) {
      const isSameAsUploader = (p: PersonLink) => {
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

  const linkSinglePerson = (person: PersonLink | undefined): PersonLink => {
    if (!person) {
      const uploader = dosenList.find(d => d.id === (karya as any)?.dosen_id);
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

  const linkAnggotaList = (persons: PersonLink | PersonLink[] | undefined): PersonLink[] => {
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
    const jenis = karya?.jenis || kategori;
    const md = (karya as any)?.metadata || {};
    const meta = (key: string) => md[key] ?? (karya as any)?.[key];

    switch (jenis) {
      case "publikasi": {
        const jurnal = meta("jurnal") as string | undefined;
        const link = meta("link") as string | undefined;
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
        const sumberDana = meta("sumberDana") as string | undefined;
        return <>{sumberDana && <InfoItem icon={HiOutlineBuildingOffice} label="Sumber Dana" value={sumberDana} />}</>;
      }
      case "pengabdian": {
        const mitra = meta("mitra") as string | undefined;
        return <>{mitra && <InfoItem icon={HiOutlineBuildingOffice} label="Mitra" value={mitra} />}</>;
      }
      case "bukuAjar": {
        const penerbit = meta("penerbit") as string | undefined;
        const isbn = meta("isbn") as string | undefined;
        return (
          <>
            {penerbit && <InfoItem icon={HiOutlineBuildingOffice} label="Penerbit" value={penerbit} />}
            {isbn && <InfoItem icon={HiOutlineIdentification} label="ISBN" value={isbn} />}
          </>
        );
      }
      case "hki": {
        const jenisHki = meta("jenisHki") as string | undefined;
        const nomorSertifikat = meta("nomorSertifikat") as string | undefined;
        return (
          <>
            {jenisHki && <InfoItem icon={HiOutlineDocumentText} label="Jenis HKI" value={jenisHki} />}
            {nomorSertifikat && <InfoItem icon={HiOutlineIdentification} label="Nomor Sertifikat" value={nomorSertifikat} />}
          </>
        );
      }
      case "sertifikasi": {
        const penyelenggara = meta("penyelenggara") as string | undefined;
        const linkSertifikat = meta("linkSertifikat") as string | undefined;
        return (
          <>
            {penyelenggara && <InfoItem icon={HiOutlineBuildingOffice} label="Penyelenggara / Lembaga" value={penyelenggara} />}
            {linkSertifikat && (
              <div className="flex items-start gap-3 min-w-[200px]">
                <div className="mt-0.5 text-primary-500 flex-shrink-0">
                  <HiOutlineDocumentText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tautan Sertifikat</p>
                  <a href={linkSertifikat} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-600 hover:underline font-medium text-sm sm:text-base mt-1 truncate">
                    Lihat Selengkapnya
                  </a>
                </div>
              </div>
            )}
          </>
        );
      }
      default:
        return null;
    }
  };

  // === Karya: dosen sidebar shown beside description ===
  const getKaryaDosenSidebar = () => {
    const jenis = karya?.jenis || kategori;
    const md = (karya as any)?.metadata || {};
    const meta = (key: string) => md[key] ?? (karya as any)?.[key];

    let sections: { title: string; persons: PersonLink[] }[] = [];

    switch (jenis) {
      case "publikasi": {
        const penulis = linkPenulisList(meta("penulis") as PersonLink | PersonLink[] | undefined);
        if (penulis.length > 0) sections.push({ title: "Penulis", persons: penulis });
        break;
      }
      case "penelitian": {
        const ketua = linkSinglePerson(meta("ketua") as PersonLink | undefined);
        const anggota = linkAnggotaList(meta("anggota") as PersonLink[] | undefined);
        if (ketua) sections.push({ title: "Ketua Peneliti", persons: [ketua] });
        if (anggota.length > 0) sections.push({ title: "Anggota", persons: anggota });
        break;
      }
      case "pengabdian": {
        const ketua = linkSinglePerson(meta("ketua") as PersonLink | undefined);
        const anggota = linkAnggotaList(meta("anggota") as PersonLink[] | undefined);
        if (ketua) sections.push({ title: "Ketua", persons: [ketua] });
        if (anggota.length > 0) sections.push({ title: "Anggota", persons: anggota });
        break;
      }
      case "bukuAjar": {
        const penulis = linkPenulisList(meta("penulis") as PersonLink | PersonLink[] | undefined);
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
                {section.persons.map((p, j) => (
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

  const photos = (karya as any).foto_urls || [];
  const md = (karya as any).metadata || {};
  const sampulDepan = md.sampul_depan as string | undefined;
  const sampulBelakang = md.sampul_belakang as string | undefined;

  return (
    <>
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 pt-24 pb-8 min-h-[200px]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8" />
      </section>

      <section className="py-10 -mt-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in-up">
            <Link
              href={`/staf/${id}`}
              className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white font-medium mb-6 transition-colors drop-shadow-md"
            >
              <HiArrowLeft className="w-4 h-4" />
              Kembali ke Profil {dosen.nama}
            </Link>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
              {/* === 1. TITLE + META INFO === */}
              <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wider mb-4">
                  {karyaCategoryLabels[cat] || cat}
                </span>

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 leading-tight mb-6">
                  {karya.judul}
                </h1>

                {/* Meta columns arranged horizontally */}
                <div className="flex flex-wrap gap-x-8 gap-y-6 pt-6 border-t border-gray-100">
                  {/* Year Column */}
                  <InfoItem icon={HiOutlineCalendar} label="Tahun" value={String(karya.tahun)} />

                  {/* Other Meta Fields */}
                  {getKaryaMetaInfo()}
                </div>
              </div>

              {/* === 2. DESCRIPTION + DOSEN SIDEBAR === */}
              <div className="p-6 sm:p-8 border-b border-gray-100">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Deskripsi</h2>
                    <p className="text-gray-600 text-base leading-relaxed whitespace-pre-wrap">
                      {karya.deskripsi || "Tidak ada deskripsi."}
                    </p>
                  </div>
                  <div className="lg:col-span-1">
                    {getKaryaDosenSidebar()}
                  </div>
                </div>
              </div>

              {/* === 3. BOOK COVERS (if any) === */}
              {kategori === "bukuAjar" && (sampulDepan || sampulBelakang) && (
                <div className="p-6 sm:p-8 border-b border-gray-100 bg-white">
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Sampul Buku</h2>
                  <div className="flex flex-wrap gap-8 justify-start">
                    {sampulDepan && (
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-gray-500 mb-2">Sampul Depan</span>
                        <div className="relative w-40 h-56 sm:w-48 sm:h-64 rounded-xl overflow-hidden shadow-md border border-gray-200 bg-gray-50">
                          <img
                            src={sampulDepan}
                            alt="Sampul Depan"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {sampulBelakang && (
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-gray-500 mb-2">Sampul Belakang</span>
                        <div className="relative w-40 h-56 sm:w-48 sm:h-64 rounded-xl overflow-hidden shadow-md border border-gray-200 bg-gray-50">
                          <img
                            src={sampulBelakang}
                            alt="Sampul Belakang"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === 4. PHOTOS (if any) === */}
              {photos.length > 0 && (
                <div className="p-6 sm:p-8 bg-white">
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Dokumentasi Terkait</h2>
                  <div className={`grid gap-6 ${photos.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {photos.map((url: string, idx: number) => (
                      <div key={idx} className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100 group">
                        <img
                          src={url}
                          alt={`${karya.judul} - Foto ${idx + 1}`}
                          className="w-full h-auto object-cover aspect-video group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
