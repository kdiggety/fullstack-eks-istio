function env() {
  try { return import.meta.env || {}; } catch { return {}; }
}

function current() {
  const rt = (typeof window !== "undefined" && window.__APP_CONFIG__) ? window.__APP_CONFIG__ : {};
  const e = env();
  const origin = (typeof window !== "undefined" && window.location) ? window.location.origin : (e.VITE_ORIGIN || "");

  const issuer = rt.oidc?.issuer || e.VITE_OIDC_ISSUER || "https://accounts.google.com";
  const clientId = rt.oidc?.clientId || e.VITE_GOOGLE_CLIENT_ID || "";
  const redirectUri = rt.oidc?.redirectUri || e.VITE_REDIRECT_URI || (origin ? `${origin}/callback` : "/callback");
  const postLogoutRedirectUri = rt.oidc?.postLogoutRedirectUri || e.VITE_POST_LOGOUT_REDIRECT_URI || (origin ? `${origin}/` : "/");

  let apiBase = rt.apiBase || e.VITE_API_BASE || "/api";
  if (typeof apiBase === "string" && apiBase !== "/") {
    apiBase = apiBase.startsWith("/")
      ? apiBase.replace(/\/+$/, "")
      : apiBase.replace(/\/+$/, "");
  }

  return { oidc: { issuer, clientId, redirectUri, postLogoutRedirectUri }, apiBase };
}

// Public getters (use these across your app)
export function getIssuer() { return current().oidc.issuer; }
export function getClientId() { return current().oidc.clientId; }
export function getRedirectUri() { return current().oidc.redirectUri; }
export function getPostLogoutRedirectUri() { return current().oidc.postLogoutRedirectUri; }
export function getApiBase() { return current().apiBase; }

