import { createContext, useContext, useEffect, useState } from "react";
import { getClientId } from "../config";


//const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; // set at build time
const CLIENT_ID = getClientId();
const AuthCtx = createContext({ token: null, user: null, signIn: () => {}, signOut: () => {} });
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser]   = useState(null);

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true;
    s.onload = () => {
      /* global google */
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: ({ credential }) => {
          setToken(credential);
          // decode a few fields (headerless quick decode):
          const [, p] = credential.split(".");
          try { const payload = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/'))); setUser({ sub: payload.sub, email: payload.email }); } catch {}
        },
      });
    };
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  const signIn = () => window.google?.accounts.id.prompt();
  const signOut = () => {
    setToken(null); setUser(null);
    // optional revoke
    window.google?.accounts.id.revoke(user?.email || "", () => {});
  };

  return <AuthCtx.Provider value={{ token, user, signIn, signOut }}>{children}</AuthCtx.Provider>;
}

