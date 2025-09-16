import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AuthButtons from "../components/AuthButtons";

export default function Login() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token) {
      const from = (location && location.state && location.state.from) || "/account";
      navigate(from, { replace: true });
    }
  }, [token, navigate, location]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Sign in</h1>
      <p>Use your Google account to proceed.</p>
      <div style={{ marginTop: 16 }}>
        <AuthButtons />
      </div>
    </div>
  );
}

