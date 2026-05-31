import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("logo")
      .select("id, file_url, alt_text")
      .eq("id", 1)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data || null);
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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
