import React, { useState, useEffect } from "react";
import { Star, X, Trash2 } from "lucide-react";
import { RATING_DESCRIPTIONS } from "../data/curatedAnime";

export function RatingModal({
  anime,
  initialRating,
  onSaveRating,
  onRemoveRating,
  onClose
}) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(initialRating || 0);

  useEffect(() => {
    setSelectedRating(initialRating || 0);
  }, [initialRating]);

  if (!anime) return null;

  const currentDisplay = hoveredRating || selectedRating;

  const handleSave = () => {
    if (selectedRating > 0) {
      onSaveRating(anime.id, selectedRating);
      onClose();
    }
  };

  const handleRemove = () => {
    onRemoveRating(anime.id);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card rating-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {/* Header with Title & Thumbnail */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <img
            src={anime.posterImage}
            alt={anime.title}
            style={{
              width: "70px",
              height: "100px",
              objectFit: "cover",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              marginBottom: "0.5rem"
            }}
          />
          <span style={{ fontSize: "0.85rem", color: "var(--accent-gold)", fontWeight: 700, textTransform: "uppercase" }}>
            Rate This Anime
          </span>
          <h2 style={{ fontSize: "1.4rem", color: "#ffffff", maxWidth: "380px" }}>
            {anime.title}
          </h2>
        </div>

        {/* Dynamic Number & Description */}
        <div style={{ marginTop: "1.5rem" }}>
          <div className="rating-number-preview">
            {currentDisplay > 0 ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <Star size={28} fill="#f59e0b" color="#f59e0b" />
                {currentDisplay}
                <span style={{ fontSize: "1.2rem", color: "var(--text-muted)", fontWeight: 500 }}>/ 10</span>
              </span>
            ) : (
              <span style={{ color: "var(--text-muted)", fontSize: "1.5rem" }}>
                Select a score
              </span>
            )}
          </div>
          <div className="rating-label-desc">
            {currentDisplay > 0 ? RATING_DESCRIPTIONS[currentDisplay] : "Hover over the stars to rate"}
          </div>
        </div>

        {/* 10 Interactive Stars */}
        <div className="rating-stars-interactive">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
            <button
              key={star}
              type="button"
              className={`star-picker-btn ${star <= currentDisplay ? "filled" : ""}`}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setSelectedRating(star)}
              aria-label={`Rate ${star} out of 10`}
            >
              <Star
                size={28}
                fill={star <= currentDisplay ? "#f59e0b" : "none"}
                color={star <= currentDisplay ? "#f59e0b" : "#475569"}
              />
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: "1.75rem" }}>
          <button
            className="btn btn-imdb"
            style={{ minWidth: "160px", padding: "0.75rem 1.5rem" }}
            disabled={selectedRating === 0}
            onClick={handleSave}
          >
            Confirm Rating
          </button>

          {initialRating && (
            <button
              className="btn btn-secondary"
              style={{ color: "#f87171" }}
              onClick={handleRemove}
              title="Remove your rating"
            >
              <Trash2 size={16} />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
