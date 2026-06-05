import type {
  Permission,
  AvailablePage,
} from "@/types/business/permission.types";
import {
  AVAILABLE_PAGES,
  PAGE_TO_RESOURCE_PERMISSION_MAP,
  PERMISSION_MODULES,
} from "@/config/permission.config";

// ========================================
// PERMISSION UTILITIES
// ========================================

/**
 * Convert permission object to string format
 * @param permission - Permission object
 * @returns Permission string (e.g., "resource:action" or "resource:action:condition")
 */
export function permissionToString(permission: Permission): string {
  const parts: string[] = [permission.resource, permission.action];
  if (permission.condition) {
    parts.push(permission.condition);
  }
  return parts.join(":");
}

/**
 * Set of all valid permission names derived from PERMISSION_MODULES config.
 * Used to filter out permissions that no longer exist in the system.
 */
const VALID_PERMISSION_NAMES = new Set<string>(
  PERMISSION_MODULES.flatMap((module) =>
    module.permissions.map(permissionToString),
  ),
);

/**
 * Set of all valid page URLs derived from AVAILABLE_PAGES config.
 * Used to filter out pages that no longer exist in the system.
 */
const VALID_PAGE_URLS = new Set<string>(
  AVAILABLE_PAGES.map((page) => page.url),
);

// ========================================
// PAGE UTILITIES
// ========================================

/**
 * Get pages grouped by category
 * @returns Object with category names as keys and arrays of pages as values
 */
export function getPagesByCategory(): Record<string, AvailablePage[]> {
  return AVAILABLE_PAGES.reduce(
    (acc, page) => {
      if (!acc[page.category]) {
        acc[page.category] = [];
      }
      acc[page.category].push(page);
      return acc;
    },
    {} as Record<string, AvailablePage[]>,
  );
}

// ========================================
// PAGE-RESOURCE PERMISSION MAPPING
// ========================================

/**
 * Get required resource permissions for a page
 * @param pageUrl - The page URL
 * @returns Array of resource permission strings
 */
export function getRequiredPermissionsForPage(pageUrl: string): string[] {
  return PAGE_TO_RESOURCE_PERMISSION_MAP[pageUrl] || [];
}

/**
 * Resolve a page display label from URL for user-facing messages.
 */
export function getPageLabelByUrl(pageUrl: string): string {
  return AVAILABLE_PAGES.find((page) => page.url === pageUrl)?.label || pageUrl;
}

// ========================================
// DEDUPLICATION UTILITIES
// ========================================

/**
 * Remove duplicate permission strings from an array
 * @param permissions - Array of permission strings (may contain duplicates)
 * @returns Array with unique permission strings
 */
export function deduplicatePermissions(permissions: string[]): string[] {
  return Array.from(new Set(permissions));
}

/**
 * Remove duplicate page URLs from an array
 * @param pages - Array of page URLs (may contain duplicates)
 * @returns Array with unique page URLs
 */
export function deduplicatePages(pages: string[]): string[] {
  return Array.from(new Set(pages));
}

/**
 * Sanitize role data by removing duplicates from permissions and pages
 * @param roleData - Role data object containing permissions and pages arrays
 * @returns Sanitized role data with unique permissions and pages
 */
export function sanitizeRoleData<
  T extends { permission?: { name: string }[]; page?: { url: string }[] },
>(roleData: T): T {
  const sanitized = { ...roleData };

  // Filter out permissions not present in config, then deduplicate
  if (sanitized.permission && Array.isArray(sanitized.permission)) {
    const validPermissions = sanitized.permission.filter((p) =>
      VALID_PERMISSION_NAMES.has(p.name),
    );
    const uniquePermissionNames = deduplicatePermissions(
      validPermissions.map((p) => p.name),
    );
    sanitized.permission = uniquePermissionNames.map((name) => ({
      name,
    })) as T["permission"];
  }

  // Deduplicate pages if present
  if (sanitized.page && Array.isArray(sanitized.page)) {
    const validPages = sanitized.page.filter((p) => VALID_PAGE_URLS.has(p.url));
    const uniquePageUrls = deduplicatePages(validPages.map((p) => p.url));
    sanitized.page = uniquePageUrls.map((url) => ({ url })) as T["page"];
  }

  return sanitized;
}

// ========================================
// ROLE PAYLOAD GENERATION
// ========================================

export interface GeneratedRolePayload {
  status: "published";
  name: string;
  landing_page: string;
  page: Array<{ url: string }>;
  permission: Array<{ name: string }>;
}

/**
 * Build a role payload from permission and page configs.
 * By default, it returns a full-access super-admin payload.
 */
export function buildRolePayloadFromConfig(options?: {
  name?: string;
  status?: "published";
  landingPage?: string;
}): GeneratedRolePayload {
  const roleName = options?.name ?? "super-admin";
  const status = options?.status ?? "published";
  const landingPage = options?.landingPage ?? "/dashboard";

  const allPermissionNames = deduplicatePermissions(
    PERMISSION_MODULES.flatMap((module) =>
      module.permissions.map(permissionToString),
    ),
  );

  const allPageNames = deduplicatePages(
    AVAILABLE_PAGES.map((page) => page.url),
  );

  return {
    status,
    name: roleName,
    landing_page: landingPage,
    page: allPageNames.map((url) => ({ url })),
    permission: allPermissionNames.map((name) => ({ name })),
  };
}

/**
 * Build a reverse index of required permissions to page URLs from selected pages.
 * Example output: { "category:read": ["/categories", "/products/+"] }
 */
export function getPermissionToPagesRequirementMap(
  selectedPageUrls: string[],
): Record<string, string[]> {
  const map = new Map<string, Set<string>>();

  for (const pageUrl of selectedPageUrls) {
    const requiredPermissions = getRequiredPermissionsForPage(pageUrl);
    for (const permission of requiredPermissions) {
      if (!map.has(permission)) {
        map.set(permission, new Set<string>());
      }
      map.get(permission)?.add(pageUrl);
    }
  }

  return Object.fromEntries(
    Array.from(map.entries()).map(([permission, pages]) => [
      permission,
      Array.from(pages),
    ]),
  );
}
