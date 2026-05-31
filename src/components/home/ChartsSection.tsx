"use client";

import { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area
} from "recharts";
import { cachedFetch } from "@/lib/fetchCache";

const COLORS = ["#0284c7", "#0d9488", "#4f46e5", "#b45309", "#be123c", "#6d28d9", "#15803d", "#c2410c"];

export default function ChartsSection() {
  const [mahasiswaChartType, setMahasiswaChartType] = useState<"bar" | "pie" | "line">("bar");
  const [lulusanChartType, setLulusanChartType] = useState<"bar" | "line" | "area">("area");
  
  const [mahasiswaData, setMahasiswaData] = useState<any[]>([]);
  const [lulusanData, setLulusanData] = useState<any[]>([]);
  const [activeSemester, setActiveSemester] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Semester graph filter states
  const [filterJenis, setFilterJenis] = useState<"ganjil" | "genap">("ganjil");
  const [filterTahunMulai, setFilterTahunMulai] = useState<number>(new Date().getFullYear());
  const [selectedSemNotFound, setSelectedSemNotFound] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const fetchStatsForSemester = async (jenis: "ganjil" | "genap", tahunMulai: number) => {
    if (!tahunMulai) return;
    setIsLoadingStats(true);
    try {
      const y1 = String(tahunMulai).slice(-2);
      const y2 = String(tahunMulai + 1).slice(-2);
      const prefix = jenis === "ganjil" ? "ga" : "ge";
      const semId = `${prefix}${y1}${y2}`;

      const res = await fetch(`/api/statistik?semester_id=${semId}`);
      const data = await res.json();
      if (data) {
        setSelectedSemNotFound(data.semester_not_found);
        if (data.per_level && data.per_level.length > 0) {
          const formatted = data.per_level.map((row: any) => ({
            name: `Semester ${row.semester_level}`,
            "Jumlah Mahasiswa": row.total_mahasiswa_aktif || 0,
          }));
          setMahasiswaData(formatted);
        } else {
          setMahasiswaData([]);
        }
      }
    } catch (e) {
      console.error("Failed to load statistics for semester", e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const fetchChartData = async () => {
      try {
        const stats = await cachedFetch<any>("/api/statistik");
        if (stats?.lulusan_per_tahun) {
          const formatted = stats.lulusan_per_tahun.map((row: any) => ({
            name: String(row.tahun),
            "Jumlah Lulusan": row.jumlah_lulusan || 0,
          }));
          setLulusanData(formatted);
        }
        if (stats?.active_semester) {
          const sem = stats.active_semester;
          setActiveSemester(`${sem.jenis === "ganjil" ? "Ganjil" : "Genap"} TA ${sem.tahun_akademik}`);
          setFilterJenis(sem.jenis);
          const startYear = parseInt(sem.tahun_akademik.split("/")[0]) || new Date().getFullYear();
          setFilterTahunMulai(startYear);
        }
      } catch (e) {
        console.error("Failed to load chart stats", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChartData();
  }, []);

  useEffect(() => {
    if (!isLoading && mounted) {
      fetchStatsForSemester(filterJenis, filterTahunMulai);
    }
  }, [filterJenis, filterTahunMulai, isLoading, mounted]);

  if (!mounted) return null;

  if (isLoading) {
    return (
      <section className="min-h-screen flex items-center bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-80 flex items-center justify-center animate-pulse">
            <p className="text-gray-400 font-semibold">Memuat grafik statistik...</p>
          </div>
        </div>
      </section>
    );
  }

  // Show section if at least one data array is populated
  if (mahasiswaData.length === 0 && lulusanData.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        {/* Section heading */}
        <div className="text-center mb-12 animate-fade-in-up">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 text-primary-600 text-xs font-semibold uppercase tracking-wider mb-4">
            Grafik & Data
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-950">Visualisasi Statistik Akademik</h2>
          <p className="mt-2 text-gray-500 text-sm sm:text-base max-w-lg mx-auto">
            Monitoring data mahasiswa aktif dan total kelulusan alumni program studi.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto animate-fade-in-up delay-100">
          
          {/* Card 1: Mahasiswa per Semester */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-6 pb-4 border-b border-gray-50">
                <div className="space-y-2.5">
                  <h3 className="text-lg font-bold text-primary-950">Statistik Mahasiswa per Semester</h3>
                  
                  {/* Semester graph selectors */}
                  <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100 w-fit">
                    <select
                      value={filterJenis}
                      onChange={(e) => setFilterJenis(e.target.value as any)}
                      className="px-2.5 py-1 rounded bg-white border border-gray-205 text-xs font-bold text-gray-700 outline-none cursor-pointer focus:border-primary-500 capitalize"
                    >
                      <option value="ganjil">Ganjil</option>
                      <option value="genap">Genap</option>
                    </select>

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        required
                        min="2000"
                        max="2099"
                        value={filterTahunMulai === 0 ? "" : filterTahunMulai}
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 0;
                          setFilterTahunMulai(val);
                        }}
                        className="w-16 px-1.5 py-1 rounded bg-white border border-gray-200 text-xs font-bold text-gray-700 text-center outline-none focus:border-primary-500"
                        placeholder="Mulai"
                      />
                      <span className="text-gray-400 text-xs font-bold">/</span>
                      <input
                        type="number"
                        required
                        min="2000"
                        max="2099"
                        value={filterTahunMulai === 0 ? "" : filterTahunMulai + 1}
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 0;
                          setFilterTahunMulai(val === 0 ? 0 : val - 1);
                        }}
                        className="w-16 px-1.5 py-1 rounded bg-white border border-gray-200 text-xs font-bold text-gray-700 text-center outline-none focus:border-primary-500"
                        placeholder="Akhir"
                      />
                    </div>
                  </div>
                </div>

                {/* Selector */}
                <div className="flex bg-gray-100 rounded-lg p-0.5 self-end sm:self-auto">
                  {(["bar", "pie", "line"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setMahasiswaChartType(type)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        mahasiswaChartType === type
                          ? "bg-white text-primary-700 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {type === "bar" ? "Bar" : type === "pie" ? "Pie" : "Line"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart container */}
              {isLoadingStats ? (
                <div className="h-72 w-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : selectedSemNotFound ? (
                <div className="h-72 w-full flex flex-col items-center justify-center text-center p-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-sm font-semibold text-gray-500">
                    Tidak ada data untuk semester <span className="text-primary-700 font-bold capitalize">{filterJenis}-{filterTahunMulai}/{filterTahunMulai + 1}</span>.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Silakan masukkan semester akademik yang lain.
                  </p>
                </div>
              ) : mahasiswaData.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    {mahasiswaChartType === "bar" ? (
                      <BarChart data={mahasiswaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#1e293b", borderRadius: "12px", border: "none", color: "#fff" }}
                          itemStyle={{ color: "#38bdf8" }}
                        />
                        <Legend />
                        <Bar dataKey="Jumlah Mahasiswa" fill="#0284c7" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    ) : mahasiswaChartType === "line" ? (
                      <LineChart data={mahasiswaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#1e293b", borderRadius: "12px", border: "none", color: "#fff" }}
                          itemStyle={{ color: "#38bdf8" }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="Jumlah Mahasiswa" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 8 }} />
                      </LineChart>
                    ) : (
                      <PieChart>
                        <Pie
                          data={mahasiswaData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="Jumlah Mahasiswa"
                        >
                          {mahasiswaData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 w-full flex items-center justify-center text-gray-400 text-sm">
                  Tidak ada data statistik mahasiswa.
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Lulusan per Tahun */}
          {lulusanData.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-primary-950">Statistik Lulusan per Tahun</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Data akumulasi lulusan program studi
                    </p>
                  </div>
                  
                  {/* Selector */}
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    {(["bar", "line", "area"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setLulusanChartType(type)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          lulusanChartType === type
                            ? "bg-white text-primary-700 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {type === "bar" ? "Bar" : type === "line" ? "Line" : "Area"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chart container */}
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    {lulusanChartType === "bar" ? (
                      <BarChart data={lulusanData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#1e293b", borderRadius: "12px", border: "none", color: "#fff" }}
                          itemStyle={{ color: "#34d399" }}
                        />
                        <Legend />
                        <Bar dataKey="Jumlah Lulusan" fill="#0d9488" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    ) : lulusanChartType === "line" ? (
                      <LineChart data={lulusanData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#1e293b", borderRadius: "12px", border: "none", color: "#fff" }}
                          itemStyle={{ color: "#34d399" }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="Jumlah Lulusan" stroke="#0d9488" strokeWidth={3} activeDot={{ r: 8 }} />
                      </LineChart>
                    ) : (
                      <AreaChart data={lulusanData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorLulusan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#1e293b", borderRadius: "12px", border: "none", color: "#fff" }}
                          itemStyle={{ color: "#34d399" }}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="Jumlah Lulusan" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorLulusan)" />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
