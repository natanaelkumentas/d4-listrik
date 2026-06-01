import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createLog, getClientIp } from "@/lib/logging";

// PUT /api/pegawai/[id] — Admin only (Updates directly)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await requireRole(["admin"]);
    if (result instanceof NextResponse) return result;

    const { id } = await params;
    const body = await request.json();
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminClient();

    const authUpdates: any = {};
    if (body.password) {
      if (body.password.length < 6) {
        return NextResponse.json({ error: "Password harus minimal 6 karakter." }, { status: 400 });
      }
      authUpdates.password = body.password;
    }

    if (body.email) {
      authUpdates.email = body.email;
      authUpdates.email_confirm = true;
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await adminClient.auth.admin.updateUserById(id, authUpdates);
      if (authError) {
        return NextResponse.json({ error: `Gagal memperbarui data auth: ${authError.message}` }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.nama !== undefined) updateData.nama = body.nama;
    if (body.nip !== undefined) updateData.nip = body.nip;
    if (body.foto_url !== undefined) updateData.foto_url = body.foto_url;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.telepon !== undefined) updateData.telepon = body.telepon;
    if (body.program_studi !== undefined) updateData.program_studi = body.program_studi;
    if (body.pendidikan_terakhir !== undefined) updateData.pendidikan_terakhir = body.pendidikan_terakhir;

    // Fetch before data for logs
    const { data: currentPegawai } = await adminClient
      .from("pegawai")
      .select("*")
      .eq("id", id)
      .single();

    const { data, error } = await adminClient
      .from("pegawai")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (currentPegawai?.foto_url && currentPegawai.foto_url !== data.foto_url) {
      const parts = currentPegawai.foto_url.split("/storage/v1/object/public/pegawai/");
      if (parts.length > 1) {
        const fileName = parts[1];
        await adminClient.storage.from("pegawai").remove([fileName]);
      }
    }

    // Log update
    await createLog({
      kategori: "pegawai",
      aksi: "update",
      deskripsi: `Memperbarui pegawai: ${data.nama}`,
      data_sebelum: currentPegawai,
      data_sesudah: data,
      ip_address: getClientIp(request)
    });

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("PUT /api/pegawai/[id] failed:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/pegawai/[id] — Admin only
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await requireRole(["admin"]);
    if (result instanceof NextResponse) return result;

    const { id } = await params;
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminClient();

    // Fetch full detail before deleting record
    const { data: pegawai } = await adminClient
      .from("pegawai")
      .select("*")
      .eq("id", id)
      .single();

    // 1. Delete pegawai record
    const { error } = await adminClient.from("pegawai").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Clean up photo from storage
    if (pegawai?.foto_url) {
      const parts = pegawai.foto_url.split("/storage/v1/object/public/pegawai/");
      if (parts.length > 1) {
        const fileName = parts[1];
        await adminClient.storage.from("pegawai").remove([fileName]);
      }
    }

    // 2. Delete profile record
    await adminClient.from("profiles").delete().eq("id", id);

    // 3. Delete auth user
    await adminClient.auth.admin.deleteUser(id);

    // Log deletion
    await createLog({
      kategori: "pegawai",
      aksi: "delete",
      deskripsi: `Menghapus pegawai: ${pegawai?.nama || id}`,
      data_sebelum: pegawai,
      ip_address: getClientIp(_request)
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
