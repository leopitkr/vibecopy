import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env/server";

/**
 * Server-only Supabase client with service role key.
 * Bypasses RLS; use only in trusted server code (e.g. webhooks).
 */
export function createServiceRoleClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}
