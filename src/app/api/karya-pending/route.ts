import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/karya-pending — Admin: all pending; Dosen: own pending
export async function GET() {
  try {
    const result = await requireAuth();
    if (result instanceof NextResponse) return result;

    const user = result;
    const supabase = await createClient();

    let query = supabase
      .from("karya_pending")
      .select("*, dosen(id, nama)")
      .order("created_at", { ascending: false });

    // Dosen can only see their own
    if (user.role !== "admin") {
      query = query.eq("submitted_by", user.id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/karya-pending — Dosen: Submit new karya for approval
export async function POST(request: NextRequest) {
  try {
    const result = await requireAuth();
    if (result instanceof NextResponse) return result;

    const user = result;
    const body = await request.json();
    const { dosen_id, jenis, judul, tahun, deskripsi, metadata, foto_urls } = body;

    if (!dosen_id || !jenis || !judul || !tahun) {
      return NextResponse.json(
        { error: "dosen_id, jenis, judul, and tahun are required" },
        { status: 400 }
      );
    }

    // Dosen can only submit for themselves
    if (user.role !== "admin") {
      const supabase = await createClient();
      const { data: dosen } = await supabase
        .from("dosen")
        .select("nip")
        .eq("id", dosen_id)
        .single();

      if (!dosen || dosen.nip !== user.nip) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("karya_pending")
      .insert({
        dosen_id,
        submitted_by: user.id,
        jenis,
        judul,
        tahun,
        deskripsi: deskripsi || null,
        metadata: metadata || null,
        foto_urls: foto_urls || [],
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
