"use client";

import { useState, useEffect } from "react";
import PageHero from "@/components/universal/PageHero";
import GaleriFilter from "@/components/galeri/GaleriFilter";
import GaleriCard from "@/components/galeri/GaleriCard";
import { GaleriItem } from "@/types/galeri";
import { cachedFetch } from "@/lib/fetchCache";
import { HiInboxStack } from "react-icons/hi2";
import LazySection from "@/components/universal/LazySection";

const jenisLabels: Record<string, string> = {
  publikasi: "Publikasi & Penelitian",
  penelitian: "Publikasi & Penelitian",
  pengabdian: "Pengabdian",
  bukuAjar: "Buku Ajar",
};

const jenisGradients: Record<string, string> = {
  publikasi: "from-primary-700 to-primary-900",
  penelitian: "from-primary-700 to-primary-900",
  pengabdian: "from-primary-700 to-primary-900",
  bukuAjar: "from-primary-700 to-primary-900",
};

export default function GaleriPage() {
  const [karyaGaleri, setKaryaGaleri] = useState<GaleriItem[]>([]);
  const [fasilitasGaleri, setFasilitasGaleri] = useState<GaleriItem[]>([]);
  const [kegiatanGaleri, setKegiatanGaleri] = useState<GaleriItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"semua" | "fasilitas" | "tridharma" | "kegiatan">("semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch karya, fasilitas, and kegiatan
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [karyaList, fasList, kegiatanList] = await Promise.all([
          cachedFetch<any[]>("/api/karya"),
          cachedFetch<any[]>("/api/fasilitas"),
          cachedFetch<any[]>("/api/kegiatan"),
        ]);

        // Transform Karya items
        const tridharmaJenis = ["publikasi", "penelitian", "pengabdian", "bukuAjar"];
        const virtualKarya: GaleriItem[] = (karyaList || [])
          .filter((k) => tridharmaJenis.includes(k.jenis))
          .map((k) => {
            let photos = k.jenis === "bukuAjar"
              ? [k.metadata?.sampul_depan].filter(Boolean)
              : (k.foto_urls || []);
            if (photos.length === 0) {
              photos = ["/images/default.svg"];
            }
            return {
              id: `karya-${k.id}`,
              judul: k.judul,
              deskripsi: k.deskripsi || "",
              tanggal: `${k.tahun}-01-01`,
              kategori: "tridharma" as const,
              foto: photos,
              warna: jenisGradients[k.jenis] || "from-blue-500 to-indigo-600",
              subLabel: jenisLabels[k.jenis] || k.jenis,
            };
          });

        // Transform Fasilitas items
        const virtualFasilitas: GaleriItem[] = (fasList || []).map((f) => {
          const photos = Array.isArray(f.foto_urls) && f.foto_urls.length > 0
            ? f.foto_urls
            : ["/images/default.svg"];
          
          return {
            id: `fasilitas-${f.id}`,
            judul: f.nama,
            deskripsi: f.deskripsi || `Ruangan: ${f.no_ruangan || "-"} | Kepala Lab: ${f.kepala_lab || "-"}`,
            tanggal: f.created_at || new Date().toISOString(),
            kategori: "fasilitas" as const,
            foto: photos,
            warna: "from-primary-700 to-primary-900",
            subLabel: f.no_ruangan ? `Ruang ${f.no_ruangan}` : "Fasilitas Lab",
          };
        });

        // Transform Kegiatan items
        const virtualKegiatan: GaleriItem[] = (kegiatanList || [])
          .map((k) => {
            const photos = k.foto_urls && k.foto_urls.length > 0 ? k.foto_urls : ["/images/default.svg"];
            return {
              id: `kegiatan-${k.id}`,
              judul: k.nama,
              deskripsi: k.deskripsi || "",
              tanggal: k.tanggal,
              kategori: "kegiatan" as const,
              foto: photos,
              warna: "from-primary-700 to-primary-900",
              subLabel: k.kategori,
            };
          });

        setKaryaGaleri(virtualKarya);
        setFasilitasGaleri(virtualFasilitas);
        setKegiatanGaleri(virtualKegiatan);
      } catch (err) {
        console.error("Failed to fetch galeri data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Merge lists with custom sorting rules:
  // 1. Kegiatan and Tridharma sorted together by year (descending).
  // 2. Within the same year, all Kegiatan items appear first (sorted descending by exact date), followed by Tridharma.
  // 3. Fasilitas always appears at the very end of the list.
  const mergedList = [...fasilitasGaleri, ...karyaGaleri, ...kegiatanGaleri].sort((a, b) => {
    // Handle Fasilitas (always last)
    if (a.kategori === "fasilitas" && b.kategori !== "fasilitas") return 1;
    if (b.kategori === "fasilitas" && a.kategori !== "fasilitas") return -1;
    if (a.kategori === "fasilitas" && b.kategori === "fasilitas") {
      return a.judul.localeCompare(b.judul);
    }

    // Now both a and b are either "kegiatan" or "tridharma"
    const yearA = a.tanggal ? new Date(a.tanggal).getFullYear() : 0;
    const yearB = b.tanggal ? new Date(b.tanggal).getFullYear() : 0;

    if (yearA !== yearB) {
      return yearB - yearA; // Newest year first
    }

    // Same year: Kegiatan comes first, then Tridharma
    if (a.kategori === "kegiatan" && b.kategori === "tridharma") return -1;
    if (a.kategori === "tridharma" && b.kategori === "kegiatan") return 1;

    // Same year & same category
    if (a.kategori === "kegiatan" && b.kategori === "kegiatan") {
      const timeA = a.tanggal ? new Date(a.tanggal).getTime() : 0;
      const timeB = b.tanggal ? new Date(b.tanggal).getTime() : 0;
      return timeB - timeA; // Newest kegiatan first
    }

    // Same year & both are tridharma
    return a.judul.localeCompare(b.judul);
  });

  const filtered = mergedList.filter((item) => {
    const matchesFilter = filter === "semua" || item.kategori === filter;
    const matchesSearch =
      item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <PageHero
        title="Galeri Program Studi"
        subtitle="Dokumentasi fasilitas laboratorium dan kegiatan tridharma civitas akademika."
      />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <GaleriFilter activeFilter={filter} onFilterChange={setFilter} />
              <div className="relative max-w-sm w-full">
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Cari galeri..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-primary-950 transition-all"
                />
              </div>
            </div>
            {!isLoading && (
              <p className="text-sm text-gray-500">
                Menampilkan <span className="font-semibold text-primary-700">{filtered.length}</span> item
              </p>
            )}
          </div>

          <LazySection placeholderHeight="600px">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <>
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
              </>
            )}
          </LazySection>
        </div>
      </section>
    </>
  );
}
