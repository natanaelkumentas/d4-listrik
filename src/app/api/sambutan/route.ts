import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const [kajurRes, kaprodiRes] = await Promise.all([
      supabase
        .from("sambutan_kajur")
        .select("id, kutipan, dosen_id, dosen:dosen_id(id, nama, foto_url)")
        .eq("id", 1)
        .single(),
      supabase
        .from("sambutan_kaprodi")
        .select("id, kutipan, dosen_id, dosen:dosen_id(id, nama, foto_url)")
        .eq("id", 1)
        .single()
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

    const supabase = await createClient();
    const { error } = await supabase
      .from(section)
      .upsert({ id: 1, ...data });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
