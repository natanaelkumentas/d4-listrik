"use client";

import { useState, useEffect } from "react";
import { HiBolt, HiChevronLeft, HiChevronRight } from "react-icons/hi2";

interface VisiMisiItem {
  id: string;
  kategori: "visi" | "misi" | "tujuan";
  konten: string;
  urutan: number;
}

interface TujuanSectionProps {
  items: VisiMisiItem[];
}

const tujuanGradients = [
  "from-accent-400 to-accent-600",
  "from-accent-400 to-accent-500",
  "from-accent-500 to-accent-600",
  "from-accent-400 to-accent-600",
];

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

export default function TujuanSection({ items }: TujuanSectionProps) {
  const [currentTujuan, setCurrentTujuan] = useState(0);
  const [tujuanCardsPerView, setTujuanCardsPerView] = useState(2);

  useEffect(() => {
    function handleResize() {
      if (typeof window !== "undefined") {
        if (window.innerWidth < 640) setTujuanCardsPerView(1);
        else setTujuanCardsPerView(2);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxTujuanSlide = Math.max(0, items.length - tujuanCardsPerView);

  // Auto-play Tujuan
  useEffect(() => {
    if (items.length <= tujuanCardsPerView) return;
    const interval = setInterval(() => {
      setCurrentTujuan((prev) => (prev >= maxTujuanSlide ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length, tujuanCardsPerView, maxTujuanSlide]);

  if (items.length === 0) return null;

  return (
    <section className="py-24 bg-gradient-to-br from-primary-950 via-primary-950/95 to-primary-900/90 relative overflow-hidden border-y border-primary-900 text-white">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent-400/5 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-primary-400/5 blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] z-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex items-center justify-between mb-10 max-w-3xl mx-auto">
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-900/80 text-primary-300 border border-primary-800/30 text-xs font-semibold uppercase tracking-wider mb-4 w-fit">
              <HiBolt className="w-4 h-4 text-accent-400" />
              Target & Sasaran
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Tujuan Program Studi</h2>
          </div>

          {/* Nav arrows for Tujuan */}
          {items.length > tujuanCardsPerView && (
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentTujuan((prev) => (prev <= 0 ? maxTujuanSlide : prev - 1))}
                className="w-9 h-9 rounded-full bg-primary-900 border border-primary-800 flex items-center justify-center text-white hover:bg-primary-800 hover:border-primary-700 transition-all hover:scale-110 active:scale-95 shadow-lg"
                aria-label="Tujuan sebelumnya"
              >
                <HiChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentTujuan((prev) => (prev >= maxTujuanSlide ? 0 : prev + 1))}
                className="w-9 h-9 rounded-full bg-primary-900 border border-primary-800 flex items-center justify-center text-white hover:bg-primary-800 hover:border-primary-700 transition-all hover:scale-110 active:scale-95 shadow-lg"
                aria-label="Tujuan berikutnya"
              >
                <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="relative overflow-hidden -mx-2 px-2 max-w-3xl mx-auto">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${currentTujuan * (100 / tujuanCardsPerView)}%)`,
            }}
          >
            {items.map((t, index) => {
              const { title, desc } = parseContent(t.konten, index, "Tujuan");
              const hasTitle = t.konten.includes(":") && t.konten.split(":")[0].trim().length < 45;
              const gradient = tujuanGradients[index % tujuanGradients.length];
              return (
                <div
                  key={t.id}
                  className="flex-shrink-0 px-2"
                  style={{ width: `${100 / tujuanCardsPerView}%` }}
                >
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-sm hover:shadow-xl hover:border-accent-400/30 transition-all duration-300 group flex flex-col justify-between h-full min-h-[220px] overflow-hidden relative">
                    {/* Top gradient bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

                    <div>
                      <div className={`text-xl font-bold mb-4 text-white group-hover:scale-110 transition-transform duration-300 w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                        {index + 1}
                      </div>
                      {hasTitle && <h3 className="font-bold text-white text-base mb-2">{title}</h3>}
                      <p className="text-sm text-primary-200/70 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dots indicator for Tujuan */}
        {items.length > tujuanCardsPerView && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: maxTujuanSlide + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTujuan(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    idx === currentTujuan ? "w-6 h-2 bg-accent-400" : "w-2 h-2 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Tujuan slide ${idx + 1}`}
                />
              ))}
            </div>
            <span className="text-xs text-primary-300/60 font-medium tabular-nums ml-2">
              {currentTujuan + 1} / {maxTujuanSlide + 1}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
