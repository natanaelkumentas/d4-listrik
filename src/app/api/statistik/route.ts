import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/statistik — Public: Get statistik_mahasiswa + dosen/galeri counts
export async function GET() {
  try {
    const supabase = await createClient();

    const [statResult, dosenResult, galeriResult] = await Promise.all([
      supabase.from("statistik_mahasiswa").select("*").eq("id", 1).single(),
      supabase.from("dosen").select("id", { count: "exact", head: true }),
      supabase.from("galeri").select("id", { count: "exact", head: true }),
    ]);

    if (statResult.error) {
      return NextResponse.json({ error: statResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ...statResult.data,
      total_dosen: dosenResult.count ?? 0,
      total_galeri: galeriResult.count ?? 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/statistik — Admin only: Update statistik_mahasiswa
export async function PUT(request: NextRequest) {
  try {
    const result = await requireRole(["admin"]);
    if (result instanceof NextResponse) return result;

    const body = await request.json();
    const { total_mahasiswa_aktif, total_lulusan } = body;

    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (total_mahasiswa_aktif !== undefined) updateData.total_mahasiswa_aktif = total_mahasiswa_aktif;
    if (total_lulusan !== undefined) updateData.total_lulusan = total_lulusan;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("statistik_mahasiswa")
      .update(updateData)
      .eq("id", 1)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
