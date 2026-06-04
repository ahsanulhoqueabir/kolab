"use client";

import { useSearchParams } from "next/navigation";

export function useReturnUrl(defaultUrl: string = "/") {
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get("returnTo") || defaultUrl;

  const withReturnUrl = (url: string) => {
    if (typeof window === "undefined") return url;
    const current = window.location.pathname + window.location.search;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}returnTo=${encodeURIComponent(current)}`;
  };

  return {
    returnTo,
    withReturnUrl,
  };
}
