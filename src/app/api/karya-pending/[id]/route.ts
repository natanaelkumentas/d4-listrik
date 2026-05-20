import { createClient } from "@/lib/supabase/server";
import { requireRole, requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// PUT /api/karya-pending/[id] — Admin only: Approve or Reject
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const result = await requireRole(["admin"]);
    if (result instanceof NextResponse) return result;

    const { id } = await params;
    const body = await request.json();
    const { action, catatan_admin } = body; // action: 'approve' | 'reject'

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the pending karya
    const { data: pending, error: fetchError } = await supabase
      .from("karya_pending")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !pending) {
      return NextResponse.json({ error: "Pending karya not found" }, { status: 404 });
    }

    if (pending.status !== "pending") {
      return NextResponse.json({ error: "This submission has already been reviewed" }, { status: 400 });
    }

    if (action === "approve") {
      // Insert into karya table
      const { error: insertError } = await supabase
        .from("karya")
        .insert({
          dosen_id: pending.dosen_id,
          jenis: pending.jenis,
          judul: pending.judul,
          tahun: pending.tahun,
          deskripsi: pending.deskripsi,
          metadata: pending.metadata,
          foto_urls: pending.foto_urls || [],
        });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }
    }

    // Update pending status
    const { data, error: updateError } = await supabase
      .from("karya_pending")
      .update({
        status: action === "approve" ? "approved" : "rejected",
        catatan_admin: catatan_admin || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/karya-pending/[id] — Admin or owner: Delete pending entry
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const result = await requireAuth();
    if (result instanceof NextResponse) return result;

    const { id } = await params;
    const user = result;
    const supabase = await createClient();

    // Fetch to check ownership
    const { data: pending } = await supabase
      .from("karya_pending")
      .select("submitted_by, status")
      .eq("id", id)
      .single();

    if (!pending) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only admin or owner (if still pending) can delete
    if (user.role !== "admin") {
      if (pending.submitted_by !== user.id || pending.status !== "pending") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { error } = await supabase
      .from("karya_pending")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Deleted" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
