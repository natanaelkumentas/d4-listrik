import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/logs — Admin only: Fetch paginated or exportable audit trail logs
export async function GET(request: NextRequest) {
  try {
    const check = await requireRole(["admin"]);
    if (check instanceof NextResponse) return check;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const kategori = searchParams.get("kategori");
    const aksi = searchParams.get("aksi");
    const pengguna = searchParams.get("pengguna");
    const ipAddress = searchParams.get("ip_address");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const isExport = searchParams.get("export") === "true";

    const adminSupabase = createAdminClient();
    let query = adminSupabase
      .from("logs")
      .select("*", { count: "exact" });

    if (kategori) {
      query = query.eq("kategori", kategori);
    }
    if (aksi) {
      query = query.eq("aksi", aksi);
    }
    if (pengguna) {
      query = query.or(`user_email.ilike.%${pengguna}%,user_name.ilike.%${pengguna}%`);
    }
    if (ipAddress) {
      query = query.ilike("ip_address", `%${ipAddress}%`);
    }
    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59.999Z`);
    }

    query = query.order("created_at", { ascending: false });

    if (!isExport) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    } else {
      query = query.limit(5000); // safety cap for export
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich logs with user_role from profiles table
    let enrichedData = data || [];
    if (enrichedData.length > 0) {
      const userIds = Array.from(new Set(enrichedData.map((d: any) => d.user_id).filter(Boolean)));
      if (userIds.length > 0) {
        const { data: profiles } = await adminSupabase
          .from("profiles")
          .select("id, role")
          .in("id", userIds);

        const rolesMap: Record<string, string> = {};
        if (profiles) {
          profiles.forEach((p: any) => {
            rolesMap[p.id] = p.role;
          });
        }

        enrichedData = enrichedData.map((log: any) => ({
          ...log,
          user_role: log.user_id ? (rolesMap[log.user_id] || "user") : "system"
        }));
      }
    }

    return NextResponse.json({
      data: enrichedData,
      count: count || 0,
      page,
      limit,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
