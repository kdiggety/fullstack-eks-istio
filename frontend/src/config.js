const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "/api"; // strip trailing slash, default to /api

export { API_BASE_URL };
