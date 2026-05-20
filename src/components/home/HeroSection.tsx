import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center bg-primary-950 overflow-hidden">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-bg.jpg"
          alt="Gedung Politeknik Negeri Manado"
          className="w-full h-full object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-950/90 to-primary-900/80" />
      </div>

      {/* Decorative blurs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-accent-400/10 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-primary-400/5 blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-primary-200 text-xs font-medium mb-6 animate-fade-in-up">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Terakreditasi Unggul
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight animate-fade-in-up delay-100">
            Program Studi
            <br />
            <span className="bg-gradient-to-r from-accent-400 to-accent-500 bg-clip-text text-transparent">
              D4 Teknik Listrik
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-primary-200 leading-relaxed max-w-2xl animate-fade-in-up delay-200">
            Mencetak tenaga ahli profesional di bidang teknik ketenagalistrikan yang kompeten,
            inovatif, dan siap bersaing di era industri modern.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap gap-4 animate-fade-in-up delay-300">
            <Link
              href="/tentang"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-accent-500 text-primary-950 font-semibold text-sm hover:bg-accent-400 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Pelajari Lebih Lanjut
              <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/kurikulum"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm border border-white/20 hover:bg-white/20 transition-all duration-200"
            >
              Lihat Kurikulum
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
