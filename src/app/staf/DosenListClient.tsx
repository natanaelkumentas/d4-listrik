"use client";

import { useEffect, useState } from "react";
import { useData } from "@/context/DataContext";
import DosenCard from "@/components/dosen/DosenCard";
import { cachedFetch } from "@/lib/fetchCache";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";

export default function DosenListClient() {
  const { dosenList, ensureDosenLoaded, isDosenLoaded } = useData();
  const [pegawaiList, setPegawaiList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"semua" | "dosen" | "pegawai">("semua");
  const [isLoadingPegawai, setIsLoadingPegawai] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [prodiName, setProdiName] = useState("D4 Teknik Listrik");

  useEffect(() => {
    ensureDosenLoaded();
  }, [ensureDosenLoaded]);

  useEffect(() => {
    const fetchPegawai = async () => {
      try {
        const data = await cachedFetch<any[]>("/api/pegawai");
        setPegawaiList(data || []);
      } catch (e) {
        console.error("Failed to fetch pegawai list", e);
      } finally {
        setIsLoadingPegawai(false);
      }
    };
    fetchPegawai();
  }, []);

  useEffect(() => {
    const getProdiName = async () => {
      try {
        const data = await cachedFetch<any>("/api/config?section=prodi_info");
        if (data?.prodi_info?.nama) {
          setProdiName(data.prodi_info.nama);
        }
      } catch (e) {
        console.error("Failed to fetch prodi name info:", e);
      }
    };
    getProdiName();
  }, []);

  const filteredDosenList = dosenList.filter(
    (d) => (d.programStudi || "").trim().toLowerCase() === prodiName.trim().toLowerCase()
  );

  const filteredDosen = activeTab === "pegawai" ? [] : filteredDosenList;
  const filteredPegawai = activeTab === "dosen" ? [] : pegawaiList;

  const combinedList = [
    ...filteredDosen.map((d) => ({ ...d, _type: "dosen" as const })),
    ...filteredPegawai.map((p) => ({ ...p, _type: "pegawai" as const })),
  ]
    .filter((person) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        person.nama.toLowerCase().includes(q) ||
        (person.nip || "").toLowerCase().includes(q) ||
        (person.jabatan || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const isLoading = !isDosenLoaded || isLoadingPegawai;

  const dosenCount = filteredDosenList.length;
  const pegawaiCount = pegawaiList.length;
  const totalCount = dosenCount + pegawaiCount;


  const getTabCount = (tab: string) => {
    if (tab === "semua") return totalCount;
    if (tab === "dosen") return dosenCount;
    return pegawaiCount;
  };

  return (
    <div className="space-y-6">
      {/* Toolbar: Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Tabs with count */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(["semua", "dosen", "pegawai"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === tab
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "semua" ? "Semua" : tab === "dosen" ? "Dosen" : "Pegawai"}
              {!isLoading && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-200 text-gray-500"
                }`}>
                  {getTabCount(tab)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
            <HiMagnifyingGlass className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Cari staf..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-primary-950 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <HiXMark className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      {!isLoading && (
        <p className="text-sm text-gray-500">
          Menampilkan <span className="font-semibold text-primary-700">{combinedList.length}</span> staf
        </p>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <div className="text-center text-gray-400 font-medium animate-pulse">Loading Staf...</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {combinedList.map((person, index) => (
              <DosenCard
                key={`${person._type}-${person.id}`}
                person={person}
                type={person._type}
                index={index}
              />
            ))}
          </div>

          {combinedList.length === 0 && (
            <div className="text-center py-12">
              <HiMagnifyingGlass className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {searchQuery
                  ? "Tidak ada staf yang cocok dengan pencarian."
                  : "Belum ada data staf untuk kategori ini."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
