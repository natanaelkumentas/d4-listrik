import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createLog, getClientIp } from "@/lib/logging";

export async function GET() {
  try {
    const supabase = await createClient();
    const [kajurRes, kaprodiRes] = await Promise.all([
      supabase
        .from("sambutan")
        .select("id, kutipan, dosen_id, dosen:dosen_id(id, nama, foto_url)")
        .eq("kategori", "kajur")
        .maybeSingle(),
      supabase
        .from("sambutan")
        .select("id, kutipan, dosen_id, dosen:dosen_id(id, nama, foto_url)")
        .eq("kategori", "kaprodi")
        .maybeSingle()
    ]);

    return NextResponse.json({
      sambutan_kajur: kajurRes.data || null,
      sambutan_kaprodi: kaprodiRes.data || null
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await requireRole(["admin", "pegawai"]);
    if (result instanceof NextResponse) return result;

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json({ error: "section and data are required" }, { status: 400 });
    }

    if (section !== "sambutan_kajur" && section !== "sambutan_kaprodi") {
      return NextResponse.json({ error: `Invalid section: ${section}` }, { status: 400 });
    }

    const category = section === "sambutan_kajur" ? "kajur" : "kaprodi";
    const supabase = await createClient();

    // Fetch before data for audit trail
    const { data: beforeData } = await supabase
      .from("sambutan")
      .select("*")
      .eq("kategori", category)
      .maybeSingle();

    const { error } = await supabase
      .from("sambutan")
      .upsert({
        dosen_id: data.dosen_id,
        kutipan: data.kutipan,
        kategori: category,
      }, {
        onConflict: "kategori"
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Log the change
    await createLog({
      kategori: "config",
      aksi: beforeData ? "update" : "create",
      deskripsi: `Memperbarui sambutan ${category === "kajur" ? "Ketua Jurusan" : "Kaprodi"}`,
      data_sebelum: beforeData,
      data_sesudah: { dosen_id: data.dosen_id, kutipan: data.kutipan, kategori: category },
      ip_address: getClientIp(request)
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
