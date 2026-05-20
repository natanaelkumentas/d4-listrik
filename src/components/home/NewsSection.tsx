"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import SectionTitle from "@/components/universal/SectionTitle";
import {
  HiNewspaper,
  HiArrowTopRightOnSquare,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi2";

interface NewsArticle {
  id: string;
  judul: string;
  ringkasan: string;
  tanggal: string;
  url: string;
  gambar: string | null;
  sumber: string;
  warna?: string;
}

const gradientColors = [
  "from-blue-600 to-indigo-700",
  "from-emerald-600 to-teal-700",
  "from-amber-500 to-orange-600",
  "from-violet-600 to-purple-700",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];

export default function NewsSection() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cards per view based on screen size
  const [cardsPerView, setCardsPerView] = useState(3);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 640) setCardsPerView(1);
      else if (window.innerWidth < 1024) setCardsPerView(2);
      else setCardsPerView(3);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setArticles(data.articles?.slice(0, 10) || []);
        setIsLive(data.live === true);
      } catch {
        setArticles([]);
        setIsLive(false);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  const maxSlide = Math.max(0, articles.length - cardsPerView);

  const goToSlide = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, maxSlide));
      setCurrentSlide(clamped);
    },
    [maxSlide]
  );

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1));
  }, [maxSlide]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev <= 0 ? maxSlide : prev - 1));
  }, [maxSlide]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || articles.length <= cardsPerView) return;

    autoPlayRef.current = setInterval(() => {
      nextSlide();
    }, 4000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, nextSlide, articles.length, cardsPerView]);

  // Pause auto-play on hover
  const pauseAutoPlay = () => setIsAutoPlaying(false);
  const resumeAutoPlay = () => setIsAutoPlaying(true);

  // Dot indicators — show grouped dots
  const totalDots = maxSlide + 1;

  return (
    <section className="py-16 bg-white" id="berita">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Berita & Artikel Terkini"
          subtitle="Informasi terbaru seputar dunia ketenagalistrikan dan energi."
        />

        {/* Live indicator */}
        {isLive && !loading && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs text-gray-500 font-medium tracking-wide uppercase">
              Live — Artikel realtime dari berbagai sumber
            </span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-pulse"
              >
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-24" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Carousel */}
        {!loading && articles.length > 0 && (
          <div
            className="relative"
            onMouseEnter={pauseAutoPlay}
            onMouseLeave={resumeAutoPlay}
          >
            {/* Navigation arrows */}
            {articles.length > cardsPerView && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-primary-700 hover:bg-primary-50 hover:border-primary-200 transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Slide sebelumnya"
                >
                  <HiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-primary-700 hover:bg-primary-50 hover:border-primary-200 transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Slide berikutnya"
                >
                  <HiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            {/* Slides container */}
            <div className="overflow-hidden rounded-2xl" ref={scrollRef}>
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${currentSlide * (100 / cardsPerView)}%)`,
                }}
              >
                {articles.map((article, index) => (
                  <div
                    key={article.id}
                    className="flex-shrink-0 px-3"
                    style={{ width: `${100 / cardsPerView}%` }}
                  >
                    <a
                      href={article.url}
                      target={article.url !== "#" ? "_blank" : undefined}
                      rel={
                        article.url !== "#" ? "noopener noreferrer" : undefined
                      }
                      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block h-full"
                    >
                      {/* Image or gradient placeholder */}
                      {article.gambar ? (
                        <div className="h-48 overflow-hidden relative">
                          <img
                            src={article.gambar}
                            alt={article.judul}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = "none";
                              const fallback =
                                target.nextElementSibling?.nextElementSibling;
                              if (fallback instanceof HTMLElement) {
                                fallback.style.display = "flex";
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                          {/* Hidden fallback for broken images */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${gradientColors[index % gradientColors.length]} items-center justify-center text-white`}
                            style={{ display: "none" }}
                          >
                            <HiNewspaper className="text-5xl opacity-30" />
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`h-48 bg-gradient-to-br ${article.warna || gradientColors[index % gradientColors.length]} flex items-center justify-center relative overflow-hidden text-white`}
                        >
                          <HiNewspaper className="text-5xl opacity-30 group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                      )}

                      <div className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <time className="text-xs text-primary-600 font-semibold uppercase tracking-wider">
                            {article.tanggal}
                          </time>
                          {article.sumber &&
                            article.sumber !== "Artikel Statis" && (
                              <span className="text-[10px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium truncate max-w-[120px]">
                                {article.sumber}
                              </span>
                            )}
                        </div>
                        <h3 className="text-base font-bold text-primary-950 leading-snug group-hover:text-primary-700 transition-colors line-clamp-2 min-h-[2.75rem]">
                          {article.judul}
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-3 min-h-[3.75rem]">
                          {article.ringkasan}
                        </p>
                        <div className="mt-4 inline-flex items-center text-sm font-semibold text-primary-600 group-hover:text-primary-700">
                          {article.url !== "#"
                            ? "Baca selengkapnya"
                            : "Lihat detail"}
                          {article.url !== "#" ? (
                            <HiArrowTopRightOnSquare className="ml-1.5 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          ) : (
                            <svg
                              className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Dot indicators + counter */}
            {articles.length > cardsPerView && (
              <div className="flex items-center justify-center mt-8 gap-4">
                {/* Dots */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalDots }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToSlide(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === currentSlide
                          ? "w-8 h-2.5 bg-primary-600"
                          : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Counter */}
                <span className="text-xs text-gray-400 font-medium tabular-nums">
                  {currentSlide + 1}–
                  {Math.min(currentSlide + cardsPerView, articles.length)} /{" "}
                  {articles.length}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && articles.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <HiNewspaper className="mx-auto text-4xl mb-3 opacity-50" />
            <p className="text-sm">Tidak ada artikel tersedia saat ini.</p>
          </div>
        )}
      </div>
    </section>
  );
}
