"use client";

import { useEffect } from "react";
import { useData } from "@/context/DataContext";
import DosenCard from "@/components/dosen/DosenCard";

export default function DosenListClient() {
  const { dosenList, ensureDosenLoaded } = useData();

  useEffect(() => { ensureDosenLoaded(); }, [ensureDosenLoaded]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {dosenList.map((dosen, index) => (
        <DosenCard key={dosen.id} dosen={dosen} index={index} />
      ))}
      {dosenList.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          Belum ada data dosen.
        </div>
      )}
    </div>
  );
}
