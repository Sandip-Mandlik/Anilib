import React from "react";
import { Play, Star, Bookmark, Info, Sparkles, Heart } from "lucide-react";

export function HeroSpotlight({
  anime,
  userRating,
  inWatchlist,
  isFavorite,
  onOpenDetail,
  onOpenTrailer,
  onOpenRating,
  onToggleWatchlist,
  onToggleFavorite
}) {
  if (!anime) return null;

  return (
    <section className="hero-spotlight">
      {/* Background Image & Ambient Gradient */}
      <div
        className="hero-backdrop"
        style={{ backgroundImage: `url(${anime.backdropImage || anime.posterImage})` }}
      />
      <div className="hero-gradient" />

      <div className="container hero-content">
        {/* Badges / Spotlight tag */}
        <div className="hero-tag-row">
          <span className="badge badge-gold">
            <Sparkles size={12} /> Spotlight of the Season
          </span>
          <span className="badge badge-purple">{anime.type}</span>
          <span className="badge badge-glass">{anime.studio}</span>
          <span className="badge badge-glass">{anime.ageRating}</span>
        </div>

        {/* Title */}
        <h1 className="hero-title">{anime.title}</h1>

        {/* Metadata & Scores */}
        <div className="hero-meta-row">
          <div className="imdb-score-badge">
            <Star size={18} fill="#f59e0b" color="#f59e0b" />
            <span>{anime.rating}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              / 10 ({anime.ratingCount?.toLocaleString() || "100k+"})
            </span>
          </div>

          {userRating ? (
            <div className="user-rated-pill" style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}>
              <Star size={14} fill="#38bdf8" color="#38bdf8" />
              <span>Your Rating: {userRating}/10</span>
            </div>
          ) : (
            <button
              onClick={() => onOpenRating(anime)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                color: "#94a3b8",
                fontSize: "0.85rem",
                textDecoration: "underline",
                cursor: "pointer"
              }}
            >
              <Star size={14} /> Rate this
            </button>
          )}

          <span>{anime.year}</span>
          <span>•</span>
          <span>{anime.episodes}</span>
          <span>•</span>
          <span>{anime.genres.slice(0, 3).join(", ")}</span>
        </div>

        {/* Synopsis snippet */}
        <p className="hero-synopsis">{anime.synopsis}</p>

        {/* Action Buttons */}
        <div className="hero-actions">
          {anime.trailerYoutubeId && (
            <button className="btn btn-imdb" onClick={() => onOpenTrailer(anime)}>
              <Play size={18} fill="currentColor" />
              Watch Trailer
            </button>
          )}

          <button className="btn btn-secondary" onClick={() => onOpenDetail(anime)}>
            <Info size={18} />
            View Reviews & Stats
          </button>

          <button
            className={`btn ${isFavorite ? "btn-primary" : "btn-secondary"}`}
            style={{
              background: isFavorite ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : undefined,
              borderColor: isFavorite ? "#ef4444" : undefined
            }}
            onClick={() => onToggleFavorite(anime.id)}
          >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} color={isFavorite ? "#ffffff" : "#ef4444"} />
            {isFavorite ? "Favorited ❤️" : "Add to Favorites"}
          </button>

          <button
            className={`btn ${inWatchlist ? "btn-primary" : "btn-secondary"}`}
            onClick={() => onToggleWatchlist(anime.id)}
          >
            <Bookmark size={18} fill={inWatchlist ? "currentColor" : "none"} />
            {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
          </button>
        </div>
      </div>
    </section>
  );
}
