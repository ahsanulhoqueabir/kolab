import { createClient } from "@supabase/supabase-js";
import type { PostgrestQueryBuilder } from "@supabase/postgrest-js";
import { sb } from "@/config/env.config";

// ── Generic table-row types ──────────────────────────────────────────
// These mirror what supabase-js expects for a Database generic parameter.
// "any" is intentional — it's the escape hatch that lets every service
// file avoid repeated `as any` casts while keeping the query chain fluent.

// ── Typed query builder ──────────────────────────────────────────────
// Returned by `.from(tableName)` — keeps the full PostgREST chain typed
// without requiring a concrete Database schema.
// We use `any` for Schema/Relation so the chain methods (select, eq, etc.)
// resolve to generic Record types instead of SelectQueryError.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseQueryBuilder = PostgrestQueryBuilder<any, any, any, string>;

// ── Typed Supabase client ────────────────────────────────────────────
// Wraps the real client but exposes `.from()` with a stable return type.

export interface SupabaseServiceClient {
  from(table: string): SupabaseQueryBuilder;
}

let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Creates a typed Supabase client for server-side operations.
 *
 * The returned client's `.from()` method returns a `SupabaseQueryBuilder`
 * so that service files never need `as any` casts.
 */
export function getSupabaseServerClient(): SupabaseServiceClient {
  if (supabaseClient) return supabaseClient as unknown as SupabaseServiceClient;

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

  return supabaseClient as unknown as SupabaseServiceClient;
}
