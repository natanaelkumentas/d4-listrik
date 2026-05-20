"use client";

import { useEffect } from "react";
import { useData } from "@/context/DataContext";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { HiArrowLeft, HiOutlineCalendar, HiOutlineTag } from "react-icons/hi2";

export default function GaleriDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { galeriList, ensureGaleriLoaded } = useData();

  useEffect(() => { ensureGaleriLoaded(); }, [ensureGaleriLoaded]);

  const item = galeriList.find((g) => g.id === id);

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
                    {item.kategori === "fasilitas" ? "Fasilitas" : "Tridharma"}
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
