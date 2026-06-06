import axios, { AxiosInstance, AxiosError } from "axios";
import { useAuthStore, selectIsAuthenticated } from "@/store/auth.store";
import { ServerNavigationHelper } from "./server-navigation-helper";

/**
 * Create axios instance for use in Zustand stores
 * This instance automatically includes the access token from auth store
 * and waits for auth hydration before sending any request.
 */
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: "/api",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor to wait for auth and add token
  instance.interceptors.request.use(
    async (config) => {
      // Wait for hydration if it hasn't happened yet
      if (!useAuthStore.getState().hasHydrated) {
        await new Promise<void>((resolve) => {
          const unsubscribe = useAuthStore.subscribe((state) => {
            if (state.hasHydrated) {
              unsubscribe();
              resolve();
            }
          });
        });
      }

      // Skip auth check for public endpoints
      const isPublic = config.url?.startsWith("/auth/") ?? false;

      if (!isPublic) {
        const state = useAuthStore.getState();
        const isAuthenticated = selectIsAuthenticated(state);

        if (!isAuthenticated) {
          return Promise.reject(
            new Error("Authentication required. Please log in."),
          );
        }
      }

      const { accessToken } = useAuthStore.getState();
      if (accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // Response interceptor to handle token refresh and auth errors
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original_request = error.config as typeof error.config & {
        _retry?: boolean;
      };

      // ── NEVER retry /auth/me — it's called by initAuth() which
      //    already handles clearing invalid tokens. Retrying here
      //    would cause an infinite loop. ──────────────────────────
      const isAuthMe = original_request?.url === "/auth/me";

      // Handle authorization errors (401, 403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Check for PROFILE_INACTIVE — logout immediately, don't redirect to unauthorized
        const errorType = (error.response?.data as { errorType?: string })
          ?.errorType;
        if (errorType === "PROFILE_INACTIVE") {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }

        // If error is 401 and we haven't retried yet, try token refresh
        // BUT skip retry for /auth/me to avoid infinite loops
        if (
          error.response?.status === 401 &&
          !original_request?._retry &&
          !isAuthMe
        ) {
          if (original_request) {
            original_request._retry = true;
          }

          try {
            // Try to refresh the token by re-initializing auth
            await useAuthStore.getState().initAuth();

            // Get the updated token
            const { accessToken } = useAuthStore.getState();

            // If we still don't have a token after refresh attempt, handle auth error
            if (!accessToken) {
              ServerNavigationHelper.handleAuthError(error);
              return Promise.reject(error);
            }

            // Retry the original request with new token
            if (original_request?.headers) {
              original_request.headers.Authorization = `Bearer ${accessToken}`;
            }

            return original_request
              ? instance(original_request)
              : Promise.reject(error);
          } catch (refresh_error) {
            // If refresh fails, handle auth error
            ServerNavigationHelper.handleAuthError(refresh_error);
            return Promise.reject(refresh_error);
          }
        } else {
          // For 403, /auth/me 401, or already retried 401, handle auth error immediately
          ServerNavigationHelper.handleAuthError(error);
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

// Export a singleton instance
export const api_client = createApiClient();
