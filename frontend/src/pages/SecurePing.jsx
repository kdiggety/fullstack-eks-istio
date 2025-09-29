import { useState } from "react";
import { useApi } from "../lib/api";

export default function SecurePing() {
  const { securePing } = useApi();
  const [out, setOut] = useState(null);

  const call = async () => {
    try {
      setOut(await securePing());
    } catch (e) {
      setOut({ error: e.message, status: e.status, body: e.body });
    }
  };

  return (
    <div>
      <button onClick={call}>Call /api/secure/ping</button>
      <pre>{out && JSON.stringify(out, null, 2)}</pre>
    </div>
  );
}


