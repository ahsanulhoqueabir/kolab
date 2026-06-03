import { useAuthStore } from "@/store/auth.store";
import { AxiosError } from "axios";

/**
 * Server-side navigation utilities for use outside React context
 * This is specifically for API clients and other non-React code
 */
export class ServerNavigationHelper {
  /**
   * Handle authorization error on server/API client side
   * @param error - The error that occurred
   */
  static handleAuthError(error: unknown): void {
    const isAxiosError = (err: unknown): err is AxiosError => {
      return (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        "config" in err
      );
    };

    const status = isAxiosError(error) ? error.response?.status : undefined;
    const errorMessage = isAxiosError(error)
      ? (error.response?.data as { message?: string })?.message || error.message
      : "Authorization failed";

    // Log the error for debugging
    console.error("API Client Authorization error:", {
      status,
      message: errorMessage,
      url: isAxiosError(error) ? error.config?.url : undefined,
      timestamp: new Date().toISOString(),
    });

    // Handle 403 (Forbidden) differently from 401 (Unauthorized)
    if (status === 403) {
      // For 403, redirect to unauthorized page WITHOUT logging out
      this.redirectToUnauthorized(errorMessage);
    } else {
      // For 401 or other auth errors, logout user
      useAuthStore.getState().logout();
    }
  }

  /**
   * Redirect to unauthorized page without logging out
   * @param reason - The reason for access denial
   */
  static redirectToUnauthorized(reason?: string): void {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams();

      if (reason) {
        params.set("reason", reason);
      }

      const returnUrl = window.location.pathname;
      if (returnUrl && returnUrl !== "/unauthorized") {
        params.set("returnUrl", returnUrl);
      }

      const unauthorizedPath = `/unauthorized${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      window.location.replace(unauthorizedPath);
    }
  }

  /**
   * Check if current environment supports client-side navigation
   */
  static canNavigate(): boolean {
    return typeof window !== "undefined";
  }

  /**
   * Get login URL with proper locale handling
   */
  static getLoginPath(): string {
    return "/login";
  }
}
