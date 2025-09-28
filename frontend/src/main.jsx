import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import App from "./App";

// --- Load runtime /config.js BEFORE rendering React ---
// NOTE: Keep /config.js served with: Content-Type: application/javascript; Cache-Control: no-store
async function loadRuntimeConfig() {
  // Avoid double-inject
  if (document.querySelector('script[data-app-config="true"]')) return true;

  // Small cache-bust in case an intermediate proxy ignores no-store (dev only)
  const devBust = process.env.NODE_ENV !== "production" ? `?t=${Date.now()}` : "";
  const s = document.createElement("script");
  s.src = `/config.js${devBust}`;
  s.async = false; // ensure it executes before we continue
  s.dataset.appConfig = "true";

  const loaded = await new Promise((resolve) => {
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });

  // Normalize shapes so the app can rely on window.__APP_CONFIG__
  normalizeRuntimeConfig();

  // Final sanity check (warn but do not hard-block render)
  validateRuntimeConfig();

  return loaded;
}

function normalizeRuntimeConfig() {
  const legacy = window.__CONFIG || {};             // current shape you have
  const cfg = window.__APP_CONFIG__ || {};          // preferred shape

  const origin = window.location.origin;
  const ensured = {
    // Preserve existing preferred shape if present
    ...cfg,
    oidc: {
      issuer: (cfg.oidc && cfg.oidc.issuer) || legacy.OIDC_ISSUER || "https://accounts.google.com",
      clientId: (cfg.oidc && cfg.oidc.clientId) || legacy.GOOGLE_CLIENT_ID || (import.meta.env?.VITE_GOOGLE_CLIENT_ID || ""),
      redirectUri:
        (cfg.oidc && cfg.oidc.redirectUri) ||
        legacy.REDIRECT_URI ||
        (import.meta.env?.VITE_REDIRECT_URI || `${origin}/callback`),
      postLogoutRedirectUri:
        (cfg.oidc && cfg.oidc.postLogoutRedirectUri) ||
        legacy.POST_LOGOUT_URI ||
        (import.meta.env?.VITE_POST_LOGOUT_REDIRECT_URI || `${origin}/`),
    },
    apiBase:
      cfg.apiBase ||
      legacy.API_BASE ||
      (import.meta.env?.VITE_API_BASE || "/api"),
  };

  // Normalize apiBase (trim trailing slash; keep relative "/api" as-is)
  if (typeof ensured.apiBase === "string") {
    ensured.apiBase = ensured.apiBase.startsWith("/")
      ? ensured.apiBase.replace(/\/+$/, "")
      : ensured.apiBase.replace(/\/+$/, "");
  }

  window.__APP_CONFIG__ = ensured;
}

function validateRuntimeConfig() {
  const c = window.__APP_CONFIG__ || {};
  const miss = [];
  if (!c.oidc?.clientId) miss.push("oidc.clientId");
  if (!c.oidc?.issuer) miss.push("oidc.issuer");
  if (!c.oidc?.redirectUri) miss.push("oidc.redirectUri");
  if (!c.apiBase) miss.push("apiBase");

  if (miss.length) {
    // eslint-disable-next-line no-console
    console.warn(
      "[config] Missing keys in window.__APP_CONFIG__:",
      miss.join(", "),
      "\nCheck /config.js and your Google OAuth client settings."
    );
  }
}

(async () => {
  await loadRuntimeConfig();

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </React.StrictMode>
  );
})();
