export interface GaleriItem {
  id: string;
  judul: string;
  deskripsi: string;
  tanggal: string; // YYYY-MM-DD
  kategori: "fasilitas" | "tridharma";
  foto: string[]; // URL dari Supabase Storage atau path lokal
  warna: string; // gradient color for placeholder/fallback
  subLabel?: string; // e.g. "Publikasi", "Penelitian" — for karya items in galeri
}

export const galeriData: GaleriItem[] = [
  {
    id: "lab-tegangan-tinggi",
    judul: "Laboratorium Tegangan Tinggi",
    deskripsi: "Fasilitas pengujian tegangan tinggi dengan peralatan standar industri yang memungkinkan mahasiswa melakukan praktikum pengujian isolator, breakdown voltage, dan analisis korona. Laboratorium ini dilengkapi dengan sistem safety yang canggih untuk menjamin keselamatan praktikan.",
    tanggal: "2024-03-15",
    kategori: "fasilitas",
    foto: ["/images/default.svg", "/images/default.svg"],
    warna: "from-blue-500 to-indigo-600",
  },
  {
    id: "lab-instalasi-listrik",
    judul: "Laboratorium Instalasi Listrik",
    deskripsi: "Ruang praktikum instalasi listrik industri dan rumah tangga. Mahasiswa dilatih untuk merancang, merakit, dan menguji berbagai panel distribusi dan panel kendali motor sesuai dengan standar PUIL terkini.",
    tanggal: "2024-02-10",
    kategori: "fasilitas",
    foto: ["/images/default.svg"],
    warna: "from-cyan-500 to-blue-600",
  },
  {
    id: "lab-plc-scada",
    judul: "Laboratorium PLC & SCADA",
    deskripsi: "Dilengkapi dengan berbagai merk PLC terkemuka seperti Siemens, Allen-Bradley, dan Omron. Laboratorium ini memfasilitasi pembelajaran otomasi industri tingkat lanjut dengan integrasi sistem SCADA untuk monitoring jarak jauh.",
    tanggal: "2023-11-20",
    kategori: "fasilitas",
    foto: ["/images/default.svg", "/images/default.svg", "/images/default.svg"],
    warna: "from-violet-500 to-purple-600",
  },
  {
    id: "lab-mesin-listrik",
    judul: "Laboratorium Mesin Listrik",
    deskripsi: "Fasilitas pengujian karakteristik motor listrik DC/AC dan generator. Terdapat berbagai modul dynamometer dan alat ukur kepresisian tinggi untuk analisis performa mesin-mesin listrik.",
    tanggal: "2023-09-05",
    kategori: "fasilitas",
    foto: ["/images/default.svg"],
    warna: "from-emerald-500 to-teal-600",
  },
  {
    id: "workshop-energi-terbarukan",
    judul: "Workshop Energi Terbarukan",
    deskripsi: "Kegiatan pelatihan dan instalasi panel surya (PLTS) on-grid maupun off-grid untuk masyarakat pedesaan. Program ini bertujuan untuk memberikan solusi energi alternatif yang ramah lingkungan.",
    tanggal: "2024-04-02",
    kategori: "tridharma",
    foto: ["/images/default.svg", "/images/default.svg"],
    warna: "from-amber-500 to-orange-600",
  },
  {
    id: "seminar-nasional-kelistrikan",
    judul: "Seminar Nasional Kelistrikan",
    deskripsi: "Seminar tahunan yang menghadirkan pakar kelistrikan tingkat nasional dan internasional, membahas tentang inovasi terbaru di bidang smart grid, transisi energi, dan otomasi industri.",
    tanggal: "2023-12-12",
    kategori: "tridharma",
    foto: ["/images/default.svg", "/images/default.svg"],
    warna: "from-rose-500 to-pink-600",
  },
  {
    id: "pengabdian-instalasi-desa",
    judul: "Pengabdian Instalasi Listrik Desa",
    deskripsi: "Program rutin himpunan mahasiswa dan dosen berupa perbaikan dan pemasangan instalasi listrik gratis bagi rumah-rumah ibadah dan fasilitas umum di desa mitra.",
    tanggal: "2023-08-25",
    kategori: "tridharma",
    foto: ["/images/default.svg"],
    warna: "from-lime-500 to-green-600",
  },
  {
    id: "riset-smart-grid",
    judul: "Riset Kolaboratif Smart Grid",
    deskripsi: "Penelitian bersama PLN dan universitas mitra dalam pengembangan purwarupa Smart Grid skala mikro (Microgrid) yang mengintegrasikan sumber energi terbarukan dengan jaringan PLN.",
    tanggal: "2024-01-18",
    kategori: "tridharma",
    foto: ["/images/default.svg", "/images/default.svg"],
    warna: "from-sky-500 to-blue-600",
  },
];
