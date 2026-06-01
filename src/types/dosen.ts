export interface PersonLink {
  id?: string;
  nama: string;
}

export interface KaryaBase {
  id: string;
  judul: string;
  tahun: number;
  deskripsi?: string;
}

export interface Publikasi extends KaryaBase {
  jenis: 'publikasi';
  penulis: PersonLink[];
  jurnal: string;
  link?: string;
}

export interface Penelitian extends KaryaBase {
  jenis: 'penelitian';
  ketua: PersonLink;
  anggota: PersonLink[];
  sumberDana?: string;
}

export interface Pengabdian extends KaryaBase {
  jenis: 'pengabdian';
  ketua: PersonLink;
  anggota: PersonLink[];
  mitra?: string;
}

export interface BukuAjar extends KaryaBase {
  jenis: 'bukuAjar';
  penulis: PersonLink[];
  penerbit: string;
  isbn?: string;
}

export interface Hki extends KaryaBase {
  jenis: 'hki';
  jenisHki: string;
  nomorSertifikat?: string;
}

export interface Sertifikasi extends KaryaBase {
  jenis: 'sertifikasi';
  penyelenggara?: string;
  linkSertifikat?: string; // GDrive link
}

export type KaryaItem = Publikasi | Penelitian | Pengabdian | BukuAjar | Hki | Sertifikasi;

export interface Dosen {
  id: string;
  nama: string;
  nip: string;
  foto?: string | null;
  jabatan?: string;
  pangkat?: string;
  email?: string;
  telepon?: string;
  programStudi?: string;
  pendidikanTerakhir?: string;
  bidangKeahlian: string[];
  social_media?: Record<string, string>;
  visibility_settings?: Record<string, boolean>;
  karya: {
    publikasi: Publikasi[];
    penelitian: Penelitian[];
    pengabdian: Pengabdian[];
    bukuAjar: BukuAjar[];
    hki: Hki[];
    sertifikasi: Sertifikasi[];
  };
}

export type KaryaCategory = keyof Dosen["karya"];

export const karyaCategoryLabels: Record<KaryaCategory, string> = {
  publikasi: "Publikasi",
  penelitian: "Penelitian",
  pengabdian: "Pengabdian",
  bukuAjar: "Buku Ajar",
  hki: "HKI",
  sertifikasi: "Sertifikasi",
};

export function getTotalKarya(dosen: Dosen): number {
  const k = dosen.karya;
  return (
    k.publikasi.length +
    k.penelitian.length +
    k.pengabdian.length +
    k.bukuAjar.length +
    k.hki.length +
    k.sertifikasi.length
  );
}
