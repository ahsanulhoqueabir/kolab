"use client";

import { useSearchParams } from "next/navigation";

export function useReturnUrl(defaultUrl: string = "/") {
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get("returnUrl") || defaultUrl;

  const withReturnUrl = (url: string) => {
    if (typeof window === "undefined") return url;
    const current = window.location.pathname + window.location.search;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}returnUrl=${encodeURIComponent(current)}`;
  };

  return {
    returnTo,
    withReturnUrl,
  };
}
