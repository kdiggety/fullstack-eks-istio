import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useApi } from "../lib/api";
import AuthButtons from "../components/AuthButtons";

export default function Account() {
  const { user, token } = useAuth();
  const api = useApi();
  const [ping, setPing] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError(null);
      setPing(null);
      try {
        const res = await api.get("/secure/ping");
        if (!cancelled) setPing(res);
      } catch (e) {
        if (!cancelled) setError(e?.body || e?.message || "Error");
      }
    }
    if (token) run();
    return () => { cancelled = true; };
  }, [token, api]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Account</h1>

      <div style={{ margin: "8px 0 16px" }}>
        <AuthButtons />
      </div>

      <h2>Profile</h2>
      <pre>{JSON.stringify({ user, hasToken: !!token }, null, 2)}</pre>

      <h2 style={{ marginTop: 24 }}>/api/secure/ping</h2>
      {error ? (
        <pre style={{ color: "#c00" }}>{typeof error === "string" ? error : JSON.stringify(error, null, 2)}</pre>
      ) : (
        <pre>{ping ? JSON.stringify(ping, null, 2) : token ? "Loading..." : "Sign in to call the secure endpoint."}</pre>
      )}
    </div>
  );
}

