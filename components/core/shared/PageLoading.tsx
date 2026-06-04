import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoadingProps {
  /** Optional message to display below the spinner */
  message?: string;
  /** Whether to show a full-page loader (min-h-screen) */
  fullPage?: boolean;
  className?: string;
}

/**
 * Full page or section loading spinner.
 *
 * @example
 * ```tsx
 * // Full page loader
 * <PageLoading message="Loading dashboard..." fullPage />
 *
 * // Inline section loader
 * <PageLoading message="Saving..." />
 * ```
 */
export function PageLoading({
  message = "Loading...",
  fullPage = true,
  className,
}: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullPage ? "min-h-[60vh]" : "py-12",
        className,
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
