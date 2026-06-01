import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createLog, getClientIp } from "@/lib/logging";

// PUT /api/cpl-kategori/[id] — Admin & Pegawai: Update CPL Category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roleCheck = await requireRole(["admin", "pegawai"]);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const body = await request.json();
    const { nama } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama kategori is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch current state for logging
    const { data: current, error: fetchError } = await supabase
      .from("cpl_kategori")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("cpl_kategori")
      .update({ nama: nama.trim() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Cascade update to cpl table
    await supabase
      .from("cpl")
      .update({ kategori: nama.trim() })
      .eq("kategori", current.nama);

    await createLog({
      kategori: "cpl_kategori",
      aksi: "update",
      deskripsi: `Mengubah kategori CPL: ${current.nama} menjadi ${nama.trim()}`,
      data_sebelum: current,
      data_sesudah: data,
      ip_address: getClientIp(request),
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/cpl-kategori/[id] — Admin & Pegawai: Delete CPL Category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roleCheck = await requireRole(["admin", "pegawai"]);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const supabase = await createClient();

    // Fetch current state for logging
    const { data: current, error: fetchError } = await supabase
      .from("cpl_kategori")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const { error } = await supabase
      .from("cpl_kategori")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Cascade nullify to cpl table
    await supabase
      .from("cpl")
      .update({ kategori: null })
      .eq("kategori", current.nama);

    await createLog({
      kategori: "cpl_kategori",
      aksi: "delete",
      deskripsi: `Menghapus kategori CPL: ${current.nama}`,
      data_sebelum: current,
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
