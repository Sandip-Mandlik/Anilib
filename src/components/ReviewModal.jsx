import React, { useState } from "react";
import { Star, X, AlertTriangle, Check, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { RATING_DESCRIPTIONS } from "../data/curatedAnime";

const AVAILABLE_TAGS = [
  "Masterpiece",
  "Must Watch",
  "Emotional",
  "Peak Fiction",
  "Incredible Animation",
  "Great OST",
  "Complex Characters",
  "Mind-Blowing Twist",
  "Philosophical"
];

export function ReviewModal({
  anime,
  userInitialRating,
  existingReview,
  onSaveReview,
  onClose
}) {
  const [rating, setRating] = useState(existingReview?.rating || userInitialRating || 10);
  const [headline, setHeadline] = useState(existingReview?.title || "");
  const [content, setContent] = useState(existingReview?.content || "");
  const [containsSpoiler, setContainsSpoiler] = useState(existingReview?.containsSpoiler || false);
  const [selectedTags, setSelectedTags] = useState(existingReview?.tags || ["Masterpiece"]);
  const [hoveredStar, setHoveredStar] = useState(0);

  if (!anime) return null;

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!headline.trim() || !content.trim()) return;

    // Trigger celebratory confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      // safe fallback
    }

    onSaveReview({
      id: existingReview?.id,
      animeId: anime.id,
      animeTitle: anime.title,
      animePoster: anime.posterImage,
      rating: Number(rating),
      title: headline.trim(),
      content: content.trim(),
      containsSpoiler,
      tags: selectedTags
    });

    onClose();
  };

  const currentDisplayStar = hoveredStar || rating;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card review-form-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <img
            src={anime.posterImage}
            alt={anime.title}
            style={{ width: "55px", height: "80px", objectFit: "cover", borderRadius: "6px" }}
          />
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--accent-gold)", fontWeight: 700, textTransform: "uppercase" }}>
              Community Review
            </span>
            <h2 style={{ fontSize: "1.35rem", color: "#ffffff" }}>
              Review <span style={{ color: "var(--accent-purple)" }}>{anime.title}</span>
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating Picker */}
          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Your Numerical Score (1 - 10):</span>
              <strong style={{ color: "var(--accent-gold)" }}>
                {RATING_DESCRIPTIONS[currentDisplayStar]}
              </strong>
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  style={{ padding: "0.2rem", color: star <= currentDisplayStar ? "#f59e0b" : "#475569" }}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    size={24}
                    fill={star <= currentDisplayStar ? "#f59e0b" : "none"}
                    color={star <= currentDisplayStar ? "#f59e0b" : "#475569"}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Headline */}
          <div className="form-group">
            <label className="form-label">Review Headline / Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. A generational masterpiece with unmatched emotional depth"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              required
              maxLength={120}
            />
          </div>

          {/* Review Body */}
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Detailed Review</label>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {content.length} characters
              </span>
            </div>
            <textarea
              className="form-textarea"
              placeholder="Write your in-depth critique here. Mention animation quality, character arcs, soundtrack, and pacing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={6}
            />
          </div>

          {/* Spoiler Warning Toggle */}
          <div
            className="form-group"
            style={{
              background: containsSpoiler ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${containsSpoiler ? "rgba(239, 68, 68, 0.4)" : "var(--border-subtle)"}`,
              borderRadius: "8px",
              padding: "0.85rem 1rem",
              cursor: "pointer"
            }}
            onClick={() => setContainsSpoiler(!containsSpoiler)}
          >
            <div className="checkbox-row">
              <div className={`checkbox-custom ${containsSpoiler ? "checked" : ""}`}>
                {containsSpoiler && <Check size={14} color="#ffffff" />}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600, color: containsSpoiler ? "#f87171" : "#ffffff", fontSize: "0.9rem" }}>
                  <AlertTriangle size={16} />
                  Contains Spoilers
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Check this if your review reveals key plot points, character fates, or twist endings.
                </div>
              </div>
            </div>
          </div>

          {/* Review Tags */}
          <div className="form-group">
            <label className="form-label">Review Tags (Click to select)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {AVAILABLE_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`badge ${active ? "badge-purple" : "badge-glass"}`}
                    style={{ cursor: "pointer", fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                    onClick={() => toggleTag(tag)}
                  >
                    {active && <Check size={12} style={{ marginRight: "0.25rem" }} />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-imdb"
              disabled={!headline.trim() || !content.trim()}
            >
              <Sparkles size={16} />
              Publish Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
