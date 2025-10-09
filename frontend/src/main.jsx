import React from "react";
import ReactDOM from "react-dom/client";

async function loadRuntimeConfig() {
  if (document.querySelector('script[data-app-config="true"]')) return true;

  const bust = import.meta.env?.MODE !== "production" ? `?t=${Date.now()}` : "";
  const s = document.createElement("script");
  s.src = `/runtime-config.js${bust}`;
  s.async = false;                 // ensure it executes before we import app code
  s.dataset.appConfig = "true";
  await new Promise((resolve) => {
    s.onload = resolve;
    s.onerror = resolve;
    document.head.appendChild(s);
  });

  const c = window.__APP_CONFIG__;
  if (!c?.oidc?.clientId || !c?.oidc?.redirectUri || !c?.apiBase) {
    console.warn("[config] Missing runtime keys; getters will fall back to Vite env.");
  }
}

(async () => {
  // 1) Load runtime config first
  await loadRuntimeConfig();

  // 2) ONLY NOW import anything that might read config
  const [{ BrowserRouter }, { default: AuthProvider }, { default: App }] =
    await Promise.all([
      import("react-router-dom"),
      import("./auth/AuthProvider"),
      import("./App"),
    ]);

  // 3) Render
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
