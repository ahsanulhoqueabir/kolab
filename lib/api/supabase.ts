import { createClient } from "@supabase/supabase-js";
import { sb } from "@/config/env.config";

let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Creates a Supabase client using the service role key for server-side operations.
 * This should only be used in server-side code (API routes, server actions, services).
 * Uses singleton pattern to avoid creating multiple clients.
 */
export function getSupabaseServerClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = sb.url;
  const supabaseSecretKey = sb.secretKey;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Supabase URL and Secret Key must be defined in environment variables",
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}
