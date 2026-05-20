"use client";

import { useEffect } from "react";
import { useData } from "@/context/DataContext";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { KaryaCategory, karyaCategoryLabels, KaryaItem, PersonLink, Publikasi, Penelitian, Pengabdian, BukuAjar, Hki, Sertifikasi } from "@/data/dosen";
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
            <Link key={i} href={`/dosen/${p.id}`} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 font-medium text-sm transition-colors shadow-sm">
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
    <div className="flex items-start gap-3 mb-4">
      <div className="mt-0.5 text-primary-500">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-gray-800 font-medium mt-1">{value}</p>
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
      <Link href="/dosen" className="text-primary-600 hover:underline">Kembali</Link>
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
      <Link href={`/dosen/${id}`} className="text-primary-600 hover:underline">Kembali ke profil</Link>
    </div>
  );

  const renderSpecificDetails = () => {
    const jenis = karya?.jenis || kategori;
    // Helper: read from metadata JSONB (new DB format) or direct field (old mock format)
    const md = (karya as any)?.metadata || {};
    const meta = (key: string) => md[key] ?? (karya as any)?.[key];

    // Ensure the karya owner is always present in person lists with a profile link
    const ownerPerson: PersonLink = { id: dosen.id, nama: dosen.nama };

    const ensureOwnerInList = (persons: PersonLink | PersonLink[] | undefined): PersonLink[] => {
      const list = persons ? (Array.isArray(persons) ? [...persons] : [persons]) : [];
      if (!list.some(p => p.id === dosen.id)) {
        list.unshift(ownerPerson);
      }
      return list;
    };

    const ensureOwnerAsSingle = (person: PersonLink | undefined): PersonLink => {
      return person?.id ? person : ownerPerson;
    };

    switch (jenis) {
      case "publikasi": {
        const jurnal = meta("jurnal") as string | undefined;
        const link = meta("link") as string | undefined;
        const penulis = ensureOwnerInList(meta("penulis") as PersonLink | PersonLink[] | undefined);
        return (
          <>
            <InfoItem icon={HiOutlineBookOpen} label="Jurnal / Konferensi" value={jurnal} />
            <PersonBadgeList title="Penulis" persons={penulis} />
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors mt-2 text-primary-600">
                <HiOutlineLink /> Kunjungi Tautan Publikasi
              </a>
            )}
          </>
        );
      }
      case "penelitian": {
        const sumberDana = meta("sumberDana") as string | undefined;
        const ketua = ensureOwnerAsSingle(meta("ketua") as PersonLink | undefined);
        const anggota = meta("anggota") as PersonLink[] | undefined;
        return (
          <>
            <InfoItem icon={HiOutlineBuildingOffice} label="Sumber Dana" value={sumberDana} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PersonBadgeList title="Ketua Peneliti" persons={ketua} />
              {anggota && anggota.length > 0 && <PersonBadgeList title="Anggota" persons={anggota} />}
            </div>
            {karya.deskripsi && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Deskripsi / Abstrak</h3>
                <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{karya.deskripsi}</p>
              </div>
            )}
          </>
        );
      }
      case "pengabdian": {
        const mitra = meta("mitra") as string | undefined;
        const ketua = ensureOwnerAsSingle(meta("ketua") as PersonLink | undefined);
        const anggota = meta("anggota") as PersonLink[] | undefined;
        return (
          <>
            <InfoItem icon={HiOutlineBuildingOffice} label="Mitra" value={mitra} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PersonBadgeList title="Ketua" persons={ketua} />
              {anggota && anggota.length > 0 && <PersonBadgeList title="Anggota" persons={anggota} />}
            </div>
            {karya.deskripsi && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Deskripsi Kegiatan</h3>
                <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{karya.deskripsi}</p>
              </div>
            )}
          </>
        );
      }
      case "bukuAjar": {
        const penerbit = meta("penerbit") as string | undefined;
        const isbn = meta("isbn") as string | undefined;
        const penulis = ensureOwnerInList(meta("penulis") as PersonLink | PersonLink[] | undefined);
        return (
          <>
            <InfoItem icon={HiOutlineBuildingOffice} label="Penerbit" value={penerbit} />
            <InfoItem icon={HiOutlineIdentification} label="ISBN" value={isbn} />
            <PersonBadgeList title="Penulis" persons={penulis} />
          </>
        );
      }
      case "hki": {
        const jenisHki = meta("jenisHki") as string | undefined;
        const nomorSertifikat = meta("nomorSertifikat") as string | undefined;
        return (
          <>
            <InfoItem icon={HiOutlineDocumentText} label="Jenis HKI" value={jenisHki} />
            <InfoItem icon={HiOutlineIdentification} label="Nomor Sertifikat" value={nomorSertifikat} />
          </>
        );
      }
      case "sertifikasi": {
        const penyelenggara = meta("penyelenggara") as string | undefined;
        const linkSertifikat = meta("linkSertifikat") as string | undefined;
        return (
          <>
            <InfoItem icon={HiOutlineBuildingOffice} label="Penyelenggara / Lembaga" value={penyelenggara} />
            <div className="mt-6 pt-4 border-t border-gray-100">
              {linkSertifikat ? (
                <a href={linkSertifikat} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg">
                  <HiOutlineDocumentText className="w-5 h-5" /> Lihat Selengkapnya
                </a>
              ) : (
                <button disabled className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium cursor-not-allowed">
                  <HiOutlineDocumentText className="w-5 h-5" /> Sertifikat Tidak Tersedia
                </button>
              )}
            </div>
          </>
        );
      }
      default:
        return null;
    }
  };

  return (
    <>
      <section className="bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 pt-24 pb-8 min-h-[200px]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8" />
      </section>

      <section className="py-10 -mt-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in-up">
            <Link
              href={`/dosen/${id}`}
              className="inline-flex items-center gap-2 text-sm text-primary-100 hover:text-white font-medium mb-6 transition-colors drop-shadow-md"
            >
              <HiArrowLeft className="w-4 h-4" />
              Kembali ke Profil {dosen.nama}
            </Link>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold mb-4 uppercase tracking-wider">
                  {karyaCategoryLabels[cat] || cat}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {karya.judul}
                </h1>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
                    Tahun {karya.tahun}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-8">
                {renderSpecificDetails()}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
