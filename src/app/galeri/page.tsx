"use client";

import { useState, useEffect } from "react";
import PageHero from "@/components/universal/PageHero";
import GaleriFilter from "@/components/galeri/GaleriFilter";
import GaleriCard from "@/components/galeri/GaleriCard";
import { useData } from "@/context/DataContext";
import { GaleriItem } from "@/data/galeri";
import { cachedFetch } from "@/lib/fetchCache";
import { HiInboxStack } from "react-icons/hi2";

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

export default function GaleriPage() {
  const { galeriList, ensureGaleriLoaded } = useData();
  const [karyaGaleri, setKaryaGaleri] = useState<GaleriItem[]>([]);

  useEffect(() => { ensureGaleriLoaded(); }, [ensureGaleriLoaded]);

  // Fetch karya and transform into virtual galeri items
  useEffect(() => {
    cachedFetch<any[]>("/api/karya")
      .then((karyaList) => {
        if (!karyaList) return;
        const tridharmaJenis = ["publikasi", "penelitian", "pengabdian", "bukuAjar"];
        const virtualItems: GaleriItem[] = karyaList
          .filter((k) => tridharmaJenis.includes(k.jenis) && k.foto_urls && k.foto_urls.length > 0)
          .map((k) => ({
            id: `karya-${k.id}`,
            judul: k.judul,
            deskripsi: k.deskripsi || "",
            tanggal: `${k.tahun}-01-01`,
            kategori: "tridharma" as const,
            foto: k.foto_urls || [],
            warna: jenisGradients[k.jenis] || "from-blue-500 to-indigo-600",
            subLabel: jenisLabels[k.jenis] || k.jenis,
          }));
        setKaryaGaleri(virtualItems);
      })
      .catch((err) => console.error("Failed to fetch karya for galeri", err));
  }, []);

  const [filter, setFilter] = useState<"semua" | "fasilitas" | "tridharma">("semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Merge galeri + karya virtual items, deduplicated, sorted by date desc
  const mergedList = [...galeriList, ...karyaGaleri].sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
  );

  const filtered = mergedList.filter((item) => {
    const matchesFilter = filter === "semua" || item.kategori === filter;
    const matchesSearch = item.judul.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <PageHero
        title="Galeri"
        subtitle="Dokumentasi fasilitas dan kegiatan tridharma perguruan tinggi."
      />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <GaleriFilter activeFilter={filter} onFilterChange={setFilter} />
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                placeholder="Cari galeri..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item, index) => (
              <GaleriCard key={item.id} item={item} index={index} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <HiInboxStack className="text-4xl mb-3 text-gray-300 mx-auto" />
              <p className="text-gray-400 text-sm font-medium">Belum ada data untuk kategori ini</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
