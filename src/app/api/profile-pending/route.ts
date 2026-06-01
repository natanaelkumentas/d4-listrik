import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, requireRole, getUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createLog, getClientIp } from "@/lib/logging";

// GET /api/profile-pending — Admin get all pending, non-admin get own latest pending/rejected
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    if (user.role !== "admin") {
      const { data, error } = await adminSupabase
        .from("profile_pending")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data || null);
    }

    const { data: pendingList, error } = await adminSupabase
      .from("profile_pending")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = [];
    for (const item of (pendingList || [])) {
      let currentData = null;
      if (item.role === "dosen") {
        const { data } = await adminSupabase
          .from("dosen")
          .select("*")
          .eq("id", item.user_id)
          .maybeSingle();
        currentData = data;
      } else if (item.role === "pegawai") {
        const { data } = await adminSupabase
          .from("pegawai")
          .select("*")
          .eq("id", item.user_id)
          .maybeSingle();
        currentData = data;
      }
      
      result.push({
        ...item,
        current_profile: currentData
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// POST /api/profile-pending — Dosen/Pegawai: Submit profile changes for verification
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { data: proposedData } = body;

    if (!proposedData) {
      return NextResponse.json({ error: "data is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if there is an existing pending request
    const { data: existing } = await supabase
      .from("profile_pending")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    let resError;
    if (existing) {
      // Overwrite existing pending request
      const { error } = await supabase
        .from("profile_pending")
        .update({
          data: proposedData,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id);
      resError = error;
    } else {
      // Insert new request
      const { error } = await supabase
        .from("profile_pending")
        .insert({
          user_id: user.id,
          role: user.role,
          data: proposedData,
          status: "pending"
        });
      resError = error;
    }

    if (resError) {
      return NextResponse.json({ error: resError.message }, { status: 400 });
    }

    // Log the profile pending submission
    await createLog({
      kategori: "profile_verification",
      aksi: existing ? "update" : "create",
      deskripsi: `${user.full_name || user.email} mengajukan perubahan profil untuk verifikasi`,
      data_sesudah: proposedData,
      ip_address: getClientIp(request)
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// PUT /api/profile-pending — Admin only: Approve or Reject a profile update request
export async function PUT(request: NextRequest) {
  try {
    const check = await requireRole(["admin"]);
    if (check instanceof NextResponse) return check;

    const body = await request.json();
    const { id, action, rejected_reason } = body;

    if (!id || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "id and action (approve/reject) are required" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Fetch the pending request details
    const { data: requestRow, error: fetchErr } = await adminSupabase
      .from("profile_pending")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !requestRow) {
      return NextResponse.json({ error: "Pending request not found" }, { status: 404 });
    }

    if (requestRow.status !== "pending") {
      return NextResponse.json({ error: `Request is already ${requestRow.status}` }, { status: 400 });
    }

    if (action === "reject") {
      const { error: rejectErr } = await adminSupabase
        .from("profile_pending")
        .update({
          status: "rejected",
          rejected_reason: rejected_reason || "Ditolak oleh admin",
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (rejectErr) return NextResponse.json({ error: rejectErr.message }, { status: 400 });

      // Log the rejection
      await createLog({
        kategori: "profile_verification",
        aksi: "reject",
        deskripsi: `Menolak perubahan profil untuk user ID ${requestRow.user_id}. Alasan: ${rejected_reason || "—"}`,
        ip_address: getClientIp(request)
      });

      return NextResponse.json({ success: true, status: "rejected" });
    }

    // On Approval: Write changes back to the actual table
    const proposed = requestRow.data;
    const isDosen = requestRow.role === "dosen";

    if (isDosen) {
      // 1. Get before details
      const { data: currentDosen } = await adminSupabase
        .from("dosen")
        .select("*")
        .eq("id", requestRow.user_id)
        .single();

      // 2. Update profiles table full_name
      if (proposed.nama) {
        await adminSupabase
          .from("profiles")
          .update({ full_name: proposed.nama })
          .eq("id", requestRow.user_id);
      }

      // 3. Update dosen table
      const updateData: any = {};
      if (proposed.nama !== undefined) updateData.nama = proposed.nama;
      if (proposed.foto !== undefined) updateData.foto_url = proposed.foto; // transformed in front
      if (proposed.foto_url !== undefined) updateData.foto_url = proposed.foto_url;
      if (proposed.jabatan !== undefined) updateData.jabatan = proposed.jabatan;
      if (proposed.pangkat !== undefined) updateData.pangkat = proposed.pangkat;
      if (proposed.email !== undefined) updateData.email = proposed.email;
      if (proposed.telepon !== undefined) updateData.telepon = proposed.telepon;
      if (proposed.bidangKeahlian !== undefined) updateData.bidang_keahlian = proposed.bidangKeahlian;
      if (proposed.bidang_keahlian !== undefined) updateData.bidang_keahlian = proposed.bidang_keahlian;
      if (proposed.programStudi !== undefined) updateData.program_studi = proposed.programStudi;
      if (proposed.program_studi !== undefined) updateData.program_studi = proposed.program_studi;
      if (proposed.pendidikanTerakhir !== undefined) updateData.pendidikan_terakhir = proposed.pendidikanTerakhir;
      if (proposed.pendidikan_terakhir !== undefined) updateData.pendidikan_terakhir = proposed.pendidikan_terakhir;
      if (proposed.social_media !== undefined) updateData.social_media = proposed.social_media;
      if (proposed.visibility_settings !== undefined) updateData.visibility_settings = proposed.visibility_settings;

      const { data: updatedDosen, error: updateErr } = await adminSupabase
        .from("dosen")
        .update(updateData)
        .eq("id", requestRow.user_id)
        .select()
        .single();

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

      // Clean up storage if photo was changed
      if (currentDosen?.foto_url && currentDosen.foto_url !== updatedDosen.foto_url) {
        const parts = currentDosen.foto_url.split("/storage/v1/object/public/dosen/");
        if (parts.length > 1) {
          const fileName = parts[1];
          await adminSupabase.storage.from("dosen").remove([fileName]);
        }
      }

      // Log the update
      await createLog({
        kategori: "dosen",
        aksi: "update",
        deskripsi: `Admin menyetujui perubahan profil dosen: ${updatedDosen.nama}`,
        data_sebelum: currentDosen,
        data_sesudah: updatedDosen,
        ip_address: getClientIp(request)
      });

    } else {
      // isPegawai
      // 1. Get before details
      const { data: currentPegawai } = await adminSupabase
        .from("pegawai")
        .select("*")
        .eq("id", requestRow.user_id)
        .single();

      // 2. Update profiles table full_name
      if (proposed.nama) {
        await adminSupabase
          .from("profiles")
          .update({ full_name: proposed.nama })
          .eq("id", requestRow.user_id);
      }

      // 3. Update pegawai table
      const updateData: any = {};
      if (proposed.nama !== undefined) updateData.nama = proposed.nama;
      if (proposed.foto_url !== undefined) updateData.foto_url = proposed.foto_url;
      if (proposed.email !== undefined) updateData.email = proposed.email;
      if (proposed.telepon !== undefined) updateData.telepon = proposed.telepon;
      if (proposed.pendidikan_terakhir !== undefined) updateData.pendidikan_terakhir = proposed.pendidikan_terakhir;

      const { data: updatedPegawai, error: updateErr } = await adminSupabase
        .from("pegawai")
        .update(updateData)
        .eq("id", requestRow.user_id)
        .select()
        .single();

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

      // Clean up storage if photo was changed
      if (currentPegawai?.foto_url && currentPegawai.foto_url !== updatedPegawai.foto_url) {
        const parts = currentPegawai.foto_url.split("/storage/v1/object/public/pegawai/");
        if (parts.length > 1) {
          const fileName = parts[1];
          await adminSupabase.storage.from("pegawai").remove([fileName]);
        }
      }

      // Log the update
      await createLog({
        kategori: "pegawai",
        aksi: "update",
        deskripsi: `Admin menyetujui perubahan profil pegawai: ${updatedPegawai.nama}`,
        data_sebelum: currentPegawai,
        data_sesudah: updatedPegawai,
        ip_address: getClientIp(request)
      });
    }

    // Mark pending request as approved
    const { error: approveErr } = await adminSupabase
      .from("profile_pending")
      .update({
        status: "approved",
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (approveErr) return NextResponse.json({ error: approveErr.message }, { status: 400 });

    return NextResponse.json({ success: true, status: "approved" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
