import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/kurikulum — Public: Get kurikulum_aktif, mata_kuliah, cpl
export async function GET() {
  try {
    const supabase = await createClient();

    const [kurikulumRes, mataKuliahRes, cplRes] = await Promise.all([
      supabase.from("kurikulum_aktif").select("id, nama, deskripsi, berlaku_sejak, file_url").eq("id", 1).single(),
      supabase.from("mata_kuliah").select("kode, nama, sks, jenis, semester, deskripsi").order("updated_at", { ascending: false }),
      supabase.from("cpl").select("kode, deskripsi, kategori").order("updated_at", { ascending: false }),
    ]);

    if (kurikulumRes.error) {
      return NextResponse.json(
        { error: kurikulumRes.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      kurikulum: kurikulumRes.data,
      mata_kuliah: mataKuliahRes.data || [],
      cpl: cplRes.data || [],
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/kurikulum — Admin & Pegawai: Update kurikulum_aktif info
export async function PUT(request: NextRequest) {
  try {
    const result = await requireRole(["admin", "pegawai"]);
    if (result instanceof NextResponse) return result;

    const body = await request.json();
    const { nama, deskripsi, berlaku_sejak, file_url } = body;

    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (nama !== undefined) updateData.nama = nama;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (berlaku_sejak !== undefined) updateData.berlaku_sejak = berlaku_sejak;
    if (file_url !== undefined) updateData.file_url = file_url;

    const { data: currentKurikulum } = await supabase
      .from("kurikulum_aktif")
      .select("file_url")
      .eq("id", 1)
      .single();

    const { data, error } = await supabase
      .from("kurikulum_aktif")
      .update(updateData)
      .eq("id", 1)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (currentKurikulum?.file_url && currentKurikulum.file_url !== data.file_url) {
      const parts = currentKurikulum.file_url.split("/storage/v1/object/public/kurikulum/");
      if (parts.length > 1) {
        const fileName = parts[1];
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const adminSupabase = createAdminClient();
        await adminSupabase.storage.from("kurikulum").remove([fileName]);
      }
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
