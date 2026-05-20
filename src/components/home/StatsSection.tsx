"use client";

import { useEffect, useState, useRef } from "react";
import { HiAcademicCap, HiUserGroup, HiBookOpen, HiTrophy } from "react-icons/hi2";
import { cachedFetch } from "@/lib/fetchCache";

interface StatItem {
  label: string;
  value: number;
  suffix: string;
  icon: React.ReactNode;
}

function AnimatedCounter({
  target,
  suffix,
  inView,
}: {
  target: number;
  suffix: string;
  inView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, inView]);

  return (
    <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-700 to-primary-600 bg-clip-text text-transparent">
      {count.toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statData, kurikulumData] = await Promise.all([
          cachedFetch<any>("/api/statistik"),
          cachedFetch<any>("/api/kurikulum"),
        ]);

        let mahasiswaAktif = 0;
        let lulusan = 0;
        let dosenCount = 0;
        let mataKuliahCount = 0;

        mahasiswaAktif = statData.total_mahasiswa_aktif || 0;
        lulusan = statData.total_lulusan || 0;
        dosenCount = statData.total_dosen || 0;
        mataKuliahCount = kurikulumData.mata_kuliah?.length || 0;

        setStats([
          { label: "Mahasiswa Aktif", value: mahasiswaAktif, suffix: "+", icon: <HiAcademicCap className="text-primary-600" /> },
          { label: "Dosen Pengajar", value: dosenCount, suffix: "", icon: <HiUserGroup className="text-primary-600" /> },
          { label: "Mata Kuliah", value: mataKuliahCount, suffix: "+", icon: <HiBookOpen className="text-primary-600" /> },
          { label: "Lulusan", value: lulusan, suffix: "+", icon: <HiTrophy className="text-primary-600" /> },
        ]);
      } catch (e) {
        console.error("Failed to fetch stats", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <section ref={ref} className="py-16 bg-gradient-to-b from-primary-50/50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse"
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-lg mb-3" />
                  <div className="w-20 h-9 bg-gray-200 rounded-lg mb-2" />
                  <div className="w-24 h-4 bg-gray-100 rounded" />
                </div>
              ))
            : stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-2xl mb-3">{stat.icon}</div>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} inView={inView} />
                  <p className="mt-1 text-sm text-gray-500 font-medium">{stat.label}</p>

                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary-50 to-transparent rounded-bl-3xl rounded-tr-2xl" />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
