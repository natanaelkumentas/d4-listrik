"use client";

import { useEffect, useState } from "react";
import { cachedFetch } from "@/lib/fetchCache";
import { HiEye, HiRocketLaunch, HiBolt, HiBeaker, HiHandRaised, HiGlobeAlt, HiLightBulb, HiAcademicCap, HiShieldCheck, HiChevronLeft, HiChevronRight } from "react-icons/hi2";

interface VisiMisiItem {
  id: string;
  kategori: "visi" | "misi" | "tujuan";
  konten: string;
  urutan: number;
}

const tujuanIcons = [
  <HiBolt key="bolt" className="text-xl" />,
  <HiBeaker key="beaker" className="text-xl" />,
  <HiHandRaised key="hand" className="text-xl" />,
  <HiGlobeAlt key="globe" className="text-xl" />,
  <HiLightBulb key="lightbulb" className="text-xl" />,
  <HiAcademicCap key="academic" className="text-xl" />,
  <HiShieldCheck key="shield" className="text-xl" />,
];

const tujuanGradients = [
  "from-primary-500 to-primary-600",
  "from-primary-600 to-primary-700",
  "from-primary-700 to-primary-800",
  "from-primary-500 to-primary-700",
  "from-primary-800 to-primary-900",
  "from-primary-600 to-primary-800",
  "from-primary-500 to-primary-600",
];

const getTujuanIcon = (index: number) => {
  return tujuanIcons[index % tujuanIcons.length];
};

const parseContent = (konten: string, index: number, defaultTitlePrefix: string) => {
  const parts = konten.split(":");
  if (parts.length > 1 && parts[0].trim().length < 45) {
    return {
      title: parts[0].trim(),
      desc: parts.slice(1).join(":").trim(),
    };
  }
  return {
    title: `${defaultTitlePrefix} ${index + 1}`,
    desc: konten.trim(),
  };
};

export default function VisiMisiSection() {
  const [items, setItems] = useState<VisiMisiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentMisi, setCurrentMisi] = useState(0);
  const [currentTujuan, setCurrentTujuan] = useState(0);
  const [tujuanCardsPerView, setTujuanCardsPerView] = useState(2);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 640) setTujuanCardsPerView(1);
      else setTujuanCardsPerView(2);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = await cachedFetch<any>("/api/config?section=all");
        if (config?.visi_misi_tujuan) setItems(config.visi_misi_tujuan);
      } catch (e) {
        console.error("Failed to fetch visi misi data", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const visi = items.filter((i) => i.kategori === "visi").sort((a, b) => a.urutan - b.urutan);
  const misi = items.filter((i) => i.kategori === "misi").sort((a, b) => a.urutan - b.urutan);
  const tujuan = items.filter((i) => i.kategori === "tujuan").sort((a, b) => a.urutan - b.urutan);

  const maxTujuanSlide = Math.max(0, tujuan.length - tujuanCardsPerView);

  // Auto-play Misi
  useEffect(() => {
    if (misi.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentMisi((prev) => (prev === misi.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [misi.length]);

  // Auto-play Tujuan
  useEffect(() => {
    if (tujuan.length <= tujuanCardsPerView) return;
    const interval = setInterval(() => {
      setCurrentTujuan((prev) => (prev >= maxTujuanSlide ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [tujuan.length, tujuanCardsPerView, maxTujuanSlide]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-14">
      {/* ===== Visi ===== */}
      {visi.length > 0 && (
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
              <HiEye className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-primary-950">Visi</h2>
          </div>
          <div className="space-y-4">
            {visi.map((v) => (
              <div
                key={v.id}
                className="relative bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 rounded-3xl p-8 sm:p-10 shadow-xl overflow-hidden"
              >
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-accent-400/10 blur-xl" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-primary-400/10 blur-2xl" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-400 via-primary-400 to-accent-500" />

                {/* Quote marks */}
                <div className="absolute top-3 left-6 text-6xl text-white/5 font-serif leading-none select-none">&ldquo;</div>

                <p className="relative z-10 text-lg sm:text-xl text-white font-medium leading-relaxed italic text-center">
                  &ldquo;{v.konten}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Misi ===== */}
      {misi.length > 0 && (
        <div className="animate-fade-in-up delay-200">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
              <HiRocketLaunch className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-primary-950">Misi</h2>
          </div>

          <div className="relative bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-md overflow-hidden min-h-[160px] flex items-center">
            {/* Subtle gradient accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-500" />

            {/* Navigation chevrons */}
            {misi.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentMisi((prev) => (prev === 0 ? misi.length - 1 : prev - 1))}
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-primary-700 hover:bg-primary-50 hover:scale-110 active:scale-95 transition-all"
                  aria-label="Misi sebelumnya"
                >
                  <HiChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentMisi((prev) => (prev === misi.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-primary-700 hover:bg-primary-50 hover:scale-110 active:scale-95 transition-all"
                  aria-label="Misi berikutnya"
                >
                  <HiChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Misi slide content */}
            <div className="w-full overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${currentMisi * 100}%)`,
                }}
              >
                {misi.map((m, index) => {
                  const { title, desc } = parseContent(m.konten, index, "Misi");
                  const hasTitle = m.konten.includes(":") && m.konten.split(":")[0].trim().length < 45;
                  return (
                    <div key={m.id} className="w-full shrink-0 flex items-start gap-4 px-12 sm:px-16">
                      <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 text-white text-sm font-bold shadow-md">
                        {index + 1}
                      </div>
                      <div className="pt-1">
                        {hasTitle && <h3 className="font-bold text-primary-950 text-base mb-1">{title}</h3>}
                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dot Indicators for Misi */}
          {misi.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="flex items-center gap-1.5">
                {misi.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentMisi(idx)}
                    className={`transition-all duration-300 rounded-full ${
                      idx === currentMisi ? "w-6 h-2 bg-primary-600" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Misi slide ${idx + 1}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400 font-medium tabular-nums ml-2">
                {currentMisi + 1} / {misi.length}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ===== Tujuan ===== */}
      {tujuan.length > 0 && (
        <div className="animate-fade-in-up delay-400">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-700 to-primary-800 flex items-center justify-center shadow-lg">
                <HiBolt className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-primary-950">Tujuan</h2>
            </div>
            {/* Nav arrows for Tujuan */}
            {tujuan.length > tujuanCardsPerView && (
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentTujuan((prev) => (prev <= 0 ? maxTujuanSlide : prev - 1))}
                  className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-primary-50 text-primary-700 flex items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-95"
                  aria-label="Tujuan sebelumnya"
                >
                  <HiChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentTujuan((prev) => (prev >= maxTujuanSlide ? 0 : prev + 1))}
                  className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-primary-50 text-primary-700 flex items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-95"
                  aria-label="Tujuan berikutnya"
                >
                  <HiChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden -mx-2 px-2">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentTujuan * (100 / tujuanCardsPerView)}%)`,
              }}
            >
              {tujuan.map((t, index) => {
                const { title, desc } = parseContent(t.konten, index, "Tujuan");
                const hasTitle = t.konten.includes(":") && t.konten.split(":")[0].trim().length < 45;
                const gradient = tujuanGradients[index % tujuanGradients.length];
                return (
                  <div
                    key={t.id}
                    className="flex-shrink-0 px-2"
                    style={{ width: `${100 / tujuanCardsPerView}%` }}
                  >
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between h-full min-h-[220px] overflow-hidden relative">
                      {/* Top gradient bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

                      <div>
                        <div className={`text-2xl mb-4 text-white group-hover:scale-110 transition-transform duration-300 w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                          {getTujuanIcon(index)}
                        </div>
                        {hasTitle && <h3 className="font-bold text-primary-950 text-base mb-2">{title}</h3>}
                        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots indicator for Tujuan */}
          {tujuan.length > tujuanCardsPerView && (
            <div className="flex items-center justify-center gap-2 mt-5">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: maxTujuanSlide + 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTujuan(idx)}
                    className={`transition-all duration-300 rounded-full ${
                      idx === currentTujuan ? "w-6 h-2 bg-primary-600" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Tujuan slide ${idx + 1}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400 font-medium tabular-nums ml-2">
                {currentTujuan + 1} / {maxTujuanSlide + 1}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
