import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createLog, getClientIp } from "@/lib/logging";

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
      .select("*")
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
        .select("nip")
        .eq("id", karya.dosen_id)
        .single();

      if (!dosen || dosen.nip !== user.nip) {
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

    // Compare and delete any removed files
    if (karya?.foto_urls && Array.isArray(karya.foto_urls)) {
      const newUrls = new Set(data?.foto_urls || []);
      const removedUrls = karya.foto_urls.filter((url: string) => !newUrls.has(url));

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

    // Log the change
    await createLog({
      kategori: "karya",
      aksi: "update",
      deskripsi: `Memperbarui karya: ${data.judul}`,
      data_sebelum: karya,
      data_sesudah: data,
      ip_address: getClientIp(request)
    });

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

    // Fetch karya to check ownership and get details
    const { data: karya } = await supabase
      .from("karya")
      .select("*")
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
        .select("nip")
        .eq("id", karya.dosen_id)
        .single();

      if (!dosen || dosen.nip !== user.nip) {
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

    // Delete all attached photos from storage
    if (karya?.foto_urls && Array.isArray(karya.foto_urls) && karya.foto_urls.length > 0) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const adminSupabase = createAdminClient();
      const fileNames = karya.foto_urls.map((url: string) => {
        const parts = url.split("/storage/v1/object/public/galeri/");
        return parts.length > 1 ? parts[1] : null;
      }).filter(Boolean) as string[];

      if (fileNames.length > 0) {
        await adminSupabase.storage.from("galeri").remove(fileNames);
      }
    }

    // Log the deletion
    await createLog({
      kategori: "karya",
      aksi: "delete",
      deskripsi: `Menghapus karya: ${karya.judul}`,
      data_sebelum: karya,
      ip_address: getClientIp(_request)
    });

    return NextResponse.json({ message: "Karya deleted successfully" });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
