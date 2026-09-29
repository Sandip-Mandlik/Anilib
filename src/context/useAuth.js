import { useContext } from "react";
import { AuthContext } from "./AuthContext";

/**
 * Hook to consume auth context.
 * Kept in a separate file so Vite Fast Refresh works correctly
 * (each file should export either components OR hooks, not both).
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
