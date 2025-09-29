import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import AuthButtons from "./components/AuthButtons";
import SecurePing from "./pages/SecurePing";
import { useApi } from "./lib/api";
import AuthCallback from "./auth/AuthCallback";

// Safer localStorage hook
function useLocalStorage(key, initialValue) {
  const { greet } = useApi();
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}

function HomePage() {
  const [name, setName] = useLocalStorage("name", "World");
  const [msg, setMsg] = useState("");
  const { greet } = useApi();

  async function onGo() {
    const { message } = await greet(name);
    setMsg(message);
  }

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui", padding: 24 }}>
      <h1>Full-Stack Sample (EKS + Istio)</h1>

      <AuthButtons />
      <hr />

      <h2>Secure Ping</h2>
      <p style={{ opacity: 0.8 }}>
        Calls <code>/api/secure/ping</code> with your token.
      </p>
      <SecurePing />
      <hr />

      <p style={{ opacity: 0.8 }}>
        React frontend → API path <code>/api</code> routed via Istio
      </p>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={onGo} style={{ marginLeft: 8 }}>Greet</button>
      <p>{msg}</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* Handles Google redirect: /callback?code=... */}
      <Route path="/callback" element={<AuthCallback />} />
    </Routes>
  );
}

