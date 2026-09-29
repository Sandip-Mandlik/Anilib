import React from "react";
import { Star, Bookmark, Play, Heart } from "lucide-react";

export function AnimeCard({
  anime,
  userRating,
  inWatchlist,
  isFavorite,
  onOpenDetail,
  onOpenRating,
  onOpenTrailer,
  onToggleWatchlist,
  onToggleFavorite
}) {
  return (
    <div className="anime-card" onClick={() => onOpenDetail(anime)}>
      {/* Poster Image Container */}
      <div className="anime-card-poster-wrap">
        <img
          src={anime.posterImage}
          alt={anime.title}
          className="anime-card-poster"
          loading="lazy"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80";
          }}
        />

        {/* Top Badges & Action Buttons */}
        <div className="anime-card-badges">
          <span className="badge badge-purple" style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>
            {anime.type}
          </span>

          <div style={{ display: "flex", gap: "0.35rem" }}>
            {/* Quick Favorite Heart Button */}
            <button
              className="btn-icon"
              style={{
                width: "32px",
                height: "32px",
                background: isFavorite ? "rgba(239, 68, 68, 0.95)" : "rgba(0,0,0,0.65)",
                color: isFavorite ? "#ffffff" : "var(--text-secondary)",
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                transition: "all 0.2s ease"
              }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(anime.id);
              }}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart size={15} fill={isFavorite ? "#ffffff" : "none"} color={isFavorite ? "#ffffff" : "#ef4444"} />
            </button>

            {/* Quick Watchlist Bookmark Button */}
            <button
              className="btn-icon"
              style={{
                width: "32px",
                height: "32px",
                background: inWatchlist ? "var(--accent-purple)" : "rgba(0,0,0,0.65)",
                color: inWatchlist ? "#ffffff" : "var(--text-secondary)",
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
              }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist(anime.id);
              }}
              title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
            >
              <Bookmark size={15} fill={inWatchlist ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        {/* Trailer hover icon if available */}
        {anime.trailerYoutubeId && (
          <div
            style={{
              position: "absolute",
              bottom: "0.75rem",
              right: "0.75rem",
              zIndex: 3
            }}
          >
            <button
              className="btn-icon"
              style={{
                width: "32px",
                height: "32px",
                background: "rgba(245, 158, 11, 0.9)",
                color: "#0b0e14",
                border: "none",
                borderRadius: "50%"
              }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenTrailer(anime);
              }}
              title="Watch Trailer"
            >
              <Play size={14} fill="currentColor" />
            </button>
          </div>
        )}
      </div>

      {/* Card Info Body */}
      <div className="anime-card-body">
        <h3 className="anime-card-title" title={anime.title}>
          {anime.title}
        </h3>

        <div className="anime-card-meta">
          <span>{anime.year}</span>
          <span>•</span>
          <span>{anime.studio || "Studio"}</span>
        </div>

        {/* Card Footer with IMDb score and user rating */}
        <div className="anime-card-footer">
          <div className="card-rating-display">
            <Star size={15} fill="#f59e0b" color="#f59e0b" />
            <span>{anime.rating}</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400 }}>
              ({Math.round(anime.ratingCount / 1000)}k)
            </span>
          </div>

          {userRating ? (
            <div
              className="user-rated-pill"
              onClick={(e) => {
                e.stopPropagation();
                onOpenRating(anime);
              }}
              title="Click to edit your rating"
            >
              <Star size={12} fill="#38bdf8" color="#38bdf8" />
              <span>{userRating}</span>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenRating(anime);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                cursor: "pointer"
              }}
              className="hover:text-gold"
            >
              <Star size={12} /> Rate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
