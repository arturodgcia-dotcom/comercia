import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./app/AuthContext";
import { MarketProvider } from "./app/MarketContext";
import { AppRouter } from "./app/router";
import "./i18n";
import "./app/styles.css";

const LANDING_CACHE_NAME_ACTIVE = "comercia-pos-shell-v2";
const LANDING_CLEANUP_VERSION_KEY = "comercia_landing_cleanup_v2";
const LEGACY_LANDING_STORAGE_KEYS = [
  "comercia_landing_cache",
  "comercia_landing_draft",
  "comercia_landing_snapshot",
  "comercia_storefront_landing_cache",
];

function cleanupLegacyLandingState() {
  try {
    if (localStorage.getItem(LANDING_CLEANUP_VERSION_KEY) === "done") return;

    LEGACY_LANDING_STORAGE_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys
          .filter((key) => key.startsWith("comercia-pos-shell-") && key !== LANDING_CACHE_NAME_ACTIVE)
          .forEach((key) => {
            caches.delete(key).catch(() => undefined);
          });
      });
    }

    localStorage.setItem(LANDING_CLEANUP_VERSION_KEY, "done");
  } catch {
    // No bloquea render si almacenamiento/caches no estan disponibles.
  }
}

cleanupLegacyLandingState();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MarketProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </MarketProvider>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("No fue posible registrar service worker", error);
      });
    });
  } else {
    // Evita cache stale durante desarrollo local.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().catch(() => undefined);
      });
    });
  }
}
