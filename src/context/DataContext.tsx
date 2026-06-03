"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Dosen } from "@/types/dosen";
import { GaleriItem } from "@/types/galeri";
import { Pegawai } from "@/types/pegawai";
import { cachedFetch, invalidateCache } from "@/lib/fetchCache";

interface DataContextType {
  dosenList: Dosen[];
  pegawaiList: Pegawai[];
  isLoading: boolean;
  isDosenLoaded: boolean;
  isPegawaiLoaded: boolean;

  // Dosen Actions
  addDosen: (dosen: Dosen, password?: string) => Promise<void>;
  updateDosen: (id: string, updatedDosen: Dosen, password?: string) => Promise<void>;
  deleteDosen: (id: string) => Promise<void>;

  // Pegawai Actions
  addPegawai: (pegawai: Omit<Pegawai, "id">, password?: string) => Promise<void>;
  updatePegawai: (id: string, updatedPegawai: Partial<Pegawai>, password?: string) => Promise<void>;
  deletePegawai: (id: string) => Promise<void>;

  // Lazy loaders — only fetch when first consumer needs the data
  ensureDosenLoaded: () => void;
  ensurePegawaiLoaded: () => void;

  // Force refresh
  refreshDosen: () => Promise<void>;
  refreshPegawai: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

/**
 * Transform raw DB dosen row (with flat karya[]) into the nested Dosen shape
 * expected by existing components.
 */
function transformDosenFromApi(raw: any): Dosen {
  const karya = raw.karya || [];

  const groupedKarya = {
    publikasi: karya.filter((k: any) => k.jenis === "publikasi").map(mapKarya),
    penelitian: karya.filter((k: any) => k.jenis === "penelitian").map(mapKarya),
    pengabdian: karya.filter((k: any) => k.jenis === "pengabdian").map(mapKarya),
    bukuAjar: karya.filter((k: any) => k.jenis === "bukuAjar").map(mapKarya),
    hki: karya.filter((k: any) => k.jenis === "hki").map(mapKarya),
    sertifikasi: karya.filter((k: any) => k.jenis === "sertifikasi").map(mapKarya),
  };

  return {
    id: raw.id,
    nama: raw.nama,
    nip: raw.nip,
    foto: raw.foto_url || null,
    jabatan: raw.jabatan || undefined,
    pangkat: raw.pangkat || undefined,
    email: raw.email || undefined,
    telepon: raw.telepon || undefined,
    programStudi: raw.program_studi || undefined,
    pendidikanTerakhir: raw.pendidikan_terakhir || undefined,
    bidangKeahlian: raw.bidang_keahlian || [],
    social_media: raw.social_media || {},
    visibility_settings: raw.visibility_settings || {},
    karya: groupedKarya,
  };
}

function mapKarya(k: any) {
  return {
    id: k.id,
    jenis: k.jenis,
    judul: k.judul,
    tahun: k.tahun,
    dosen_id: k.dosen_id,
    deskripsi: k.deskripsi || undefined,
    metadata: k.metadata || undefined,
    ...(k.metadata || {}),
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // ── Synchronous path tracking ──────────────────────────────────
  // Must run during render (not in useEffect) so that sessionStorage
  // is up-to-date BEFORE child components read it in useState initializers.
  const lastTrackedPathname = useRef<string>("");

  if (pathname !== lastTrackedPathname.current) {
    try {
      const currentPrev = sessionStorage.getItem("current_path");
      if (currentPrev && currentPrev !== pathname) {
        sessionStorage.setItem("prev_path", currentPrev);
      }
      sessionStorage.setItem("current_path", pathname);
    } catch {
      // sessionStorage unavailable
    }
    lastTrackedPathname.current = pathname;
  }

  const [dosenList, setDosenList] = useState<Dosen[]>([]);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [isDosenLoaded, setIsDosenLoaded] = useState(false);
  const [isPegawaiLoaded, setIsPegawaiLoaded] = useState(false);

  // Refs to prevent duplicate concurrent fetches
  const dosenFetchRef = useRef<Promise<void> | null>(null);
  const pegawaiFetchRef = useRef<Promise<void> | null>(null);

  const refreshDosen = useCallback(async () => {
    try {
      // Invalidate cache so we get fresh data after mutations
      invalidateCache("/api/dosen");
      invalidateCache("/api/karya");

      // Fetch all dosen and all published karya in parallel
      const [dosenRows, allKarya] = await Promise.all([
        cachedFetch<any[]>("/api/dosen"),
        cachedFetch<any[]>("/api/karya"),
      ]);

      // Group karya by dosen_id
      const karyaByDosen = (allKarya || []).reduce((acc: Record<string, any[]>, k: any) => {
        if (!acc[k.dosen_id]) acc[k.dosen_id] = [];
        acc[k.dosen_id].push(k);
        return acc;
      }, {});

      // For each dosen, attach their karya
      const dosenWithKarya: Dosen[] = dosenRows.map((d: any) => {
        const karya = karyaByDosen[d.id] || [];
        return transformDosenFromApi({ ...d, karya });
      });

      // Cross-reference: if a karya's metadata links other dosen,
      // add that karya to those dosen's lists too.
      const dosenMap = new Map(dosenWithKarya.map(d => [d.id, d]));

      for (const owner of dosenWithKarya) {
        const allOwnerKarya = Object.values(owner.karya).flat();
        for (const k of allOwnerKarya) {
          const meta = (k as any).metadata;
          if (!meta) continue;
          // Collect all person-link IDs from metadata
          const linkedIds = new Set<string>();
          for (const val of Object.values(meta)) {
            if (Array.isArray(val)) {
              for (const p of val) {
                if (p && typeof p === "object" && p.id) linkedIds.add(p.id);
              }
            } else if (val && typeof val === "object" && (val as any).id) {
              linkedIds.add((val as any).id);
            }
          }
          // Remove the owner themselves
          linkedIds.delete(owner.id);
          // Add karya to each linked dosen's list (if not already present)
          for (const linkedId of linkedIds) {
            const target = dosenMap.get(linkedId);
            if (!target) continue;
            const jenis = (k as any).jenis as string;
            const cat = jenis as keyof Dosen["karya"];
            if (!target.karya[cat]) continue;
            const existing = target.karya[cat] as any[];
            if (!existing.some((e: any) => e.id === (k as any).id)) {
              existing.push(k);
            }
          }
        }
      }

      setDosenList(dosenWithKarya);
    } catch (e) {
      console.error("Failed to fetch dosen", e);
    }
  }, []);

  const refreshPegawai = useCallback(async () => {
    try {
      invalidateCache("/api/pegawai");
      const data = await cachedFetch<any[]>("/api/pegawai");
      setPegawaiList(data || []);
    } catch (e) {
      console.error("Failed to fetch pegawai", e);
    }
  }, []);

  // Lazy loaders: only fetch when a consumer first needs the data
  const ensureDosenLoaded = useCallback(() => {
    if (isDosenLoaded || dosenFetchRef.current) return;
    const promise = refreshDosen().then(() => {
      setIsDosenLoaded(true);
      dosenFetchRef.current = null;
    });
    dosenFetchRef.current = promise;
  }, [isDosenLoaded, refreshDosen]);

  const ensurePegawaiLoaded = useCallback(() => {
    if (isPegawaiLoaded || pegawaiFetchRef.current) return;
    const promise = refreshPegawai().then(() => {
      setIsPegawaiLoaded(true);
      pegawaiFetchRef.current = null;
    });
    pegawaiFetchRef.current = promise;
  }, [isPegawaiLoaded, refreshPegawai]);

  // isLoading is true only when data has been requested but hasn't arrived yet
  const isLoading = (!isDosenLoaded && dosenFetchRef.current !== null) ||
                    (!isPegawaiLoaded && pegawaiFetchRef.current !== null);

  // --- Dosen Actions ---
  const addDosen = async (dosen: Dosen, password?: string) => {
    const res = await fetch("/api/dosen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: dosen.nama,
        nip: dosen.nip,
        foto_url: dosen.foto || null,
        jabatan: dosen.jabatan || null,
        pangkat: dosen.pangkat || null,
        email: dosen.email || null,
        password: password || null,
        telepon: dosen.telepon || null,
        bidang_keahlian: dosen.bidangKeahlian || [],
        program_studi: dosen.programStudi || "D4 Teknik Listrik",
        pendidikan_terakhir: dosen.pendidikanTerakhir || null,
        social_media: dosen.social_media || {},
        visibility_settings: dosen.visibility_settings || {},
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to add dosen");
    }
    await refreshDosen();
  };

  const updateDosen = async (id: string, updatedDosen: Dosen, password?: string) => {
    const res = await fetch(`/api/dosen/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: updatedDosen.nama,
        foto_url: updatedDosen.foto || null,
        jabatan: updatedDosen.jabatan || null,
        pangkat: updatedDosen.pangkat || null,
        email: updatedDosen.email || null,
        telepon: updatedDosen.telepon || null,
        bidang_keahlian: updatedDosen.bidangKeahlian || [],
        program_studi: updatedDosen.programStudi || "D4 Teknik Listrik",
        pendidikan_terakhir: updatedDosen.pendidikanTerakhir || null,
        password: password || null,
        social_media: updatedDosen.social_media || {},
        visibility_settings: updatedDosen.visibility_settings || {},
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update dosen");
    }
    await refreshDosen();
  };

  const deleteDosen = async (id: string) => {
    const res = await fetch(`/api/dosen/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete dosen");
    }
    await refreshDosen();
  };

  // --- Pegawai Actions ---
  const addPegawai = async (pegawai: Omit<Pegawai, "id">, password?: string) => {
    const res = await fetch("/api/pegawai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: pegawai.nama,
        nip: pegawai.nip,
        foto_url: pegawai.foto_url || null,
        email: pegawai.email || null,
        password: password || null,
        telepon: pegawai.telepon || null,
        pendidikan_terakhir: pegawai.pendidikan_terakhir || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to add pegawai");
    }
    await refreshPegawai();
  };

  const updatePegawai = async (id: string, updatedPegawai: Partial<Pegawai>, password?: string) => {
    const res = await fetch(`/api/pegawai/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: updatedPegawai.nama,
        nip: updatedPegawai.nip,
        foto_url: updatedPegawai.foto_url || null,
        email: updatedPegawai.email || null,
        telepon: updatedPegawai.telepon || null,
        pendidikan_terakhir: updatedPegawai.pendidikan_terakhir || null,
        password: password || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update pegawai");
    }
    await refreshPegawai();
  };

  const deletePegawai = async (id: string) => {
    const res = await fetch(`/api/pegawai/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete pegawai");
    }
    await refreshPegawai();
  };

  return (
    <DataContext.Provider value={{
      dosenList, pegawaiList, isLoading,
      isDosenLoaded, isPegawaiLoaded,
      addDosen, updateDosen, deleteDosen,
      addPegawai, updatePegawai, deletePegawai,
      ensureDosenLoaded, ensurePegawaiLoaded,
      refreshDosen, refreshPegawai,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
