"use client";

import { useEffect, useState } from "react";
import SectionTitle from "@/components/universal/SectionTitle";
import { cachedFetch } from "@/lib/fetchCache";

interface CPLSectionProps {
  cplList?: {
    kode: string;
    deskripsi: string;
    kategori?: string | null;
  }[];
}

export default function CPLSection({ cplList }: CPLSectionProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await cachedFetch<any[]>("/api/cpl-kategori");
        const catNames = cats.map(c => c.nama);
        
        // Extract any unique categories present in the actual CPL list
        const cplCats = Array.from(new Set((cplList || []).map(c => c.kategori || "Lainnya")));
        
        // Combine and filter duplicates
        const mergedCats = Array.from(new Set([...catNames, ...cplCats])).filter(Boolean);
        
        setCategories(mergedCats);
        if (mergedCats.length > 0) {
          setActiveCategory(mergedCats[0]);
        }
      } catch (e) {
        console.error("Failed to fetch CPL categories", e);
        // Fallback to unique categories in cplList
        const cplCats = Array.from(new Set((cplList || []).map(c => c.kategori || "Lainnya"))).filter(Boolean);
        setCategories(cplCats);
        if (cplCats.length > 0) {
          setActiveCategory(cplCats[0]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, [cplList]);

  const filteredCplList = (cplList || []).filter(c => {
    const cat = c.kategori || "Lainnya";
    return cat.toLowerCase() === activeCategory.toLowerCase();
  });

  return (
    <div>
      <SectionTitle
        title="Capaian Pembelajaran Lulusan"
        subtitle="Kompetensi yang harus dicapai oleh lulusan program studi."
      />

      {/* Category Tabs */}
      {categories.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => {
            const isActive = cat.toLowerCase() === activeCategory.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer shadow-sm ${
                  isActive
                    ? "bg-primary-600 text-white shadow-md scale-105"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-primary-600 border border-gray-100"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* CPL List Grid */}
      <div className="grid gap-4 max-w-4xl mx-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-medium">Loading kategori...</p>
          </div>
        ) : filteredCplList.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm font-medium">Belum ada CPL untuk kategori ini</p>
          </div>
        ) : (
          filteredCplList.map((cpl, index) => (
            <div
              key={cpl.kode}
              className="flex items-start gap-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in-up"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white text-xs font-bold shadow-md">
                {cpl.kode.replace("CPL-", "")}
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700">
                  {cpl.kode}
                </span>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mt-2">{cpl.deskripsi}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
