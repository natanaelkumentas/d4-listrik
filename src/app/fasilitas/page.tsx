"use client";

import { useEffect, useState } from "react";
import PageHero from "@/components/universal/PageHero";
import Modal from "@/components/universal/Modal";
import { cachedFetch } from "@/lib/fetchCache";
import LazySection from "@/components/universal/LazySection";
import { useData } from "@/context/DataContext";
import Link from "next/link";
import ImageLightbox from "@/components/universal/ImageLightbox";
import {
  HiUser,
  HiHome,
  HiPhoto,
  HiMagnifyingGlass,
  HiXMark,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi2";

interface FasilitasItem {
  id: string;
  nama: string;
  deskripsi: string | null;
  foto_urls: string[];
  kepala_lab: string | null;
  no_ruangan: string | null;
}

export default function FasilitasPage() {
  const [fasilitas, setFasilitas] = useState<FasilitasItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFasilitas, setSelectedFasilitas] = useState<FasilitasItem | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { dosenList, ensureDosenLoaded } = useData();

  useEffect(() => {
    ensureDosenLoaded();
    const fetchFasilitas = async () => {
      try {
        const data = await cachedFetch<FasilitasItem[]>("/api/fasilitas");
        setFasilitas(data || []);
      } catch (e) {
        console.error("Failed to load facilities", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFasilitas();
  }, [ensureDosenLoaded]);

  const findDosenByName = (name: string | null) => {
    if (!name) return null;
    const cleanName = name.split(",")[0].trim().toLowerCase();
    return dosenList.find((d) => {
      const cleanDosenName = d.nama.split(",")[0].trim().toLowerCase();
      return cleanDosenName === cleanName || cleanDosenName.includes(cleanName) || cleanName.includes(cleanDosenName);
    });
  };

  const filtered = fasilitas.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.nama.toLowerCase().includes(q) ||
      (item.deskripsi || "").toLowerCase().includes(q) ||
      (item.no_ruangan || "").toLowerCase().includes(q) ||
      (item.kepala_lab || "").toLowerCase().includes(q)
    );
  });

  const selectedPhotos =
    selectedFasilitas && Array.isArray(selectedFasilitas.foto_urls) && selectedFasilitas.foto_urls.length > 0
      ? selectedFasilitas.foto_urls
      : ["/images/default.svg"];

  return (
    <>
      <PageHero
        title="Fasilitas Laboratorium"
        subtitle="Sarana prasarana modern untuk menunjang kegiatan perkuliahan praktikum dan penelitian."
      />

      <section className="py-16 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Search + count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-bold text-primary-950">Semua Fasilitas</h2>
              {!isLoading && (
                <p className="text-sm text-gray-500 mt-1">
                  Menampilkan {filtered.length} dari {fasilitas.length} fasilitas
                </p>
              )}
            </div>
            <div className="relative max-w-sm w-full">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <HiMagnifyingGlass className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Cari fasilitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-primary-950 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <HiXMark className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Grid with Lazy Rendering */}
          <LazySection placeholderHeight="600px">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="h-48 bg-gray-200/60" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-200/80 rounded w-3/4" />
                      <div className="h-3 bg-gray-200/55 rounded w-1/2" />
                      <div className="h-3 bg-gray-200/30 rounded w-full mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((item, index) => {
                  const photos = Array.isArray(item.foto_urls) && item.foto_urls.length > 0
                    ? item.foto_urls
                    : ["/images/default.svg"];

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedFasilitas(item);
                        setCurrentPhotoIndex(0);
                      }}
                      className="group text-left bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up block w-full focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      {/* Image */}
                      <div className="h-48 relative overflow-hidden bg-gray-100">
                        <img
                          src={photos[0]}
                          alt={item.nama}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                        {/* Photo count badge */}
                        {photos.length > 1 && (
                          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/55 text-xs font-medium text-white backdrop-blur-sm">
                            <HiPhoto className="w-3.5 h-3.5" />
                            {photos.length}
                          </span>
                        )}

                        {/* Room badge on image */}
                        {item.no_ruangan && (
                          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-xs font-semibold text-gray-700 backdrop-blur-sm shadow-sm">
                            <HiHome className="w-3.5 h-3.5 text-primary-600" />
                            Ruang {item.no_ruangan}
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-primary-950 text-base group-hover:text-primary-600 transition-colors leading-snug">
                          {item.nama}
                        </h3>

                        {item.kepala_lab && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                            <HiUser className="w-3.5 h-3.5 text-gray-400" />
                            Ka. Lab: {item.kepala_lab}
                          </div>
                        )}

                        <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-3">
                          {item.deskripsi || "Belum ada deskripsi untuk fasilitas laboratorium ini."}
                        </p>

                        <div className="mt-4 inline-flex items-center text-sm font-semibold text-primary-600 group-hover:text-primary-700">
                          Lihat Detail
                          <svg
                            className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform"
                            fill="none;;"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                <HiMagnifyingGlass className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  {searchQuery
                    ? "Tidak ada fasilitas yang cocok dengan pencarian."
                    : "Belum ada data fasilitas laboratorium."}
                </p>
              </div>
            )}
          </LazySection>
        </div>
      </section>

      {/* Facilities Detailed Modal */}
      <Modal
        isOpen={!!selectedFasilitas}
        onClose={() => setSelectedFasilitas(null)}
        title={selectedFasilitas?.nama || "Detail Fasilitas"}
      >
        {selectedFasilitas && (
          <div className="space-y-6">
            {/* Image Slider */}
             <div 
               onClick={() => {
                 setLightboxImages(selectedPhotos);
                 setLightboxIndex(currentPhotoIndex);
                 setLightboxOpen(true);
               }}
               className="relative h-64 sm:h-80 w-full bg-gray-100 rounded-2xl overflow-hidden group/slider cursor-zoom-in"
             >
               <img
                 src={selectedPhotos[currentPhotoIndex]}
                 alt={selectedFasilitas.nama}
                 className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-550"
               />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />

              {/* Navigation arrows */}
              {selectedPhotos.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPhotoIndex((prev) => (prev === 0 ? selectedPhotos.length - 1 : prev - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
                    aria-label="Foto sebelumnya"
                  >
                    <HiChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPhotoIndex((prev) => (prev === selectedPhotos.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
                    aria-label="Foto berikutnya"
                  >
                    <HiChevronRight className="w-4 h-4" />
                  </button>

                  {/* Indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                    {selectedPhotos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPhotoIndex(idx);
                        }}
                        className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                          idx === currentPhotoIndex ? "bg-white w-3" : "bg-white/50 hover:bg-white/85"
                        }`}
                        aria-label={`Foto ke-${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Quick Details Badges */}
            <div className={`grid ${selectedFasilitas.kepala_lab ? 'grid-cols-2' : 'grid-cols-1'} gap-4 pb-4 border-b border-gray-100`}>
              <div className="flex items-center gap-3 bg-primary-50/50 rounded-xl p-3.5 border border-primary-50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-600 flex-shrink-0">
                  <HiHome className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Nomor Ruangan</p>
                  <p className="text-sm font-bold text-primary-900 mt-0.5">
                    {selectedFasilitas.no_ruangan ? `Ruang ${selectedFasilitas.no_ruangan}` : "—"}
                  </p>
                </div>
              </div>

              {selectedFasilitas.kepala_lab && (
                <div className="flex items-center gap-3 bg-primary-50/50 rounded-xl p-3.5 border border-primary-50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-600 flex-shrink-0">
                    <HiUser className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Kepala Lab / Ruang</p>
                    <p className="text-sm font-bold text-primary-900 mt-0.5">
                      {(() => {
                        const matched = findDosenByName(selectedFasilitas.kepala_lab);
                        if (matched) {
                          return (
                            <Link href={`/staf/${matched.id}`} className="text-primary-600 hover:underline hover:text-primary-700 transition-colors">
                              {selectedFasilitas.kepala_lab}
                            </Link>
                          );
                        }
                        return selectedFasilitas.kepala_lab;
                      })()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Deskripsi & Fungsi</h4>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {selectedFasilitas.deskripsi || "Belum ada informasi deskripsi untuk laboratorium ini."}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ImageLightbox
        isOpen={lightboxOpen}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
