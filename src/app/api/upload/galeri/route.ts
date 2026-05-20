import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// POST /api/upload/galeri — Admin only: Upload gallery image
export async function POST(request: NextRequest) {
  try {
    const result = await requireRole(["admin"]);
    if (result instanceof NextResponse) return result;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const galeriId = formData.get("galeri_id") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "file is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Use admin client for storage upload (bypasses storage policies)
    const adminSupabase = createAdminClient();
    const ext = file.name.split(".").pop();
    const prefix = galeriId || "gallery";
    const fileName = `${prefix}-${Date.now()}.${ext}`;

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

    // If galeri_id is provided, append the URL to the galeri's foto_urls array
    if (galeriId) {
      const { data: galeri } = await adminSupabase
        .from("galeri")
        .select("foto_urls")
        .eq("id", galeriId)
        .single();

      if (galeri) {
        const updatedUrls = [...(galeri.foto_urls || []), urlData.publicUrl];
        await adminSupabase
          .from("galeri")
          .update({ foto_urls: updatedUrls })
          .eq("id", galeriId);
      }
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      message: "Image uploaded successfully",
    });
  } catch (err) {
    console.error("Upload galeri error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
