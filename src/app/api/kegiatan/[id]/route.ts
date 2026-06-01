import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createLog, getClientIp } from "@/lib/logging";

type Params = { params: Promise<{ id: string }> };

// GET /api/kegiatan/[id] — Public: Get single kegiatan
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("kegiatan")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/kegiatan/[id] — Admin, Pegawai, Dosen: Update approved kegiatan
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const result = await requireRole(["admin", "pegawai", "dosen"]);
    if (result instanceof NextResponse) return result;

    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Fetch current to check for removed photos and for logging
    const { data: currentKegiatan } = await supabase
      .from("kegiatan")
      .select("*")
      .eq("id", id)
      .single();

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (body.nama !== undefined) updateData.nama = body.nama;
    if (body.tanggal !== undefined) updateData.tanggal = body.tanggal;
    if (body.kategori !== undefined) updateData.kategori = body.kategori;
    if (body.deskripsi !== undefined) updateData.deskripsi = body.deskripsi;
    if (body.foto_urls !== undefined) updateData.foto_urls = body.foto_urls;
    if (body.lokasi !== undefined) updateData.lokasi = body.lokasi;

    const { data, error } = await supabase
      .from("kegiatan")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Storage cleanup for removed images
    if (currentKegiatan?.foto_urls && Array.isArray(currentKegiatan.foto_urls)) {
      const newUrls = new Set(data?.foto_urls || []);
      const removedUrls = currentKegiatan.foto_urls.filter((url: string) => !newUrls.has(url));

      if (removedUrls.length > 0) {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const adminSupabase = createAdminClient();
        const fileNames = removedUrls.map((url: string) => {
          const parts = url.split("/storage/v1/object/public/galeri/");
          return parts.length > 1 ? parts[1] : null;
        }).filter(Boolean) as string[];

        if (fileNames.length > 0) {
          await adminSupabase.storage.from("galeri").remove(fileNames);
        }
      }
    }

    // Log the update
    await createLog({
      kategori: "kegiatan",
      aksi: "update",
      deskripsi: `Memperbarui kegiatan: ${data.nama}`,
      data_sebelum: currentKegiatan,
      data_sesudah: data,
      ip_address: getClientIp(request)
    });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/kegiatan/[id] — Admin, Pegawai, Dosen: Delete approved kegiatan
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const result = await requireRole(["admin", "pegawai", "dosen"]);
    if (result instanceof NextResponse) return result;

    const { id } = await params;
    const supabase = await createClient();

    // Fetch before delete for details
    const { data: kegiatan } = await supabase
      .from("kegiatan")
      .select("*")
      .eq("id", id)
      .single();

    if (!kegiatan) {
      return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 });
    }

    const { error } = await supabase
      .from("kegiatan")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Delete all attached photos from storage
    if (kegiatan?.foto_urls && Array.isArray(kegiatan.foto_urls) && kegiatan.foto_urls.length > 0) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const adminSupabase = createAdminClient();
      const fileNames = kegiatan.foto_urls.map((url: string) => {
        const parts = url.split("/storage/v1/object/public/galeri/");
        return parts.length > 1 ? parts[1] : null;
      }).filter(Boolean) as string[];

      if (fileNames.length > 0) {
        await adminSupabase.storage.from("galeri").remove(fileNames);
      }
    }

    // Log the deletion
    await createLog({
      kategori: "kegiatan",
      aksi: "delete",
      deskripsi: `Menghapus kegiatan: ${kegiatan.nama}`,
      data_sebelum: kegiatan,
      ip_address: getClientIp(_request)
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
