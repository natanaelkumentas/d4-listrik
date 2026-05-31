"use client";

import { useEffect, useState } from "react";
import { cachedFetch } from "@/lib/fetchCache";
import Image from "next/image";

interface DosenBrief {
  id: string;
  nama: string;
  foto_url: string | null;
}

interface SambutanData {
  kutipan: string;
  dosen: DosenBrief | null;
}

export default function SambutanSection() {
  const [sambutanKajur, setSambutanKajur] = useState<SambutanData | null>(null);
  const [sambutanKaprodi, setSambutanKaprodi] = useState<SambutanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = await cachedFetch<any>("/api/sambutan");
        if (config?.sambutan_kajur) setSambutanKajur(config.sambutan_kajur);
        if (config?.sambutan_kaprodi) setSambutanKaprodi(config.sambutan_kaprodi);
      } catch (e) {
        console.error("Failed to fetch sambutan data", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-white to-primary-50/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="animate-pulse max-w-4xl mx-auto space-y-16">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-4 w-full">
                <div className="h-6 bg-gray-200 rounded w-48" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const hasKajur = sambutanKajur && sambutanKajur.dosen;
  const hasKaprodi = sambutanKaprodi && sambutanKaprodi.dosen;

  if (!hasKajur && !hasKaprodi) return null;

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary-100/30 blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-accent-400/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-4xl mx-auto space-y-16 sm:space-y-24">
          
          {/* 1. Sambutan Kajur (Ketua Jurusan) */}
          {hasKajur && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 text-primary-600 text-xs font-semibold uppercase tracking-wider">
                  Sambutan Ketua Jurusan
                </span>
              </div>

              <div className="relative bg-white rounded-3xl p-8 sm:p-10 md:p-12 border border-primary-100/50 shadow-md">
                {/* Quote mark decoration */}
                <div className="absolute -top-4 left-8 sm:left-12 text-7xl sm:text-8xl text-primary-100 font-serif leading-none select-none">
                  &ldquo;
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
                  {/* Photo */}
                  <div className="shrink-0">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-primary-100 shadow-xl">
                      <Image
                        src={sambutanKajur.dosen?.foto_url || "/images/default-profile.svg"}
                        alt={sambutanKajur.dosen?.nama || "Ketua Jurusan"}
                        width={144}
                        height={144}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Quote + Name */}
                  <div className="flex-1 text-center md:text-left">
                    <blockquote className="text-base sm:text-lg text-gray-700 leading-relaxed italic mb-6">
                      {sambutanKajur.kutipan}
                    </blockquote>

                    <div className="h-px w-16 bg-gradient-to-r from-primary-400 to-accent-400 mx-auto md:mx-0 mb-4" />

                    <p className="font-bold text-primary-950 text-base sm:text-lg">
                      {sambutanKajur.dosen?.nama}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Ketua Jurusan Teknik Elektro
                    </p>
                  </div>
                </div>

                {/* Close quote decoration */}
                <div className="absolute -bottom-6 right-8 sm:right-12 text-7xl sm:text-8xl text-primary-100 font-serif leading-none select-none rotate-180">
                  &ldquo;
                </div>
              </div>
            </div>
          )}

          {/* 2. Sambutan Kaprodi (Ketua Program Studi) */}
          {hasKaprodi && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 text-primary-600 text-xs font-semibold uppercase tracking-wider">
                  Sambutan Ketua Program Studi
                </span>
              </div>

              <div className="relative bg-white rounded-3xl p-8 sm:p-10 md:p-12 border border-primary-100/50 shadow-md">
                {/* Quote mark decoration */}
                <div className="absolute -top-4 left-8 sm:left-12 text-7xl sm:text-8xl text-primary-100 font-serif leading-none select-none">
                  &ldquo;
                </div>

                {/* Alternating row layout (reverse layout) */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12 relative z-10">
                  {/* Photo */}
                  <div className="shrink-0">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-primary-100 shadow-xl">
                      <Image
                        src={sambutanKaprodi.dosen?.foto_url || "/images/default-profile.svg"}
                        alt={sambutanKaprodi.dosen?.nama || "Ketua Program Studi"}
                        width={144}
                        height={144}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Quote + Name */}
                  <div className="flex-1 text-center md:text-right">
                    <blockquote className="text-base sm:text-lg text-gray-700 leading-relaxed italic mb-6">
                      {sambutanKaprodi.kutipan}
                    </blockquote>

                    <div className="h-px w-16 bg-gradient-to-r from-primary-400 to-accent-400 mx-auto md:mx-0 mb-4" />

                    <p className="font-bold text-primary-950 text-base sm:text-lg">
                      {sambutanKaprodi.dosen?.nama}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Ketua Program Studi D4 Teknik Listrik
                    </p>
                  </div>
                </div>

                {/* Close quote decoration */}
                <div className="absolute -bottom-6 right-8 sm:right-12 text-7xl sm:text-8xl text-primary-100 font-serif leading-none select-none rotate-180">
                  &ldquo;
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
