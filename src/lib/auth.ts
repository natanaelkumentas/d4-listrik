import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "dosen" | "pegawai";
  full_name: string | null;
  nip: string | null;
}

/**
 * Get the currently authenticated user with their profile.
 * Returns null if not authenticated.
 */
export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Fetch profile to get role + nip
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, nip")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email!,
    role: profile.role as "admin" | "dosen" | "pegawai",
    full_name: profile.full_name,
    nip: profile.nip,
  };
}

/**
 * Require authentication. Returns the user or a 401 JSON response.
 */
export async function requireAuth(): Promise<
  AuthUser | NextResponse
> {
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  return user;
}

/**
 * Require a specific role. Returns the user or a 401/403 JSON response.
 */
export async function requireRole(
  allowedRoles: string[]
): Promise<AuthUser | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  if (!allowedRoles.includes(result.role)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }
  return result;
}
