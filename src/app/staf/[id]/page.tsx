import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DosenDetailClient from "./DosenDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  // Dynamic pages — no static params for DB-driven content
  return [];
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: dosen } = await supabase
    .from("dosen")
    .select("nama")
    .eq("id", id)
    .single();

  if (!dosen) return { title: "Staf Tidak Ditemukan — D4 Teknik Listrik" };
  return {
    title: `${dosen.nama} — D4 Teknik Listrik`,
    description: `Profil staf ${dosen.nama} — Program Studi D4 Teknik Listrik Politeknik Negeri Manado.`,
  };
}

export default async function StafDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: dosen } = await supabase
    .from("dosen")
    .select("id")
    .eq("id", id)
    .single();

  if (!dosen) notFound();

  return (
    <>
      {/* Compact hero */}
      <section className="bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 pt-24 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" />
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <DosenDetailClient id={id} />
        </div>
      </section>
    </>
  );
}
