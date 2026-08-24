import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// When both env vars are present, the app uses Supabase. Otherwise it falls
// back to the local file store (see lib/store.ts). This lets everything work
// locally today and switch to Supabase automatically once keys are added.
export const supabaseEnabled = Boolean(url && serviceKey);

// Bucket name for uploaded photos (created by supabase/schema.sql).
export const BUCKET = "photos";

let client: SupabaseClient | null = null;

// Server-only client using the service role key. Never import this into code
// that ships to the browser.
export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(url!, serviceKey!, {
      auth: { persistSession: false },
    });
  }
  return client;
}
