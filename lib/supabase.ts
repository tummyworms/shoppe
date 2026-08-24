import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "./env";

// When both env vars are present, the app uses Supabase. Otherwise it falls
// back to the local file store (see lib/store.ts). Read dynamically so the
// values are never inlined into the build.
export function supabaseEnabled(): boolean {
  return Boolean(getEnv("SUPABASE_URL") && getEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

// Bucket name for uploaded photos (created by supabase/schema.sql).
export const BUCKET = "photos";

let client: SupabaseClient | null = null;

// Server-only client using the service role key. Never import this into code
// that ships to the browser.
export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(getEnv("SUPABASE_URL")!, getEnv("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
  }
  return client;
}
