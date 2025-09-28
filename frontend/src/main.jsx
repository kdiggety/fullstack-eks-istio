import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import App from "./App";

// --- Load runtime /config.js BEFORE rendering React ---
// Keep /config.js served with: Content-Type: application/javascript; Cache-Control: no-store
async function loadRuntimeConfig() {
  // Avoid double-inject
  if (document.querySelector('script[data-app-config="true"]')) return true;

  // Tiny cache-bust in dev in case a proxy ignores no-store
  const devBust = import.meta.env?.MODE !== "production" ? `?t=${Date.now()}` : "";
  const s = document.createElement("script");
  s.src = `/config.js${devBust}`;
  s.async = false; // ensure it executes before we continue
  s.dataset.appConfig = "true";

  const loaded = await new Promise((resolve) => {
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });

  // Normalize/patch the config with Vite env fallbacks
  normalizeAndValidateConfig();

  return loaded;
}

function normalizeAndValidateConfig() {
  const origin = window.location.origin;
  const env = import.meta.env || {};
  const cfg = window.__APP_CONFIG__ || {};

  // Ensure required sections exist
  cfg.oidc = cfg.oidc || {};

  // Fill from Vite env if missing (priority: runtime -> env -> defaults)
  cfg.oidc.issuer =
    cfg.oidc.issuer ||
    env.VITE_OIDC_ISSUER ||
    "https://accounts.google.com";

  cfg.oidc.clientId =
    cfg.oidc.clientId ||
    env.VITE_GOOGLE_CLIENT_ID ||
    "";

  cfg.oidc.redirectUri =
    cfg.oidc.redirectUri ||
    env.VITE_REDIRECT_URI ||
    `${origin}/callback`;

  cfg.oidc.postLogoutRedirectUri =
    cfg.oidc.postLogoutRedirectUri ||
    env.VITE_POST_LOGOUT_REDIRECT_URI ||
    `${origin}/`;

  cfg.apiBase =
    cfg.apiBase ||
    env.VITE_API_BASE ||
    "/api";

  // Normalize apiBase (keep relative "/api" as-is)
  if (typeof cfg.apiBase === "string" && cfg.apiBase !== "/") {
    cfg.apiBase = cfg.apiBase.startsWith("/")
      ? cfg.apiBase.replace(/\/+$/, "")
      : cfg.apiBase.replace(/\/+$/, "");
  }

  window.__APP_CONFIG__ = cfg;

  // One-time sanity check for Step 1 harness + developer awareness
  const missing = [];
  if (!cfg.oidc?.issuer) missing.push("oidc.issuer");
  if (!cfg.oidc?.clientId) missing.push("oidc.clientId");
  if (!cfg.oidc?.redirectUri) missing.push("oidc.redirectUri");
  if (!cfg.apiBase) missing.push("apiBase");

  if (missing.length) {
    // eslint-disable-next-line no-console
    console.warn(
      "[config] Missing keys in window.__APP_CONFIG__:",
      missing.join(", "),
      "\n(/config.js provides runtime values; Vite env can backfill in dev.)"
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

