import Link from "next/link";
import { HiBriefcase, HiTag, HiDocumentText, HiAcademicCap, HiEnvelope, HiPhone } from "react-icons/hi2";

const avatarColors = [
  "from-primary-600 to-primary-800",
];

interface StafCardProps {
  person: {
    id: string;
    nama: string;
    nip?: string;
    foto?: string | null;
    foto_url?: string | null;
    jabatan?: string;
    pangkat?: string;
    email?: string | null;
    telepon?: string | null;
    pendidikan_terakhir?: string | null;
    pendidikanTerakhir?: string | null;
    bidangKeahlian?: string[];
    karya?: any;
  };
  type: "dosen" | "pegawai";
  index: number;
}

export default function DosenCard({ person, type, index }: StafCardProps) {
  const color = avatarColors[index % avatarColors.length];
  const photo = type === "dosen" ? person.foto : person.foto_url;
  const identifierLabel = "NIP";
  const identifierValue = person.nip;

  const totalKarya = type === "dosen" && person.karya
    ? (person.karya.publikasi?.length || 0) +
      (person.karya.penelitian?.length || 0) +
      (person.karya.pengabdian?.length || 0) +
      (person.karya.bukuAjar?.length || 0) +
      (person.karya.hki?.length || 0) +
      (person.karya.sertifikasi?.length || 0)
    : 0;

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden animate-fade-in-up flex flex-col h-full"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Top gradient bar */}
      <div className={`h-2 bg-gradient-to-r ${color}`} />

      <div className="p-6 flex flex-col flex-1">
        {/* Avatar */}
        <div className="flex items-start gap-4 mb-4">
          <img
            src={photo || "/images/default-profile.svg"}
            alt={person.nama}
            className="flex-shrink-0 w-16 h-16 rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
          />
          <div className="min-w-0">
            <h3 className="font-bold text-primary-950 text-base leading-snug truncate" title={person.nama}>
              {person.nama}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{identifierLabel}: {identifierValue}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-6 flex-1">
          {type === "dosen" ? (
            <>
              {person.jabatan && (
                <div className="flex items-center gap-2 text-sm">
                  <HiBriefcase className="text-gray-400 text-xs flex-shrink-0" />
                  <span className="text-gray-600 truncate">{person.jabatan}</span>
                </div>
              )}
              {person.pangkat && (
                <div className="flex items-center gap-2 text-sm">
                  <HiTag className="text-gray-400 text-xs flex-shrink-0" />
                  <span className="text-gray-600 truncate">{person.pangkat}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <HiDocumentText className="text-gray-400 text-xs flex-shrink-0" />
                <span className="text-gray-600">
                  <span className="font-semibold text-primary-700">{totalKarya}</span> Karya
                </span>
              </div>
            </>
          ) : (
            <>
              {(person.pendidikan_terakhir || person.pendidikanTerakhir) && (
                <div className="flex items-center gap-2 text-sm">
                  <HiAcademicCap className="text-gray-400 text-xs flex-shrink-0" />
                  <span className="text-gray-600 truncate">
                    Pendidikan: {person.pendidikan_terakhir || person.pendidikanTerakhir}
                  </span>
                </div>
              )}
              {person.email && (
                <div className="flex items-center gap-2 text-sm">
                  <HiEnvelope className="text-gray-400 text-xs flex-shrink-0" />
                  <span className="text-gray-600 truncate" title={person.email}>{person.email}</span>
                </div>
              )}
              {person.telepon && (
                <div className="flex items-center gap-2 text-sm">
                  <HiPhone className="text-gray-400 text-xs flex-shrink-0" />
                  <span className="text-gray-600 truncate">{person.telepon}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* CTA (Only Dosen has a detailed profile page) */}
        {type === "dosen" ? (
          <Link
            href={`/staf/${person.id}`}
            className="inline-flex items-center w-full justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-50 text-primary-700 font-semibold text-sm hover:bg-primary-600 hover:text-white transition-all duration-200 group/btn"
          >
            Lihat Profil
            <svg
              className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        ) : (
          <div className="w-full text-center px-4 py-2.5 rounded-xl bg-gray-50 text-gray-500 font-medium text-xs">
            Staf Administrasi
          </div>
        )}
      </div>
    </div>
  );
}
