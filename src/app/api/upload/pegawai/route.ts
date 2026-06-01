import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// POST /api/upload/pegawai — Admin or Owner: Upload pegawai profile photo
export async function POST(request: NextRequest) {
  try {
    const result = await requireAuth();
    if (result instanceof NextResponse) return result;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const pegawaiId = formData.get("pegawai_id") as string | null;

    if (!file || !pegawaiId) {
      return NextResponse.json(
        { error: "file and pegawai_id are required" },
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

    // Owner check for pegawai role
    if (user.role !== "admin") {
      const adminSupabase = createAdminClient();
      const { data: pegawai } = await adminSupabase
        .from("pegawai")
        .select("nip")
        .eq("id", pegawaiId)
        .single();

      if (!pegawai || pegawai.nip !== user.nip) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    // Use admin client for storage upload (bypasses storage policies)
    const adminSupabase = createAdminClient();
    const ext = file.name.split(".").pop();
    const fileName = `pegawai-${pegawaiId}-${Date.now()}.${ext}`;

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

    // Update pegawai record with new photo URL
    const { data: updateResult, error: updateError } = await adminSupabase
      .from("pegawai")
      .update({ foto_url: urlData.publicUrl })
      .eq("id", pegawaiId)
      .select();

    if (updateError) {
      console.error("Pegawai photo update error:", updateError);
      return NextResponse.json(
        { error: `Gagal update foto: ${updateError.message}` },
        { status: 500 }
      );
    }

    if (!updateResult || updateResult.length === 0) {
      return NextResponse.json(
        { error: `Pegawai dengan id ${pegawaiId} tidak ditemukan di database` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      message: "Photo uploaded successfully",
    });
  } catch (err) {
    console.error("Upload pegawai photo error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
