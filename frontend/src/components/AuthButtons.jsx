import { useMemo } from "react";
import { useAuth } from "../auth/AuthProvider";

function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = decodeURIComponent(
      atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(jsonStr);
  } catch { return null; }
}

export default function AuthButtons() {
  const { user, idToken, signIn, signOut } = useAuth();

  const status = useMemo(() => {
    if (!idToken) return { label: "no token", color: "#999" };
    const claims = decodeJwt(idToken);
    if (!claims?.exp) return { label: "token (no exp in id_token?)", color: "#666" };
    const now = Math.floor(Date.now() / 1000);
    const ttl = claims.exp - now;
    if (ttl <= 0) return { label: "token expired", color: "#c00" };
    if (ttl < 90) return { label: "token expiring soon", color: "#a60" };
    return { label: "token valid", color: "#0a0" };
  }, [idToken]);

  return (
    <div className="flex gap-2 items-center">
      {user ? (
        <>
          <span>{user.email}</span>
          <button onClick={signOut}>Sign out</button>
          <button onClick={signIn} title="Refresh your ID token">Refresh sign-in</button>
        </>
      ) : (
        <button onClick={signIn}>Sign in with Google</button>
      )}
      <small style={{ color: status.color }}>{status.label}</small>
    </div>
  );
}
