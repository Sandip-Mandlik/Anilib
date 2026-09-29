import React from "react";
import { X, ExternalLink } from "lucide-react";

export function TrailerModal({ anime, onClose }) {
  if (!anime || !anime.trailerYoutubeId) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: "860px",
          background: "#000000",
          border: "1px solid var(--border-medium)",
          padding: 0,
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.5rem",
            background: "rgba(15, 21, 35, 0.95)",
            borderBottom: "1px solid var(--border-subtle)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="badge badge-gold" style={{ fontSize: "0.7rem" }}>OFFICIAL TRAILER</span>
            <h3 style={{ fontSize: "1.1rem", color: "#ffffff" }}>{anime.title}</h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <a
              href={`https://www.youtube.com/watch?v=${anime.trailerYoutubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-icon"
              title="Open in YouTube"
              style={{ width: "32px", height: "32px" }}
            >
              <ExternalLink size={15} />
            </a>
            <button
              className="btn-icon"
              onClick={onClose}
              style={{ width: "32px", height: "32px" }}
              aria-label="Close trailer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 16:9 Responsive Video Iframe */}
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden" }}>
          <iframe
            title={`${anime.title} Official Trailer`}
            src={`https://www.youtube-nocookie.com/embed/${anime.trailerYoutubeId}?autoplay=1&rel=0&modestbranding=1`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: 0
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
