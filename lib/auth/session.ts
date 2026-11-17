import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

// Real, Postgres-backed session check - the source of truth.
// proxy.ts only checks for a cookie's presence (fast, no DB hit); this is the authority.
// cache() dedupes the lookup within one request (layout + page share one DB hit).
//
// Better Auth turns any database failure into a generic "Failed to get session"
// error. The remote Supabase pooler occasionally drops idle connections, so the
// first query on a stale connection can fail; retry once before giving up.
export const getServerSession = cache(async () => {
  const requestHeaders = await headers();
  try {
    return await auth.api.getSession({ headers: requestHeaders });
  } catch (error) {
    console.warn("[auth] getSession failed, retrying once:", error);
    return auth.api.getSession({ headers: requestHeaders });
  }
});
