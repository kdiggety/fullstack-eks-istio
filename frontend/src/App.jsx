import {useEffect, useState} from "react";
import { greet } from "./api";

export default function App() {
    const useLocalStorage = (key, initialValue) => {
        // Create the state variables
        const [value, setValue] = useState(() => {
        	// Get value from local storage, or initialize the value
        	const localStorageValue = localStorage.getItem(key);
        	return localStorageValue !== undefined ? JSON.parse(localStorageValue) : initialValue;

	});

        // Create the hooks to update the local storage when the value changes
        useEffect(() => {
            localStorage.setItem(key, JSON.stringify(value));
        }, [key, value]);

        // Return the state variables
        return [value, setValue];
    }

    const [name, setName] = useLocalStorage("name", "World");
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
