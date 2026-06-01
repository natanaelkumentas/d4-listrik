import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/karya — Public: List karya (filter by ?dosen_id=)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dosenId = searchParams.get("dosen_id");

    const supabase = await createClient();

    let query = supabase
      .from("karya")
      .select("*, dosen(id, nama)")
      .order("updated_at", { ascending: false });

    if (dosenId) {
      query = query.eq("dosen_id", dosenId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/karya — Admin or Owner: Create new karya item
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

    // Owner check: dosen can only add karya to their own profile
    if (user.role !== "admin") {
      const supabase = await createClient();
      const { data: dosen } = await supabase
        .from("dosen")
        .select("nip")
        .eq("id", dosen_id)
        .single();

      if (!dosen || dosen.nip !== user.nip) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("karya")
      .insert({
        dosen_id,
        jenis,
        judul,
        tahun,
        deskripsi: deskripsi || null,
        metadata: metadata || null,
        foto_urls: foto_urls || [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
