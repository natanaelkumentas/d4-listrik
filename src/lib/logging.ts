import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { NextRequest } from "next/server";

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

export async function createLog(params: {
  kategori: string;
  aksi: "create" | "update" | "delete" | "approve" | "reject";
  deskripsi: string;
  data_sebelum?: any;
  data_sesudah?: any;
  ip_address?: string;
}) {
  try {
    const user = await getUser();
    if (!user) return; // logs only for authenticated actions

    const adminSupabase = createAdminClient();
    await adminSupabase.from("logs").insert({
      user_id: user.id,
      user_email: user.email,
      user_name: user.full_name || user.email,
      kategori: params.kategori,
      aksi: params.aksi,
      deskripsi: params.deskripsi,
      data_sebelum: params.data_sebelum || null,
      data_sesudah: params.data_sesudah || null,
      ip_address: params.ip_address || null,
    });
  } catch (error) {
    console.error("Failed to create log:", error);
  }
}
