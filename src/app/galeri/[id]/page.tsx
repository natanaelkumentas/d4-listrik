"use client";

import { useEffect, useState } from "react";
import { useData } from "@/context/DataContext";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { HiArrowLeft, HiOutlineCalendar, HiOutlineTag } from "react-icons/hi2";
import { GaleriItem } from "@/data/galeri";
import { cachedFetch } from "@/lib/fetchCache";

const jenisLabels: Record<string, string> = {
  publikasi: "Publikasi",
  penelitian: "Penelitian",
  pengabdian: "Pengabdian",
  bukuAjar: "Buku Ajar",
};

const jenisGradients: Record<string, string> = {
  publikasi: "from-blue-500 to-indigo-600",
  penelitian: "from-violet-500 to-purple-600",
  pengabdian: "from-lime-500 to-green-600",
  bukuAjar: "from-amber-500 to-orange-600",
};

export default function GaleriDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { galeriList, ensureGaleriLoaded } = useData();
  const [karyaItem, setKaryaItem] = useState<GaleriItem | null>(null);
  const [isKaryaLoading, setIsKaryaLoading] = useState(false);

  useEffect(() => { ensureGaleriLoaded(); }, [ensureGaleriLoaded]);

  // If it's a karya-prefixed ID, fetch from karya API
  const isKarya = id.startsWith("karya-");
  const realKaryaId = isKarya ? id.replace("karya-", "") : null;

  useEffect(() => {
    if (!isKarya || !realKaryaId) return;
    setIsKaryaLoading(true);
    cachedFetch<any[]>("/api/karya")
      .then((karyaList) => {
        if (!karyaList) return;
        const k = karyaList.find((karya: any) => karya.id === realKaryaId);
        if (k) {
          setKaryaItem({
            id: `karya-${k.id}`,
            judul: k.judul,
            deskripsi: k.deskripsi || "",
            tanggal: `${k.tahun}-01-01`,
            kategori: "tridharma",
            foto: k.foto_urls || [],
            warna: jenisGradients[k.jenis] || "from-blue-500 to-indigo-600",
            subLabel: jenisLabels[k.jenis] || k.jenis,
          });
        }
      })
      .catch((err) => console.error("Failed to fetch karya detail", err))
      .finally(() => setIsKaryaLoading(false));
  }, [isKarya, realKaryaId]);

  const item = isKarya ? karyaItem : galeriList.find((g) => g.id === id);

  if (isKaryaLoading) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-500 font-medium">Memuat data...</p>
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
    : item.subLabel
      ? `Tridharma · ${item.subLabel}`
      : "Tridharma";

  return (
    <>
      <section className={`bg-gradient-to-br ${item.warna} pt-24 pb-8 min-h-[250px]`}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8" />
      </section>

      <section className="py-10 -mt-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in-up">
            <Link
              href="/galeri"
              className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white font-medium mb-6 transition-colors drop-shadow-md"
            >
              <HiArrowLeft className="w-4 h-4" />
              Kembali ke Galeri
            </Link>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="p-6 sm:p-10 border-b border-gray-100 bg-gray-50/50">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wider">
                    <HiOutlineTag className="w-3.5 h-3.5" />
                    {categoryLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                    <HiOutlineCalendar className="w-3.5 h-3.5" />
                    {formattedDate}
                  </span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-6">
                  {item.judul}
                </h1>
                
                <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                  {item.deskripsi}
                </p>
              </div>

              {/* Photos Gallery */}
              <div className="p-6 sm:p-10 bg-white">
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
