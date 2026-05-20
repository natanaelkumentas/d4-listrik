import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// PUT /api/karya/[id] — Admin or Owner: Update karya item
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const result = await requireAuth();
    if (result instanceof NextResponse) return result;

    const { id } = await params;
    const user = result;
    const supabase = await createClient();

    // Fetch karya to check ownership
    const { data: karya } = await supabase
      .from("karya")
      .select("dosen_id")
      .eq("id", id)
      .single();

    if (!karya) {
      return NextResponse.json(
        { error: "Karya not found" },
        { status: 404 }
      );
    }

    // Owner check
    if (user.role !== "admin") {
      const { data: dosen } = await supabase
        .from("dosen")
        .select("nidn")
        .eq("id", karya.dosen_id)
        .single();

      if (!dosen || dosen.nidn !== user.nidn) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { jenis, judul, tahun, deskripsi, metadata, foto_urls } = body;

    const updateData: Record<string, unknown> = {};
    if (jenis !== undefined) updateData.jenis = jenis;
    if (judul !== undefined) updateData.judul = judul;
    if (tahun !== undefined) updateData.tahun = tahun;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (foto_urls !== undefined) updateData.foto_urls = foto_urls;

    const { data, error } = await supabase
      .from("karya")
      .update(updateData)
      .eq("id", id)
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

// DELETE /api/karya/[id] — Admin or Owner: Delete karya item
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const result = await requireAuth();
    if (result instanceof NextResponse) return result;

    const { id } = await params;
    const user = result;
    const supabase = await createClient();

    // Fetch karya to check ownership
    const { data: karya } = await supabase
      .from("karya")
      .select("dosen_id")
      .eq("id", id)
      .single();

    if (!karya) {
      return NextResponse.json(
        { error: "Karya not found" },
        { status: 404 }
      );
    }

    // Owner check
    if (user.role !== "admin") {
      const { data: dosen } = await supabase
        .from("dosen")
        .select("nidn")
        .eq("id", karya.dosen_id)
        .single();

      if (!dosen || dosen.nidn !== user.nidn) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    const { error } = await supabase
      .from("karya")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Karya deleted successfully" });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
