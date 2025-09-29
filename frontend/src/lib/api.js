// ./src/lib/api.js
import { useAuth } from "../auth/AuthProvider";
import { getApiBase } from "../config";

// Lightweight JWT payload decode (no signature verification)
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

function isExpired(token) {
  const claims = decodeJwt(token);
  if (!claims || !claims.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return claims.exp <= now;
}

function unauthorizedError(message = "Unauthorized", status = 401, body) {
  const err = new Error(message);
  err.status = status;
  if (body !== undefined) err.body = body;
  return err;
}

export function useApi() {
  const { token } = useAuth();                 // Google ID token from AuthProvider (GIS One Tap)
  const base = getApiBase() || "/api";

  async function request(method, path, body) {
    // Treat any /secure/* path as protected by backend requireIdToken middleware
    const isSecure = path.startsWith("/secure/");
    if (isSecure && !token) throw unauthorizedError("Missing ID token", 401);
    if (isSecure && token && isExpired(token)) throw unauthorizedError("Expired ID token", 401);

    const headers = new Headers();
    headers.set("Accept", "application/json");
    if (body !== undefined) headers.set("Content-Type", "application/json");
    // Always attach Bearer if we have a token (safe for secure and non-secure calls)
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include", // OK with Istio/front proxy; harmless if unused
    });

    if (!res.ok) {
      let details;
      try { details = await res.clone().json(); } catch { /* ignore */ }
      if (res.status === 401 || res.status === 403) {
        throw unauthorizedError("Unauthorized", res.status, details);
      }
      const err = new Error(`${res.status} ${res.statusText}`.trim());
      err.status = res.status;
      if (details !== undefined) err.body = details;
      throw err;
    }

    // Handle empty/204 safely and only parse JSON when present
    const text = await res.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return text; }
  }

  async function get(path) {
    return request("GET", path);
  }

  async function post(path, body) {
    return request("POST", path, body);
  }

  // Unauthenticated sample endpoint (keep as-is unless your API changes)
  async function greet(name) {
    const res = await fetch(`${base}/greet/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error("API error");
    return res.json();
  }

  // Convenience helper for your secure route
  async function securePing() {
    return get("/secure/ping");
  }

  return { get, post, greet, securePing };
}

