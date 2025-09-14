//const API_BASE_URL =
//  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "/api"; // strip trailing slash, default to /api

//export { API_BASE_URL };

export function getClientId() {
  return window.__CONFIG?.GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID;
}

export function getApiBase() {
  return window.__CONFIG?.API_BASE || import.meta.env.VITE_API_BASE || "/api";
}
