import { useEffect, useState } from "react";
import { cachedFetch } from "@/lib/fetchCache";
import { Dosen, getTotalKarya } from "@/types/dosen";
import KaryaTabs from "./KaryaTabs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiBriefcase, HiTag, HiEnvelope, HiPhone, HiDocumentText, HiBookOpen } from "react-icons/hi2";
import { SiGooglescholar, SiResearchgate } from "react-icons/si";
import { FaLinkedin, FaInstagram, FaFacebook } from "react-icons/fa";
import ImageLightbox from "../universal/ImageLightbox";

const avatarColors = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-lime-500 to-green-600",
  "from-fuchsia-500 to-purple-600",
];

export default function DosenProfile({ dosen, index }: { dosen: Dosen; index: number }) {
  const router = useRouter();
  const color = avatarColors[index % avatarColors.length];
  const totalKarya = getTotalKarya(dosen);
  const [prodiName, setProdiName] = useState("D4 Teknik Listrik");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [backLabel, setBackLabel] = useState("Kembali ke Daftar Staf");

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

  useEffect(() => {
    if (typeof window !== "undefined" && document.referrer) {
      const referrer = document.referrer;
      if (referrer.includes("/dashboard")) {
        setBackLabel("Kembali ke Dashboard");
      } else if (referrer.includes("/galeri")) {
        setBackLabel("Kembali ke Galeri");
      } else if (referrer.includes("/fasilitas")) {
        setBackLabel("Kembali ke Fasilitas");
      }
    }
  }, []);

  const isHomebase = (dosen.programStudi || "").trim().toLowerCase() === prodiName.trim().toLowerCase();

  return (
    <div className="animate-fade-in-up">
      {/* Back button */}
      <button
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/staf");
          }
        }}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 font-medium mb-8 transition-colors cursor-pointer bg-transparent border-0"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {backLabel}
      </button>


      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-10">
        {/* Top gradient bar */}
        <div className={`h-3 bg-gradient-to-r ${color}`} />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <img
              src={dosen.foto || "/images/default-profile.svg"}
              alt={dosen.nama}
              onClick={() => {
                if (dosen.foto) {
                  setLightboxOpen(true);
                }
              }}
              className={`flex-shrink-0 w-24 h-24 rounded-2xl object-cover shadow-xl ${
                dosen.foto ? "cursor-zoom-in hover:scale-102 transition-transform duration-300" : ""
              }`}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-primary-950">{dosen.nama}</h1>
              <p className="text-sm text-gray-400 font-mono mt-1">NIP: {dosen.nip}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                {dosen.jabatan && (
                  <div className="flex items-center gap-2 text-sm">
                    <HiBriefcase className="text-gray-400 animate-pulse" />
                    <div>
                      <p className="text-xs text-gray-400">Jabatan</p>
                      <p className="font-medium text-gray-700">{dosen.jabatan}</p>
                    </div>
                  </div>
                )}
                {dosen.pangkat && (
                  <div className="flex items-center gap-2 text-sm">
                    <HiTag className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Pangkat</p>
                      <p className="font-medium text-gray-700">{dosen.pangkat}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <HiEnvelope className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="font-medium text-gray-700">
                      {dosen.email || (
                        <span className="text-gray-400 italic">Dirahasiakan / Tidak ada</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <HiPhone className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Telepon</p>
                    <p className="font-medium text-gray-700">
                      {dosen.telepon || (
                        <span className="text-gray-400 italic">Dirahasiakan / Tidak ada</span>
                      )}
                    </p>
                  </div>
                </div>
                {isHomebase && (
                  <div className="flex items-center gap-2 text-sm">
                    <HiDocumentText className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Total Karya</p>
                      <p className="font-semibold text-primary-700">{totalKarya}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Media Links */}
              {dosen.social_media && Object.values(dosen.social_media).some(Boolean) && (
                <div className="mt-5">
                  <p className="text-xs text-gray-400 mb-2">Media Sosial & Akademik</p>
                  <div className="flex flex-wrap gap-2">
                    {dosen.social_media.google_scholar && (
                      <a
                        href={dosen.social_media.google_scholar}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-blue-600 hover:bg-blue-50 transition-all hover:scale-105"
                        title="Google Scholar"
                      >
                        <SiGooglescholar className="w-5 h-5" />
                      </a>
                    )}
                    {dosen.social_media.research_gate && (
                      <a
                        href={dosen.social_media.research_gate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-emerald-600 hover:bg-emerald-50 transition-all hover:scale-105"
                        title="ResearchGate"
                      >
                        <SiResearchgate className="w-5 h-5" />
                      </a>
                    )}
                    {dosen.social_media.linkedin && (
                      <a
                        href={dosen.social_media.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-blue-700 hover:bg-blue-50 transition-all hover:scale-105"
                        title="LinkedIn"
                      >
                        <FaLinkedin className="w-5 h-5" />
                      </a>
                    )}
                    {dosen.social_media.instagram && (
                      <a
                        href={dosen.social_media.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-pink-600 hover:bg-pink-50 transition-all hover:scale-105"
                        title="Instagram"
                      >
                        <FaInstagram className="w-5 h-5" />
                      </a>
                    )}
                    {dosen.social_media.facebook && (
                      <a
                        href={dosen.social_media.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-blue-800 hover:bg-blue-50 transition-all hover:scale-105"
                        title="Facebook"
                      >
                        <FaFacebook className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Bidang Keahlian */}
              <div className="mt-5">
                <p className="text-xs text-gray-400 mb-2">Bidang Keahlian</p>
                <div className="flex flex-wrap gap-2">
                  {dosen.bidangKeahlian.map((bk) => (
                    <span
                      key={bk}
                      className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium"
                    >
                      {bk}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Karya Section */}
      {isHomebase && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-primary-950 mb-6 flex items-center gap-2">
            <HiBookOpen className="text-xl" /> Karya & Kontribusi
          </h2>
          <KaryaTabs dosen={dosen} />
        </div>
      )}

      {dosen.foto && (
        <ImageLightbox
          isOpen={lightboxOpen}
          images={[dosen.foto]}
          initialIndex={0}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
