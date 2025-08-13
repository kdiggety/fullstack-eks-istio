const API_BASE = import.meta.env.VITE_API_BASE || "/api";
export async function greet(name) {
  const res = await fetch(`${API_BASE}/greet/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}
