import { useAuth } from "../auth/AuthProvider";

export function useApi() {
  const { token } = useAuth();
  const base = import.meta.env.VITE_API_BASE || "/api";

  async function get(path) {
    const r = await fetch(`${base}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  }

  async function post(path, body) {
    const r = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      credentials: "include",
    });
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  }

  return { get, post };
}
