/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseServerClient } from "@/lib/api/supabase";
import { success, error } from "@/lib/api/api-response";
import { jt } from "@/config/env.config";
import type {
  AuthSession,
  AuthSessionFormData,
} from "@/types/db/auth-session.types";
import { userAgent, type NextRequest } from "next/server";

type ServiceResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days in ms
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

export class AuthSessionService {
  private static table = "auth_sessions";
  private static max = 3;

  /**
   * Helper to parse and extract metadata details from a NextRequest,
   * including geolocations and fallback device information.
   */
  static async extractSessionMetadata(
    request: NextRequest,
  ): Promise<Partial<AuthSessionFormData>> {
    try {
      const uaDetails = userAgent(request);
      const ip =
        (request as any).ip ||
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        "127.0.0.1";
      const acceptLanguage =
        request.headers.get("accept-language")?.split(",")[0] || null;

      // Determine device type
      let deviceType = uaDetails.device.type;
      if (!deviceType) {
        deviceType = uaDetails.isBot ? "bot" : "desktop";
      }

      // Determine device defaults if not parsed
      let deviceBrand = uaDetails.device.vendor || null;
      let deviceModel = uaDetails.device.model || null;
      let deviceName = uaDetails.device.model || null;

      const osName = uaDetails.os.name || null;
      const osVersion = uaDetails.os.version || null;

      if (!deviceBrand || !deviceModel) {
        if (osName === "Mac OS") {
          deviceBrand = "Apple";
          deviceModel = "Mac";
          deviceName = "Macintosh";
        } else if (osName === "Windows") {
          deviceBrand = "Microsoft";
          deviceModel = "PC";
          deviceName = "Windows PC";
        } else if (osName === "Linux") {
          deviceBrand = "Generic";
          deviceModel = "PC";
          deviceName = "Linux PC";
        } else if (osName === "iOS") {
          deviceBrand = "Apple";
          deviceModel = "iPhone/iPad";
          deviceName = "iOS Device";
        } else if (osName === "Android") {
          deviceBrand = "Generic";
          deviceModel = "Android Phone";
          deviceName = "Android Device";
        } else {
          deviceBrand = "Generic";
          deviceModel = "Device";
          deviceName = "Unknown Device";
        }
      }

      // Geolocation lookup
      let ipLocation = {};
      if (ip && ip !== "127.0.0.1" && ip !== "::1" && ip !== "localhost") {
        try {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 1200); // 1.2s timeout
          const geoRes = await fetch(`http://ip-api.com/json/${ip}`, {
            signal: controller.signal,
          });
          clearTimeout(id);
          const geoData = await geoRes.json();
          if (geoData && geoData.status === "success") {
            ipLocation = {
              city: geoData.city || undefined,
              country: geoData.country || undefined,
              region: geoData.regionName || undefined,
              latitude: geoData.lat || undefined,
              longitude: geoData.lon || undefined,
              timezone: geoData.timezone || undefined,
              isp: geoData.isp || undefined,
            };
          }
        } catch (err) {
          console.error("[Geolocation] Failed to fetch IP location:", err);
        }
      } else {
        ipLocation = {
          city: "Localhost",
          country: "Local Network",
          region: "Local",
        };
      }

      return {
        ip_address: ip,
        ip_location: ipLocation,
        device_type: deviceType as any,
        device_name: deviceName,
        device_brand: deviceBrand,
        device_model: deviceModel,
        os_name: osName,
        os_version: osVersion,
        browser_name: uaDetails.browser.name || null,
        browser_version: uaDetails.browser.version || null,
        user_agent: uaDetails.ua,
        language: acceptLanguage,
        auth_method: "password",
      };
    } catch (err) {
      console.error("[Session Metadata] Extraction failed:", err);
      return {};
    }
  }

  /**
   * Validate session ID: checks if the session is not expired and the joined profile is active.
   * Returns session data with profile, role, and permissions.
   */
  static async validateAndGetSession(
    sessionId: string,
  ): Promise<ServiceResult<any>> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error: sbError } = await supabase
        .from(this.table)
        .select(
          `
          id,
          expires_at,
          profile:profile (
            id,
            name,
            email,
            active,
            role:role (
              id,
              name,
              permissions
            )
          )
        `,
        )
        .eq("id", sessionId)
        .single();

      if (sbError || !data) {
        return error(sbError?.message || "Session not found");
      }

      // Check session expiry
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      if (expiresAt <= now) {
        return error("Session has expired");
      }

      // Check if profile is active
      const profile = data.profile as any;
      if (!profile || !profile.active) {
        return error("Associated user profile is inactive");
      }

      return success(data);
    } catch (err) {
      return error(
        (err as Error).message ||
          "An unknown error occurred during session validation",
      );
    }
  }

  /**
   * Create a new session, enforcing the max concurrent sessions limit.
   * Deletes the oldest active session(s) if the limit is exceeded.
   */
  static async createSession(
    profileId: string,
    metadata: Partial<AuthSessionFormData>,
  ): Promise<ServiceResult<any>> {
    try {
      const supabase = getSupabaseServerClient();

      // Count active sessions where profile is active
      const { data: activeSessions, error: countError } = await supabase
        .from(this.table)
        .select("id, created_at, profile!inner(active)")
        .eq("profile", profileId)
        .eq("profile.active", true)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true }); // oldest first

      if (countError) {
        return error(countError.message);
      }

      const activeCount = activeSessions?.length || 0;

      // Enforce max limit: if active sessions >= max, delete oldest sessions to make room
      if (activeCount >= this.max) {
        const toDeleteCount = activeCount - this.max + 1;
        const toDelete = activeSessions!.slice(0, toDeleteCount);
        const idsToDelete = toDelete.map((s) => s.id);
        const { error: deleteError } = await supabase
          .from(this.table)
          .delete()
          .in("id", idsToDelete);

        if (deleteError) {
          return error(
            `Failed to clean up old sessions: ${deleteError.message}`,
          );
        }
      }

      // Create new session
      const durationMs = parseDuration(jt.expiresIn);
      const expiresAt = new Date(Date.now() + durationMs).toISOString();

      const sessionInsert = {
        profile: profileId,
        ip_address: metadata.ip_address || null,
        ip_location: metadata.ip_location || {},
        device_type: metadata.device_type || null,
        device_name: metadata.device_name || null,
        device_brand: metadata.device_brand || null,
        device_model: metadata.device_model || null,
        os_name: metadata.os_name || null,
        os_version: metadata.os_version || null,
        browser_name: metadata.browser_name || null,
        browser_version: metadata.browser_version || null,
        user_agent: metadata.user_agent || null,
        screen_resolution: metadata.screen_resolution || null,
        language: metadata.language || null,
        timezone: metadata.timezone || null,
        expires_at: expiresAt,
        auth_method: metadata.auth_method || "password",
      };

      const { data, error: insertError } = await supabase
        .from(this.table)
        .insert(sessionInsert)
        .select()
        .single();

      if (insertError) {
        return error(insertError.message);
      }

      return success(data);
    } catch (err) {
      return error(
        (err as Error).message ||
          "An unknown error occurred during session creation",
      );
    }
  }

  /**
   * List all sessions for a specific profile.
   */
  static async listSessions(
    profileId: string,
  ): Promise<ServiceResult<AuthSession[]>> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error: sbError } = await supabase
        .from(this.table)
        .select("*")
        .eq("profile", profileId)
        .order("created_at", { ascending: false });

      if (sbError) {
        return error(sbError.message);
      }

      return success(data as AuthSession[]);
    } catch (err) {
      return error((err as Error).message || "Failed to list sessions");
    }
  }

  /**
   * Revoke/Delete a specific session by ID.
   */
  static async revokeSession(
    sessionId: string,
    profileId: string,
  ): Promise<ServiceResult<null>> {
    try {
      const supabase = getSupabaseServerClient();
      const { error: sbError } = await supabase
        .from(this.table)
        .delete()
        .eq("id", sessionId)
        .eq("profile", profileId);

      if (sbError) {
        return error(sbError.message);
      }

      return success(null);
    } catch (err) {
      return error((err as Error).message || "Failed to revoke session");
    }
  }

  /**
   * Revoke all other sessions for a specific profile (except current one).
   */
  static async revokeAllOtherSessions(
    currentSessionId: string,
    profileId: string,
  ): Promise<ServiceResult<null>> {
    try {
      const supabase = getSupabaseServerClient();
      const { error: sbError } = await supabase
        .from(this.table)
        .delete()
        .eq("profile", profileId)
        .neq("id", currentSessionId);

      if (sbError) {
        return error(sbError.message);
      }

      return success(null);
    } catch (err) {
      return error((err as Error).message || "Failed to revoke other sessions");
    }
  }
}
