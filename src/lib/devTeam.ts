export interface DevMember {
  nama: string;
  nim: string;
  role: string;
  initials: string;
  bg: string;
  gradient: string;
  link: string;
  foto_url?: string | null;
}

export interface LecturerInfo {
  nama: string;
  role: string;
  initials: string;
  link: string;
  foto_url?: string | null;
}

// UPDATE TEAM MEMBERS INFO HERE
export const devTeam: DevMember[] = [
  {
    nama: "Nama Anggota 1",
    nim: "22021001",
    role: "Lead & Fullstack Developer",
    initials: "A1",
    bg: "bg-slate-100/80 text-primary-800 border-slate-200/60",
    gradient: "from-primary-500 to-primary-700",
    link: "https://github.com/",
    foto_url: null,
  },
  {
    nama: "Nama Anggota 2",
    nim: "22021002",
    role: "UI/UX, Frontend & Tester",
    initials: "A2",
    bg: "bg-slate-100/80 text-amber-800 border-slate-200/60",
    gradient: "from-accent-500 to-accent-600",
    link: "https://github.com/",
    foto_url: null,
  },
  {
    nama: "Nama Anggota 3",
    nim: "22021003",
    role: "Tester & Data Collector",
    initials: "A3",
    bg: "bg-slate-100/80 text-indigo-800 border-slate-200/60",
    gradient: "from-indigo-500 to-indigo-700",
    link: "https://github.com/",
    foto_url: null,
  },
];

// UPDATE LECTURER INFO HERE
export const lecturerInfo: LecturerInfo = {
  nama: "Maksy Sendiang, SST, MIT",
  role: "Dosen Pengampu Teknologi Web",
  initials: "MS",
  link: "/staf/8d96ffe3-fc16-431a-b046-deed3378ff98",
  foto_url: null,
};
