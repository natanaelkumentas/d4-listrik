"use client";

import { useEffect, useState } from "react";
import PageHero from "@/components/universal/PageHero";
import VisiSection from "@/components/tentang/VisiSection";
import MisiSection from "@/components/tentang/MisiSection";
import TujuanSection from "@/components/tentang/TujuanSection";
import { cachedFetch } from "@/lib/fetchCache";
import { HiAcademicCap, HiUserGroup, HiWrenchScrewdriver, HiBuildingLibrary } from "react-icons/hi2";
import LazySection from "@/components/universal/LazySection";


interface ProdiInfoData {
  nama: string;
  nama_alternatif: string | null;
  nama_kampus: string;
  deskripsi: string | null;
}

interface VisiMisiItem {
  id: string;
  kategori: "visi" | "misi" | "tujuan";
  konten: string;
  urutan: number;
}

const highlights = [
  {
    icon: <HiAcademicCap className="w-6 h-6" />,
    title: "D4 / Sarjana Terapan",
    desc: "Program diploma empat setara sarjana terapan",
    color: "from-primary-600 to-primary-700",
    bg: "bg-primary-50",
    text: "text-primary-700",
  },
  {
    icon: <HiUserGroup className="w-6 h-6" />,
    title: "Dosen Berkualitas",
    desc: "Tenaga pengajar profesional dan berpengalaman",
    color: "from-primary-500 to-primary-600",
    bg: "bg-primary-50",
    text: "text-primary-600",
  },
  {
    icon: <HiWrenchScrewdriver className="w-6 h-6" />,
    title: "Praktik Intensif",
    desc: "Kurikulum berbasis kompetensi dengan pendekatan hands-on",
    color: "from-primary-500 to-primary-700",
    bg: "bg-primary-50",
    text: "text-primary-600",
  },
  {
    icon: <HiBuildingLibrary className="w-6 h-6" />,
    title: "Lab Modern",
    desc: "Fasilitas laboratorium berstandar industri",
    color: "from-primary-700 to-primary-800",
    bg: "bg-primary-100",
    text: "text-primary-800",
  },
];

export default function TentangPage() {
  const [prodiInfo, setProdiInfo] = useState<ProdiInfoData | null>(null);
  const [visiMisiTujuan, setVisiMisiTujuan] = useState<VisiMisiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = await cachedFetch<any>("/api/config?section=all");
        if (config?.prodi_info) setProdiInfo(config.prodi_info);
        if (config?.visi_misi_tujuan) setVisiMisiTujuan(config.visi_misi_tujuan);
      } catch (e) {
        console.error("Failed to fetch tentang data", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const visi = visiMisiTujuan.filter((i) => i.kategori === "visi").sort((a, b) => a.urutan - b.urutan);
  const misi = visiMisiTujuan.filter((i) => i.kategori === "misi").sort((a, b) => a.urutan - b.urutan);
  const tujuan = visiMisiTujuan.filter((i) => i.kategori === "tujuan").sort((a, b) => a.urutan - b.urutan);

  return (
    <>
      <PageHero
        title="Tentang Program Studi"
        subtitle="Mengenal lebih dekat visi, misi, dan tujuan D4 Teknik Listrik Politeknik Negeri Manado."
      />

      {/* ===== Prodi Overview Section ===== */}
      <section className="py-24 bg-white relative overflow-hidden text-primary-950">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary-50/50 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-accent-400/5 blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-6 bg-gray-200 rounded w-64" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-gray-100 rounded-2xl" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Top row: Description */}
              <div className="animate-fade-in-up mb-16">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 text-primary-600 text-xs font-semibold uppercase tracking-wider mb-6">
                  <HiAcademicCap className="w-4 h-4" />
                  Profil Program Studi
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-primary-950 mb-3 leading-tight">
                  {prodiInfo?.nama || ""}
                </h2>
                {prodiInfo?.nama_alternatif && (
                  <p className="text-sm text-primary-600 font-medium mb-5">
                    {prodiInfo.nama_alternatif} — {prodiInfo.nama_kampus || ""}
                  </p>
                )}
                <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                  {prodiInfo?.deskripsi || ""}
                </p>
                <div className="mt-6 h-1 w-16 bg-gradient-to-r from-primary-600 to-accent-500 rounded-full" />
              </div>

              {/* Highlight cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up delay-300">
                {highlights.map((item, i) => (
                  <div
                    key={i}
                    className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  >
                    {/* Top gradient bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color}`} />

                    <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center ${item.text} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-primary-950 text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ===== Visi Section (Dark Blue) ===== */}
      <LazySection placeholderHeight="400px">
        <VisiSection items={visi} />
      </LazySection>

      {/* ===== Misi Section (White) ===== */}
      <LazySection placeholderHeight="450px">
        <MisiSection items={misi} />
      </LazySection>

      {/* ===== Tujuan Section (Dark Blue) ===== */}
      <LazySection placeholderHeight="500px">
        <TujuanSection items={tujuan} />
      </LazySection>
    </>
  );
}
