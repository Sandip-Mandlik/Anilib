import React, { createContext, useState, useEffect, useCallback } from "react";
import {
  getSession,
  saveSession,
  clearSession,
  loginWithCredentials,
  createAccount,
  updateAccountProfile,
} from "../services/auth";

// Export the context so useAuth.js can import it
export const AuthContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady]     = useState(false);

  // Rehydrate session on mount
  useEffect(() => {
    const user = getSession();
    setCurrentUser(user);
    setAuthReady(true);
  }, []);

  const login = useCallback((username, password) => {
    const result = loginWithCredentials(username, password);
    if (result.success) {
      saveSession(result.user);
      setCurrentUser(result.user);
    }
    return result;
  }, []);

  const signup = useCallback((data) => {
    const result = createAccount(data);
    if (result.success) {
      saveSession(result.user);
      setCurrentUser(result.user);
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setCurrentUser(null);
  }, []);

  const updateProfile = useCallback((updates) => {
    if (!currentUser) return;
    const updated = updateAccountProfile(currentUser.username, updates);
    if (updated) setCurrentUser(updated);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, authReady, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
