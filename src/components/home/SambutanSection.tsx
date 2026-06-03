"use client";

import { useEffect, useState } from "react";
import { cachedFetch } from "@/lib/fetchCache";
import Image from "next/image";
import Link from "next/link";

interface DosenBrief {
  id: string;
  nama: string;
  foto_url: string | null;
}

interface SambutanData {
  kutipan: string;
  dosen: DosenBrief | null;
}

/* ─── Reusable card for a single sambutan ─── */
function SambutanCard({
  data,
  subtitle,
  fallbackName,
}: {
  data: SambutanData;
  subtitle: string;
  fallbackName: string;
}) {
  const photo = data.dosen?.foto_url || "/images/default-profile.svg";
  const name = data.dosen?.nama || fallbackName;
  const profileHref = data.dosen?.id ? `/staf/${data.dosen.id}` : null;

  return (
    <div className="animate-fade-in-up flex flex-col h-full">
      {/* Card */}
      <div className="relative bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-primary-100/50 shadow-md flex flex-col flex-1">
        {/* Open quote */}
        <div className="absolute -top-4 left-6 sm:left-10 text-6xl sm:text-7xl text-primary-100 font-serif leading-none select-none">
          &ldquo;
        </div>

        <div className="flex flex-col items-center gap-6 relative z-10 flex-1">
          {/* Photo */}
          {profileHref ? (
            <Link href={profileHref} className="group block shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-primary-100 shadow-xl group-hover:border-primary-400 group-hover:scale-105 transition-all duration-300">
                <Image
                  src={photo}
                  alt={name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
          ) : (
            <div className="shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-primary-100 shadow-xl">
                <Image
                  src={photo}
                  alt={name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Quote */}
          <div className="flex-1 text-center">
            <blockquote className="text-sm sm:text-base text-gray-700 leading-relaxed italic">
              {data.kutipan}
            </blockquote>
          </div>

          {/* Name + Role — pushed to bottom so both cards align */}
          <div className="text-center mt-auto pt-4">
            <div className="h-px w-14 bg-gradient-to-r from-primary-400 to-accent-400 mx-auto mb-3" />

            {profileHref ? (
              <Link
                href={profileHref}
                className="font-bold text-primary-950 text-sm sm:text-base hover:text-primary-700 transition-colors block"
              >
                {name}
              </Link>
            ) : (
              <p className="font-bold text-primary-950 text-sm sm:text-base">
                {name}
              </p>
            )}
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Close quote */}
        <div className="absolute -bottom-5 right-6 sm:right-10 text-6xl sm:text-7xl text-primary-100 font-serif leading-none select-none rotate-180">
          &ldquo;
        </div>
      </div>
    </div>
  );
}

/* ─── Main section ─── */
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
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col items-center gap-6">
                <div className="w-28 h-28 rounded-full bg-gray-200 shrink-0" />
                <div className="space-y-3 w-full">
                  <div className="h-5 bg-gray-200 rounded w-40 mx-auto" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const hasKajur = sambutanKajur && sambutanKajur.dosen;
  const hasKaprodi = sambutanKaprodi && sambutanKaprodi.dosen;

  if (!hasKajur && !hasKaprodi) return null;

  // If only one exists, show single card centered
  const hasBoth = hasKajur && hasKaprodi;

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary-100/30 blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-accent-400/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        {/* Shared section title */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-50 text-primary-600 text-xs font-semibold uppercase tracking-wider">
            Sambutan Ketua Program Studi dan Ketua Jurusan
          </span>
        </div>

        <div
          className={`mx-auto grid gap-8 lg:gap-12 items-stretch ${
            hasBoth
              ? "grid-cols-1 md:grid-cols-2 max-w-5xl"
              : "grid-cols-1 max-w-2xl"
          }`}
        >
          {/* Left: Sambutan Kaprodi */}
          {hasKaprodi && (
            <SambutanCard
              data={sambutanKaprodi}
              fallbackName="Ketua Program Studi"
              subtitle="Ketua Program Studi D4 Teknik Listrik"
            />
          )}

          {/* Right: Sambutan Kajur */}
          {hasKajur && (
            <SambutanCard
              data={sambutanKajur}
              fallbackName="Ketua Jurusan"
              subtitle="Ketua Jurusan Teknik Elektro"
            />
          )}
        </div>
      </div>
    </section>
  );
}
