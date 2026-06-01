import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { NextRequest } from "next/server";

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  let ip = "127.0.0.1";
  if (forwarded) {
    ip = forwarded.split(",")[0].trim();
  } else {
    ip = request.headers.get("x-real-ip") || "127.0.0.1";
  }

  if (ip === "::1" || ip === "127.0.0.1") {
    return "localhost";
  }
  return ip;
}

export async function createLog(params: {
  kategori: string;
  aksi: "create" | "update" | "delete" | "approve" | "reject" | "login" | "logout";
  deskripsi: string;
  data_sebelum?: any;
  data_sesudah?: any;
  ip_address?: string;
  user?: {
    id: string;
    email: string;
    full_name?: string | null;
  };
}) {
  try {
    const user = params.user || await getUser();
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
