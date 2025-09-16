import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import App from "./App";

// Load runtime config.js (mounted by Helm/Nginx) before rendering React
function loadRuntimeConfig() {
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "/config.js";      // absolute path so it works on any route
    s.async = false;           // block until it loads
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false); // fallback to import.meta.env in dev
    document.head.appendChild(s);
  });
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

