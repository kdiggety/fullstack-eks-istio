import { useState } from "react";
import { greet } from "./api";

export default function App() {
  const [name, setName] = useState("World");
  const [msg, setMsg] = useState("");

  async function onGo() {
    const { message } = await greet(name);
    setMsg(message);
  }

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui", padding: 24 }}>
      <h1>Full-Stack Sample (EKS + Istio)</h1>
      <p style={{opacity:0.8}}>React frontend → API path /api routed via Istio</p>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={onGo} style={{marginLeft:8}}>Greet</button>
      <p>{msg}</p>
    </div>
  );
}
