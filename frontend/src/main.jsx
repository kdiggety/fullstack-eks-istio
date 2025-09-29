// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import App from "./App";

async function loadRuntimeConfig() {
  // Prevent double-inject (optional, harmless)
  if (document.querySelector('script[data-app-config="true"]')) return true;

  // Tiny dev cache-bust is optional; keep if proxies occasionally cache
  const bust = import.meta.env?.MODE !== "production" ? `?t=${Date.now()}` : "";

  const s = document.createElement("script");
  s.src = `/runtime-config.js${bust}`;
  s.async = false;                 // ensure __APP_CONFIG__ is set before app boot
  s.dataset.appConfig = "true";
  await new Promise((resolve) => {
    s.onload = resolve;
    s.onerror = resolve;           // allow app to rely on env fallbacks in dev
    document.head.appendChild(s);
  });

  // Optional: quick sanity warning (non-blocking)
  const c = window.__APP_CONFIG__;
  if (!c?.oidc?.clientId || !c?.oidc?.redirectUri || !c?.apiBase) {
    // eslint-disable-next-line no-console
    console.warn("[config] Missing runtime keys; getters will fall back to Vite env.");
  }
}

(async () => {
  await loadRuntimeConfig();

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </React.StrictMode>
  );
})();

