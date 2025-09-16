import { useEffect, useMemo, useRef } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getClientId } from "../config";

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
    return JSON.parse(jsonStr); // { exp, email, sub, ... }
  } catch {
    return null;
  }
}

export default function AuthButtons() {
  const { user, token, signIn, signOut } = useAuth();
  const googleBtnRef = useRef(null);
  const CLIENT_ID = getClientId();

  // Render the Google button when signed out
  useEffect(() => {
    if (user || !googleBtnRef.current || !CLIENT_ID) return;
    const g = window.google && window.google.accounts && window.google.accounts.id;
    if (!g) return; // GIS script loads async from AuthProvider
    try {
      g.initialize({ client_id: CLIENT_ID, callback: () => {} }); // real callback handled in AuthProvider
      g.renderButton(googleBtnRef.current, {
        theme: "outline",
        text: "signin_with",
        size: "medium",
        type: "standard",
        shape: "rectangular",
      });
    } catch {}
  }, [user, CLIENT_ID]);

  const status = useMemo(() => {
    if (!token) return { label: "no token", color: "#999" };
    const claims = decodeJwt(token);
    if (!claims?.exp) return { label: "token (unknown exp)", color: "#666" };
    const now = Math.floor(Date.now() / 1000);
    const ttl = claims.exp - now;
    if (ttl <= 0) return { label: "token expired", color: "#c00" };
    if (ttl < 90) return { label: "token expiring soon", color: "#a60" };
    return { label: "token valid", color: "#0a0" };
  }, [token]);

  return (
    <div className="flex gap-2 items-center">
      {user ? (
        <>
          <span>{user.email}</span>
          <button onClick={signOut}>Sign out</button>
          <button onClick={signIn} title="Prompt Google to refresh your ID token">
            Refresh sign-in
          </button>
        </>
      ) : (
        <>
          <div ref={googleBtnRef} />
          {/* Fallback in case GIS button can’t render */}
          <button onClick={signIn}>Sign in with Google</button>
        </>
      )}
      <small style={{ color: status.color }}>{status.label}</small>
    </div>
  );
}

