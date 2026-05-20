import { GaleriItem } from "@/data/galeri";
import Link from "next/link";
import { HiOutlineCalendar } from "react-icons/hi2";

export default function GaleriCard({
  item,
  index,
}: {
  item: GaleriItem;
  index: number;
}) {
  const dateObj = new Date(item.tanggal);
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(dateObj);

  return (
    <Link
      href={`/galeri/${item.id}`}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up block"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Image */}
      <div className="h-48 relative overflow-hidden bg-gray-100">
        <img
          src={(item.foto && item.foto[0]) ? item.foto[0] : "/images/default.svg"}
          alt={item.judul}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Category badge */}
        <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/90 text-xs font-semibold text-gray-700 backdrop-blur-sm shadow-sm">
          {item.kategori === "fasilitas" ? "Fasilitas" : item.subLabel ? `Tridharma · ${item.subLabel}` : "Tridharma"}
        </span>

        {/* Date badge on image */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white/90 font-medium">
          <HiOutlineCalendar className="w-4 h-4" />
          {formattedDate}
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-bold text-primary-950 text-base group-hover:text-primary-600 transition-colors">
          {item.judul}
        </h3>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-3">{item.deskripsi}</p>
      </div>
    </Link>
  );
}
