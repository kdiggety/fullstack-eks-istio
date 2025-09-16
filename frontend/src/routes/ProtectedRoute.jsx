import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export const ProtectedRoute = ({ children }) => {
  const { idToken, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return null;
  if (!idToken) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
};

