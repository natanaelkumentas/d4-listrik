import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("prodi_info")
      .select("hero_bg_url")
      .eq("id", 1)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ hero_bg_url: data?.hero_bg_url || null });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await requireRole(["admin", "pegawai"]);
    if (result instanceof NextResponse) return result;

    const data = await request.json();
    const supabase = await createClient();

    // Fetch current to check if hero_bg_url changed/removed
    const { data: current } = await supabase
      .from("prodi_info")
      .select("hero_bg_url")
      .eq("id", 1)
      .single();

    const { error } = await supabase
      .from("prodi_info")
      .update({ hero_bg_url: data.hero_bg_url || null })
      .eq("id", 1);

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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
