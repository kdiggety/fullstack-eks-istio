import { useState } from "react";
import { useApi } from "../lib/api";

export default function SecurePing() {
  const { get } = useApi();
  const [out, setOut] = useState(null);
  const call = async () => {
    try { setOut(await get("/secure/ping")); }
    catch (e) { setOut({ error: e.message }); }
  };
  return (
    <div>
      <button onClick={call}>Call /api/secure/ping</button>
      <pre>{out && JSON.stringify(out, null, 2)}</pre>
    </div>
  );
}
