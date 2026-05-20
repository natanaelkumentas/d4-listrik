import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// POST /api/upload/karya — Authenticated: Upload image for karya to galeri bucket
export async function POST(request: NextRequest) {
  try {
    const result = await requireAuth();
    if (result instanceof NextResponse) return result;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const jenis = formData.get("jenis") as string | null;
    const karyaId = formData.get("karya_id") as string | null;
    const table = formData.get("table") as string | null; // "karya" or "karya_pending"

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const ext = file.name.split(".").pop();
    const label = jenis || "karya";
    const fileName = `galeri-${label}-${Date.now()}.${ext}`;

    // Convert File to Buffer for Node.js compatibility
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminSupabase.storage
      .from("galeri")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Upload gagal: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = adminSupabase.storage
      .from("galeri")
      .getPublicUrl(fileName);

    // If karya_id is provided, append the URL to the karya's foto_urls array
    if (karyaId) {
      const targetTable = table === "karya_pending" ? "karya_pending" : "karya";

      const { data: existing } = await adminSupabase
        .from(targetTable)
        .select("foto_urls")
        .eq("id", karyaId)
        .single();

      if (existing) {
        const updatedUrls = [...(existing.foto_urls || []), urlData.publicUrl];
        await adminSupabase
          .from(targetTable)
          .update({ foto_urls: updatedUrls })
          .eq("id", karyaId);
      }
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      message: "Image uploaded successfully",
    });
  } catch (err) {
    console.error("Upload karya image error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
