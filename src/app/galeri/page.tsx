"use client";

import { useState, useEffect } from "react";
import PageHero from "@/components/universal/PageHero";
import GaleriFilter from "@/components/galeri/GaleriFilter";
import GaleriCard from "@/components/galeri/GaleriCard";
import { useData } from "@/context/DataContext";
import { HiInboxStack } from "react-icons/hi2";

export default function GaleriPage() {
  const { galeriList, ensureGaleriLoaded } = useData();

  useEffect(() => { ensureGaleriLoaded(); }, [ensureGaleriLoaded]);
  const [filter, setFilter] = useState<"semua" | "fasilitas" | "tridharma">("semua");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = galeriList.filter((item) => {
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
