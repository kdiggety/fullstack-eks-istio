// src/config.js  (ES module; exports getters that read window.__APP_CONFIG__)
let _cached = null;

function _env() {
  try { return import.meta?.env || {}; } catch { return {}; }
}
function _origin() {
  if (typeof window !== "undefined" && window.location) return window.location.origin;
  const env = _env();
  return env.VITE_ORIGIN || "";
}

function _readRuntime() {
  const env = _env();
  const w = (typeof window !== "undefined") ? window : undefined;
  const runtime = (w && w.__APP_CONFIG__) ? w.__APP_CONFIG__ : {};
  const legacy = (w && w.__CONFIG__) ? w.__CONFIG__ : {};

  const issuer =
    runtime.oidc?.issuer ||
    env.VITE_OIDC_ISSUER ||
    "https://accounts.google.com";

  const clientId =
    runtime.oidc?.clientId ||
    legacy.GOOGLE_CLIENT_ID ||
    env.VITE_GOOGLE_CLIENT_ID ||
    "";

  const redirectUri =
    runtime.oidc?.redirectUri ||
    env.VITE_REDIRECT_URI ||
    (_origin() ? `${_origin()}/callback` : "/callback");

  const postLogoutRedirectUri =
    runtime.oidc?.postLogoutRedirectUri ||
    env.VITE_POST_LOGOUT_REDIRECT_URI ||
    (_origin() ? `${_origin()}/` : "/");

  let apiBase =
    runtime.apiBase ||
    legacy.API_BASE ||
    env.VITE_API_BASE ||
    "/api";

  // Normalize apiBase (keep relative "/api" as-is)
  if (typeof apiBase === "string" && apiBase !== "/") {
    apiBase = apiBase.startsWith("/")
      ? apiBase.replace(/\/+$/, "")
      : apiBase.replace(/\/+$/, "");
  }

  return {
    oidc: { issuer, clientId, redirectUri, postLogoutRedirectUri },
    apiBase,
  };
}

// Call once after /config.js loads to capture the runtime values
export function refreshAppConfig() {
  _cached = _readRuntime();
  // Ensure the global also reflects normalization (helps your harness)
  if (typeof window !== "undefined") {
    window.__APP_CONFIG__ = _cached;
  }
}

// Lazy: if refresh wasn’t called yet, read on demand
function _cfg() {
  if (_cached) return _cached;
  _cached = _readRuntime();
  return _cached;
}

// === Public getters used around the app ===
export function getIssuer() { return _cfg().oidc.issuer; }
export function getClientId() { return _cfg().oidc.clientId; }
export function getRedirectUri() { return _cfg().oidc.redirectUri; }
export function getPostLogoutRedirectUri() { return _cfg().oidc.postLogoutRedirectUri; }
export function getApiBase() { return _cfg().apiBase; }

