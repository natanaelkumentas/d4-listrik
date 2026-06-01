import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getInitials(name: string): string {
  if (!name) return "DP";
  const cleanName = name.replace(/,.*$/, "").trim();
  const parts = cleanName.split(" ").filter(Boolean);
  if (parts.length === 0) return "DP";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Fetch developers
    const { data: developers, error: devError } = await supabase
      .from("developers")
      .select("*")
      .order("urutan", { ascending: true });

    if (devError) {
      console.error("Supabase error fetching developers:", devError);
      return NextResponse.json({ error: devError.message }, { status: 400 });
    }

    // 2. Fetch lecturer from dosen table by ID
    const { data: lecturerDosen, error: dosenError } = await supabase
      .from("dosen")
      .select("id, nama, foto_url")
      .eq("id", "8d96ffe3-fc16-431a-b046-deed3378ff98")
      .maybeSingle();

    let lecturer = null;
    if (lecturerDosen) {
      lecturer = {
        nama: lecturerDosen.nama,
        role: "Dosen Pengampu Teknologi Web",
        initials: getInitials(lecturerDosen.nama),
        link: `/staf/${lecturerDosen.id}`,
        foto_url: lecturerDosen.foto_url
      };
    }

    return NextResponse.json({
      developers: developers || [],
      lecturer
    });
  } catch (err: any) {
    console.error("Internal error fetching developers:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
