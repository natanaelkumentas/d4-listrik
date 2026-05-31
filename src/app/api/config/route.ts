import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/config?section=all|visi_misi_tujuan|prodi_info|footer|kontak|logo|sambutan_kajur|sambutan_kaprodi
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const section = request.nextUrl.searchParams.get("section") || "all";

    const result: Record<string, unknown> = {};

    const shouldFetch = (key: string) => section === "all" || section === key;

    if (shouldFetch("visi_misi_tujuan")) {
      const { data } = await supabase
        .from("visi_misi_tujuan")
        .select("id, kategori, konten, urutan")
        .order("urutan", { ascending: true });
      result.visi_misi_tujuan = data || [];
    }

    if (shouldFetch("prodi_info")) {
      const { data } = await supabase
        .from("prodi_info")
        .select("id, nama, nama_alternatif, nama_kampus, deskripsi, hero_bg_url")
        .eq("id", 1)
        .single();
      result.prodi_info = data || null;
    }

    if (shouldFetch("footer")) {
      const { data } = await supabase
        .from("footer")
        .select("id, deskripsi, copyright")
        .eq("id", 1)
        .single();
      result.footer = data || null;
    }

    if (shouldFetch("kontak")) {
      const { data } = await supabase
        .from("kontak")
        .select("id, nama, nilai, link, icon, urutan")
        .order("urutan", { ascending: true });
      result.kontak = data || [];
    }

    if (shouldFetch("logo")) {
      const { data } = await supabase
        .from("logo")
        .select("id, file_url, alt_text")
        .eq("id", 1)
        .single();
      result.logo = data || null;
    }

    if (shouldFetch("sambutan_kajur")) {
      const { data } = await supabase
        .from("sambutan_kajur")
        .select("id, kutipan, dosen_id, dosen:dosen_id(id, nama, foto_url)")
        .eq("id", 1)
        .single();
      result.sambutan_kajur = data || null;
    }

    if (shouldFetch("sambutan_kaprodi")) {
      const { data } = await supabase
        .from("sambutan_kaprodi")
        .select("id, kutipan, dosen_id, dosen:dosen_id(id, nama, foto_url)")
        .eq("id", 1)
        .single();
      result.sambutan_kaprodi = data || null;
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/config — Admin/Pegawai: Update a specific config section
export async function PUT(request: NextRequest) {
  try {
    const result = await requireRole(["admin", "pegawai"]);
    if (result instanceof NextResponse) return result;

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json({ error: "section and data are required" }, { status: 400 });
    }

    const supabase = await createClient();

    switch (section) {
      case "prodi_info": {
        // Fetch current to check if hero_bg_url changed/removed
        const { data: current } = await supabase
          .from("prodi_info")
          .select("hero_bg_url")
          .eq("id", 1)
          .single();

        const { error } = await supabase
          .from("prodi_info")
          .upsert({ id: 1, ...data });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        // If hero_bg_url was changed/removed, delete the old file from bucket
        if (current?.hero_bg_url && current.hero_bg_url !== data.hero_bg_url) {
          const parts = current.hero_bg_url.split("/storage/v1/object/public/heroBackground/");
          if (parts.length > 1) {
            const fileName = parts[1];
            const adminSupabase = createAdminClient();
            await adminSupabase.storage.from("heroBackground").remove([fileName]);
          }
        }
        break;
      }
      case "footer": {
        const { error } = await supabase
          .from("footer")
          .upsert({ id: 1, ...data });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        break;
      }
      case "logo": {
        // Fetch current to check if file_url changed/removed
        const { data: current } = await supabase
          .from("logo")
          .select("file_url")
          .eq("id", 1)
          .single();

        const { error } = await supabase
          .from("logo")
          .upsert({ id: 1, ...data });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        // If file_url was changed/removed, delete the old file from bucket
        if (current?.file_url && current.file_url !== data.file_url) {
          const parts = current.file_url.split("/storage/v1/object/public/galeri/");
          if (parts.length > 1) {
            const fileName = parts[1];
            const adminSupabase = createAdminClient();
            await adminSupabase.storage.from("galeri").remove([fileName]);
          }
        }
        break;
      }
      case "sambutan_kajur": {
        const { error } = await supabase
          .from("sambutan_kajur")
          .upsert({ id: 1, ...data });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        break;
      }
      case "sambutan_kaprodi": {
        const { error } = await supabase
          .from("sambutan_kaprodi")
          .upsert({ id: 1, ...data });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        break;
      }

      case "visi_misi_tujuan": {
        const { error } = await supabase
          .from("visi_misi_tujuan")
          .upsert(data);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        break;
      }
      case "kontak": {
        const { error } = await supabase
          .from("kontak")
          .upsert(data);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown section: ${section}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/config — Admin/Pegawai: Add items to list-type sections
export async function POST(request: NextRequest) {
  try {
    const result = await requireRole(["admin", "pegawai"]);
    if (result instanceof NextResponse) return result;

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json({ error: "section and data are required" }, { status: 400 });
    }

    const supabase = await createClient();

    switch (section) {
      case "visi_misi_tujuan": {
        const { data: row, error } = await supabase
          .from("visi_misi_tujuan")
          .insert(data)
          .select()
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json(row, { status: 201 });
      }

      case "kontak": {
        const { data: row, error } = await supabase
          .from("kontak")
          .insert(data)
          .select()
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json(row, { status: 201 });
      }
      default:
        return NextResponse.json({ error: `Cannot POST to section: ${section}` }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/config — Admin/Pegawai: Delete items from list-type sections
export async function DELETE(request: NextRequest) {
  try {
    const result = await requireRole(["admin", "pegawai"]);
    if (result instanceof NextResponse) return result;

    const section = request.nextUrl.searchParams.get("section");
    const id = request.nextUrl.searchParams.get("id");

    if (!section || !id) {
      return NextResponse.json({ error: "section and id query params are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const allowedTables = ["visi_misi_tujuan", "kontak"];

    if (!allowedTables.includes(section)) {
      return NextResponse.json({ error: `Cannot DELETE from section: ${section}` }, { status: 400 });
    }

    const { error } = await supabase.from(section).delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
