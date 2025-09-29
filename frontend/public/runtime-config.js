(function () {
  const origin = window.location.origin;

  const cfg = {
    oidc: {
      issuer: "https://accounts.google.com",
      clientId: "",                                // fill via Helm/template if desired
      redirectUri: `${origin}/callback`,
      postLogoutRedirectUri: `${origin}/`,
    },
    // Relative path works when API is behind the same ingress
    apiBase: "/api",
  };

  // Normalize apiBase (trim trailing slash; keep "/api" as-is)
  if (typeof cfg.apiBase === "string" && cfg.apiBase !== "/") {
    cfg.apiBase = cfg.apiBase.startsWith("/")
      ? cfg.apiBase.replace(/\/+$/, "")
      : cfg.apiBase.replace(/\/+$/, "");
  }

  window.__APP_CONFIG__ = cfg;
})();

