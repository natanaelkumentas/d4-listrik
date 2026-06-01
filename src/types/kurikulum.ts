export interface MataKuliah {
  kode: string;
  nama: string;
  sks: number;
  jenis: "Teori" | "Praktik" | "Teori & Praktik";
}

export interface Semester {
  semester: number;
  mataKuliah: MataKuliah[];
}

export interface CPLItem {
  kode: string;
  deskripsi: string;
  kategori?: string | null;
}

export interface KurikulumAktif {
  nama: string;
  deskripsi: string;
  berlakuSejak: string;
  fileUrl: string | null; // URL dari Supabase Storage (null jika belum diupload)
}
