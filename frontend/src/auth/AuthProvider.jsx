// ./src/auth/AuthProvider.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getClientId, getRedirectUri } from "../config";

const ACCESS_TOKEN_KEY = "access_token";
const ID_TOKEN_KEY = "id_token";
const EXPIRES_AT_KEY = "token_expires_at";

const AuthCtx = createContext({ token: null, user: null, signIn: () => {}, signOut: () => {} });
export const useAuth = () => useContext(AuthCtx);

// Minimal JWT payload decode (no verification; server verifies tokens)
function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(json.split("").map(c => `%${("00"+c.charCodeAt(0).toString(16)).slice(-2)}`).join("")));
  } catch { return null; }
}

function isExpiredAt(expiresAtMs) {
  if (!expiresAtMs) return true;
  return Date.now() >= Number(expiresAtMs);
}

// PKCE helpers
function base64url(uint8) {
  return btoa(String.fromCharCode(...new Uint8Array(uint8))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function createPkce() {
  // RFC 7636: verifier [43,128] from ALPHA / DIGIT / "-" / "." / "_" / "~"
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";
  const rand = crypto.getRandomValues(new Uint8Array(64));
  const verifier = Array.from(rand, b => alphabet[b % alphabet.length]).join("");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64url(digest);
  return { verifier, challenge };
}

export default function AuthProvider({ children }) {
  const CLIENT_ID = getClientId();
  const REDIRECT_URI = getRedirectUri();

  // Load tokens (support migration from old storage if any)
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(ACCESS_TOKEN_KEY) || null);
  const [idToken, setIdToken] = useState(() => localStorage.getItem(ID_TOKEN_KEY) || null);
  const [expiresAt, setExpiresAt] = useState(() => localStorage.getItem(EXPIRES_AT_KEY) || null);

  // Derive user from id_token if present
  const claims = useMemo(() => (idToken ? decodeJwt(idToken) : null), [idToken]);
  const user = useMemo(() => (claims ? { sub: claims.sub, email: claims.email } : null), [claims]);

  // Simple expiry guard on mount / clientId change
  useEffect(() => {
    if (!accessToken) return;
    if (isExpiredAt(expiresAt)) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(ID_TOKEN_KEY);
      localStorage.removeItem(EXPIRES_AT_KEY);
      setAccessToken(null);
      setIdToken(null);
      setExpiresAt(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CLIENT_ID]);

  // Auto-refresh prompt timer (optional; here we just clear)
  const reauthTimer = useRef(null);
  const clearReauthTimer = () => {
    if (reauthTimer.current) { clearTimeout(reauthTimer.current); reauthTimer.current = null; }
  };
  useEffect(() => () => clearReauthTimer(), []);

  // === Public API ===

  // Start OIDC Authorization Code + PKCE (frontend part)
  const signIn = async () => {
    if (!CLIENT_ID || !REDIRECT_URI) {
      console.warn("[auth] missing clientId or redirectUri");
      return;
    }
    const { verifier, challenge } = await createPkce();
    sessionStorage.setItem("pkce_verifier", verifier);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      scope: "openid email profile",
      redirect_uri: REDIRECT_URI, // e.g., http://127.0.0.1:8080/callback
      code_challenge: challenge,
      code_challenge_method: "S256",
      prompt: "select_account"
    });
    window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  };

  // Client-side logout + tell backend (optional)
  const signOut = async () => {
    clearReauthTimer();
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(ID_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    setAccessToken(null);
    setIdToken(null);
    setExpiresAt(null);
    window.location.assign("/"); // postLogoutRedirectUri
  };

  // Expose access token for API calls (bearer)
  const value = useMemo(
    () => ({ token: accessToken, user, signIn, signOut }),
    [accessToken, user]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

/*
How this integrates with your AuthCallback.jsx:

- After Google redirects to /callback?code=..., your AuthCallback should:
  1) read 'code' and the PKCE 'code_verifier' from sessionStorage,
  2) POST { code, code_verifier, redirect_uri, client_id } to /api/auth/callback,
  3) store access_token, id_token, and expires_in:

     localStorage.setItem("access_token", tokens.access_token);
     localStorage.setItem("id_token", tokens.id_token || "");
     localStorage.setItem("token_expires_at", String(Date.now() + (tokens.expires_in || 0) * 1000));

  4) navigate("/").

- Your API client should attach Authorization: Bearer <access_token> for /api/* requests.
*/
