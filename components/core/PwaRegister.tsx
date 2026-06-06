"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for PWA support (offline caching, install prompt).
 * Only runs in the browser and when the browser supports service workers.
 */
export function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      // Register the service worker with a delay so the page loads first
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          if (registration.active) {
            console.log("PWA: Service worker registered successfully");
          }
        } catch (err) {
          console.warn("PWA: Service worker registration failed", err);
        }
      };

      // Wait for the page to load before registering
      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
        return () => window.removeEventListener("load", registerSW);
      }
    }
  }, []);

  return null;
}
