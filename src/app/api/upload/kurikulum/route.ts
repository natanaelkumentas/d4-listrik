import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// POST /api/upload/kurikulum — Admin only: Upload PDF to kurikulum bucket
export async function POST(request: NextRequest) {
  try {
    const result = await requireRole(["admin"]);
    if (result instanceof NextResponse) return result;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "file is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Use admin client for storage upload (bypasses storage policies)
    const adminSupabase = createAdminClient();
    const fileName = `kurikulum-${Date.now()}.pdf`;

    // Convert File to Buffer for Node.js compatibility
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminSupabase.storage
      .from("kurikulum")
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
      .from("kurikulum")
      .getPublicUrl(fileName);

    // Update kurikulum_aktif with the new file URL
    await adminSupabase
      .from("kurikulum_aktif")
      .update({ file_url: urlData.publicUrl })
      .eq("id", 1);

    return NextResponse.json({
      url: urlData.publicUrl,
      message: "PDF uploaded successfully",
    });
  } catch (err) {
    console.error("Upload kurikulum error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
