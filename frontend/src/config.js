// /config.js (RUNTIME SCRIPT; no imports/exports)
// If you already set window.__CONFIG = { GOOGLE_CLIENT_ID, API_BASE, ... },
// this file maps that legacy shape into the canonical window.__APP_CONFIG__.
// Otherwise it uses safe defaults and the current origin to synthesize routes.

(function () {
  const legacy = (typeof window !== "undefined" && window.__CONFIG) ? window.__CONFIG : {};
  const origin = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "";

  // Minimal, harness-friendly shape
  const cfg = {
    oidc: {
      issuer: "https://accounts.google.com",
      clientId: legacy.GOOGLE_CLIENT_ID || "",        // fill via legacy or patched by main.jsx from Vite env
      redirectUri: `${origin}/callback`,
      postLogoutRedirectUri: `${origin}/`,
    },
    // Keep relative "/api" (works behind same-origin ingress); main.jsx can normalize
    apiBase: legacy.API_BASE || "/api",
  };

  // Normalize trailing slashes (keep "/api" as-is)
  if (typeof cfg.apiBase === "string" && cfg.apiBase !== "/") {
    cfg.apiBase = cfg.apiBase.startsWith("/")
      ? cfg.apiBase.replace(/\/+$/, "")
      : cfg.apiBase.replace(/\/+$/, "");
  }

  // Expose for the app + harness
  window.__APP_CONFIG__ = cfg;
})();

