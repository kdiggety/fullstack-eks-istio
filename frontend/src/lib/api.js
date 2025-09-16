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
  const { token } = useAuth();
  const base = getApiBase() || "/api";

  async function request(method, path, body) {
    const isSecure = path.startsWith("/secure/");
    // Enforce token presence for secure endpoints
    if (isSecure && !token) {
      throw unauthorizedError("Missing ID token", 401);
    }
    if (isSecure && token && isExpired(token)) {
      throw unauthorizedError("Expired ID token", 401);
    }

    const headers = new Headers();
    headers.set("Accept", "application/json");
    if (body !== undefined) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      // Keep your existing cookies setting; harmless with Istio-enforced OIDC
      credentials: "include",
    });

    if (!res.ok) {
      // Try to surface JSON error body if present
      let details;
      try { details = await res.clone().json(); } catch { /* noop */ }
      if (res.status === 401 || res.status === 403) {
        throw unauthorizedError("Unauthorized", res.status, details);
      }
      const err = new Error(`${res.status}`);
      err.status = res.status;
      if (details !== undefined) err.body = details;
      throw err;
    }

    // Handle empty responses safely
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async function get(path) {
    return request("GET", path);
  }

  async function post(path, body) {
    return request("POST", path, body);
  }

  async function greet(name) {
    const res = await fetch(`${base}/greet/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error("API error");
    return res.json();
  }

  return { get, post, greet };
}
