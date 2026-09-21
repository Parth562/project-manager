import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

// Real, Postgres-backed session check — the source of truth.
// proxy.ts only checks for a cookie's presence (fast, no DB hit); this is the authority.
export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() });
}
