import React from "react";
import { CheckCircle2, Star, Bookmark, Info, X } from "lucide-react";

export function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let typeClass = "toast-success";
        if (toast.type === "gold" || toast.type === "rating") {
          Icon = Star;
          typeClass = "toast-gold";
        } else if (toast.type === "watchlist") {
          Icon = Bookmark;
          typeClass = "toast-info";
        }

        return (
          <div key={toast.id} className={`toast ${typeClass}`}>
            <Icon size={18} color="currentColor" />
            <div style={{ flex: 1 }}>{toast.message}</div>
            <button
              onClick={() => onDismiss(toast.id)}
              style={{ color: "var(--text-muted)", padding: "0.2rem" }}
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
