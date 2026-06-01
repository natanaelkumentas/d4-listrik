import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// POST /api/upload/dosen — Admin or Owner: Upload dosen profile photo
export async function POST(request: NextRequest) {
  try {
    const result = await requireAuth();
    if (result instanceof NextResponse) return result;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const dosenId = formData.get("dosen_id") as string | null;

    if (!file || !dosenId) {
      return NextResponse.json(
        { error: "file and dosen_id are required" },
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

    const user = result;

    // Owner check for dosen role
    if (user.role !== "admin") {
      const adminSupabase = createAdminClient();
      const { data: dosen } = await adminSupabase
        .from("dosen")
        .select("nip")
        .eq("id", dosenId)
        .single();

      if (!dosen || dosen.nip !== user.nip) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    // Use admin client for storage upload (bypasses storage policies)
    const adminSupabase = createAdminClient();
    const ext = file.name.split(".").pop();
    const fileName = `${dosenId}-${Date.now()}.${ext}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminSupabase.storage
      .from("dosen")
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
      .from("dosen")
      .getPublicUrl(fileName);

    // Update dosen record with new photo URL
    console.log("Updating dosen foto_url - dosenId:", dosenId, "url:", urlData.publicUrl);
    
    const { data: updateResult, error: updateError } = await adminSupabase
      .from("dosen")
      .update({ foto_url: urlData.publicUrl })
      .eq("id", dosenId)
      .select();

    console.log("Update result:", updateResult, "Error:", updateError);

    if (updateError) {
      console.error("Dosen photo update error:", updateError);
      return NextResponse.json(
        { error: `Gagal update foto: ${updateError.message}` },
        { status: 500 }
      );
    }

    if (!updateResult || updateResult.length === 0) {
      console.error("No dosen row matched for id:", dosenId);
      return NextResponse.json(
        { error: `Dosen dengan id ${dosenId} tidak ditemukan di database` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      message: "Photo uploaded successfully",
    });
  } catch (err) {
    console.error("Upload dosen photo error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
