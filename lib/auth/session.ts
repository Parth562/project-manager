import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

// Real, Postgres-backed session check - the source of truth.
// proxy.ts only checks for a cookie's presence (fast, no DB hit); this is the authority.
// cache() dedupes the lookup within one request (layout + page share one DB hit).
export const getServerSession = cache(async () =>
  auth.api.getSession({ headers: await headers() })
);
