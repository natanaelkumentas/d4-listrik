import Link from "next/link";
import { HiMapPin, HiPhone, HiEnvelope } from "react-icons/hi2";

const quickLinks = [
  { href: "/", label: "Beranda" },
  { href: "/tentang", label: "Tentang" },
  { href: "/dosen", label: "Dosen" },
  { href: "/kurikulum", label: "Kurikulum" },
  { href: "/galeri", label: "Galeri" },
];

export default function Footer() {
  return (
    <footer className="bg-primary-950 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-0.5 shadow-lg overflow-hidden">
                <img
                  src="/images/logo-polimdo.png"
                  alt="Logo Polimdo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">D4 Teknik Listrik</h3>
                <p className="text-primary-300 text-xs">Politeknik Negeri Manado</p>
              </div>
            </div>
            <p className="text-primary-300 text-sm leading-relaxed">
              Mencetak lulusan yang kompeten dan profesional di bidang teknik ketenagalistrikan
              untuk mendukung pembangunan nasional.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-accent-400 mb-4 text-sm uppercase tracking-wider">
              Tautan Cepat
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-primary-300 hover:text-white text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-accent-400 mb-4 text-sm uppercase tracking-wider">
              Kontak
            </h4>
            <div className="space-y-3 text-sm text-primary-300">
              <p className="flex items-start gap-2">
                <HiMapPin className="mt-0.5 flex-shrink-0" />
                <span>
                  Jl. Politeknik, Buha,
                  <br />
                  Kec. Mapanget, Kota Manado,
                  <br />
                  Sulawesi Utara 95252
                </span>
              </p>
              <p className="flex items-center gap-2">
                <HiPhone className="flex-shrink-0" />
                <span>(0431) 812635</span>
              </p>
              <p className="flex items-center gap-2">
                <HiEnvelope className="flex-shrink-0" />
                <span>teknik.listrik@polimdo.ac.id</span>
              </p>
            </div>
          </div>
        </div>

        {/* Divider + Copyright */}
        <div className="mt-10 pt-6 border-t border-primary-800">
          <p className="text-center text-primary-400 text-xs">
            © {new Date().getFullYear()} Program Studi D4 Teknik Listrik — Politeknik Negeri Manado. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
