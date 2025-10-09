import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getClientId,
  getRedirectUri,
} from "../config";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");
      if (error) {
        console.error("OIDC error:", error, params.get("error_description"));
        navigate("/login?error=oidc");
        return;
      }
      if (!code) {
        navigate("/login?error=missing_code");
        return;
      }

      const codeVerifier = sessionStorage.getItem("pkce_verifier");
      if (!codeVerifier) {
        console.error("Missing PKCE code_verifier");
        navigate("/login?error=missing_verifier");
        return;
      }

      // Hand off to your backend (BFF) to include client_secret
      const res = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          code_verifier: codeVerifier,
          redirect_uri: getRedirectUri(), // e.g. http://127.0.0.1:8080/callback
          client_id: getClientId(),
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("Token exchange failed:", res.status, txt);
        navigate("/login?error=token_exchange");
        return;
      }

      const tokens = await res.json();
      // Store (keeps your Step 3/4 checks simple: SPA attaches Bearer to /api/health)
      sessionStorage.removeItem("pkce_verifier");
      localStorage.setItem("access_token", tokens.access_token || "");
      localStorage.setItem("id_token", tokens.id_token || "");
      localStorage.setItem("token_expires_at", String(Date.now() + (tokens.expires_in || 0) * 1000));

      navigate("/");
    })();
  }, [navigate]);

  return <div>Signing you in…</div>;
}

