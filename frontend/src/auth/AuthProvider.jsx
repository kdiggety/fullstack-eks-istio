// ./src/auth/AuthProvider.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getClientId } from "../config";

// OIDC-safe defaults (non-crypto checks)
const ALLOWED_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const STORAGE_KEY = "gis_id_token";

const AuthCtx = createContext({ token: null, user: null, signIn: () => {}, signOut: () => {} });
export const useAuth = () => useContext(AuthCtx);

function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonStr); // { iss, aud, exp, email, sub, ... }
  } catch {
    return null;
  }
}

function isExpired(payload) {
  if (!payload?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

export default function AuthProvider({ children }) {
  const CLIENT_ID = getClientId();

  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [claims, setClaims] = useState(() => (token ? decodeJwt(token) : null));
  const reauthTimer = useRef(null);

  const clearReauthTimer = () => {
    if (reauthTimer.current) {
      clearTimeout(reauthTimer.current);
      reauthTimer.current = null;
    }
  };

  const scheduleReauth = (payload) => {
    clearReauthTimer();
    if (!payload?.exp) return;
    // Re-prompt ~60s before expiry
    const msUntil = payload.exp * 1000 - Date.now() - 60_000;
    if (msUntil > 0) {
      reauthTimer.current = setTimeout(() => {
        try { window.google?.accounts?.id?.prompt(); } catch {}
      }, msUntil);
    }
  };

  const validateAndStore = (idToken) => {
    const p = decodeJwt(idToken);
    if (!p) return false;
    const ok =
      ALLOWED_ISSUERS.includes(p.iss) &&
      p.aud === CLIENT_ID &&
      !isExpired(p);

    if (!ok) return false;

    localStorage.setItem(STORAGE_KEY, idToken);
    setToken(idToken);
    setClaims(p);
    scheduleReauth(p);
    return true;
  };

  // Load previously stored token and validate against current client id
  useEffect(() => {
    if (!token) return;
    const p = claims || decodeJwt(token);
    const ok = p && ALLOWED_ISSUERS.includes(p.iss) && p.aud === CLIENT_ID && !isExpired(p);
    if (!ok) {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setClaims(null);
    } else {
      scheduleReauth(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CLIENT_ID]);

  // Ensure GIS script is present; initialize and set callback
  useEffect(() => {
    const onReady = () => {
      try {
        const g = window.google?.accounts?.id;
        if (!g || !CLIENT_ID) return;

        g.initialize({
          client_id: CLIENT_ID,
          callback: ({ credential }) => {
            if (!credential || !validateAndStore(credential)) {
              // Hard reset if invalid
              localStorage.removeItem(STORAGE_KEY);
              setToken(null);
              setClaims(null);
            }
          },
          auto_select: false,
          use_fedcm_for_prompt: true,
        });

        // Try One Tap (safe no-op if blocked)
        try { g.prompt(); } catch {}
      } catch {}
    };

    if (window.google?.accounts?.id) {
      onReady();
      return;
    }

    // Inject script if not present
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = onReady;
    document.head.appendChild(s);
    return () => {
      s.onload = null;
      // Keep script in DOM (shared); just clear timers/state on unmount
      clearReauthTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CLIENT_ID]);

  const signIn = () => {
    try { window.google?.accounts?.id?.prompt(); } catch {}
  };

  const signOut = () => {
    clearReauthTimer();
    const email = claims?.email || "";
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setClaims(null);
    try { window.google?.accounts?.id?.disableAutoSelect?.(); } catch {}
    // Optional revoke (best-effort)
    try { window.google?.accounts?.id?.revoke?.(email, () => {}); } catch {}
  };

  const user = useMemo(() => (claims ? { sub: claims.sub, email: claims.email } : null), [claims]);

  return (
    <AuthCtx.Provider value={{ token, user, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

