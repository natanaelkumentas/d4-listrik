"use client";

import { useState } from "react";
import Link from "next/link";
import { Dosen, KaryaCategory, karyaCategoryLabels } from "@/types/dosen";
import { HiInboxStack } from "react-icons/hi2";

const categories: KaryaCategory[] = [
  "publikasi",
  "penelitian",
  "pengabdian",
  "bukuAjar",
  "hki",
  "sertifikasi",
];

export default function KaryaTabs({ dosen }: { dosen: Dosen }) {
  const [activeTab, setActiveTab] = useState<KaryaCategory>("publikasi");

  const items = dosen.karya[activeTab];

  return (
    <div>
      {/* Tab buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-6 w-full">
        {categories.map((cat) => {
          const count = dosen.karya[cat].length;
          const isActive = activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer w-full text-center ${
                isActive
                  ? "bg-primary-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {karyaCategoryLabels[cat]}
              <span
                className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in" key={activeTab}>
        {items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <HiInboxStack className="text-4xl mb-3 text-gray-300 mx-auto" />
            <p className="text-gray-400 text-sm font-medium">Belum ada data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <Link
                key={item.id}
                href={`/staf/${dosen.id}/karya/${activeTab}/${item.id}`}
                className="flex items-start gap-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-100 transition-all duration-200"
              >
                <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 text-xs font-bold">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <p className="text-sm font-medium text-primary-950 leading-snug">
                    {item.judul}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Tahun {item.tahun}</p>
                </div>
                <div className="flex-shrink-0 text-gray-300 flex items-center justify-center self-center group-hover:text-primary-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
