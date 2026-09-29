import React, { useRef, useState } from "react";
import { Star, ChevronLeft, ChevronRight, Bookmark, Play, Heart } from "lucide-react";

/**
 * PosterGallery — Horizontal scrollable cinematic poster showcase.
 * Shows anime entries that have custom AI-generated poster artwork.
 */
export function PosterGallery({
  animeList,
  userRatings,
  watchlist,
  favorites = {},
  onOpenDetail,
  onOpenTrailer,
  onToggleWatchlist,
  onToggleFavorite
}) {
  const scrollRef = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);

  // Only show anime that have locally-generated posters
  const featuredAnime = animeList.filter(
    (a) => a.posterImage && a.posterImage.startsWith("/posters/")
  );

  if (featuredAnime.length === 0) return null;

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth"
    });
  };

  return (
    <section className="poster-gallery-section">
      {/* Section Header */}
      <div className="poster-gallery-header">
        <div>
          <h2 className="poster-gallery-title">
            <span className="poster-gallery-icon">🎬</span>
            Featured Anime Posters
          </h2>
          <p className="poster-gallery-subtitle">
            Exclusive artwork for each anime in our curated catalog
          </p>
        </div>
        {/* Scroll Controls */}
        <div className="poster-gallery-controls">
          <button className="poster-scroll-btn" onClick={() => scroll("left")} aria-label="Scroll left">
            <ChevronLeft size={22} />
          </button>
          <button className="poster-scroll-btn" onClick={() => scroll("right")} aria-label="Scroll right">
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="poster-gallery-track" ref={scrollRef}>
        {featuredAnime.map((anime, i) => {
          const isHovered = hoveredId === anime.id;
          const inWatchlist = Boolean(watchlist[anime.id]);
          const isFavorite = Boolean(favorites[anime.id]);
          const userRating = userRatings[anime.id];

          return (
            <div
              key={anime.id}
              className={`poster-card ${isHovered ? "poster-card--hovered" : ""}`}
              style={{ animationDelay: `${i * 0.06}s` }}
              onMouseEnter={() => setHoveredId(anime.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onOpenDetail(anime)}
            >
              {/* Poster Image */}
              <div className="poster-card-img-wrap">
                <img
                  src={anime.posterImage}
                  alt={`${anime.title} poster`}
                  className="poster-card-img"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80";
                  }}
                />
                {/* Gradient overlay */}
                <div className="poster-card-overlay" />

                {/* Type badge */}
                <span className="poster-type-badge">
                  {anime.type === "Movie" ? "🎬" : "📺"} {anime.type}
                </span>

                <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", zIndex: 4, display: "flex", gap: "0.35rem" }}>
                  {/* Favorite Button */}
                  <button
                    className={`poster-watchlist-btn ${isFavorite ? "active" : ""}`}
                    style={{
                      background: isFavorite ? "rgba(239, 68, 68, 0.95)" : undefined,
                      borderColor: isFavorite ? "#ef4444" : undefined
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(anime.id);
                    }}
                    title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Heart size={15} fill={isFavorite ? "#ffffff" : "none"} color={isFavorite ? "#ffffff" : "#ef4444"} />
                  </button>

                  {/* Watchlist button */}
                  <button
                    className={`poster-watchlist-btn ${inWatchlist ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchlist(anime.id);
                    }}
                    title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                  >
                    <Bookmark size={16} fill={inWatchlist ? "currentColor" : "none"} />
                  </button>
                </div>

                {/* Hover overlay with actions */}
                <div className={`poster-hover-overlay ${isHovered ? "visible" : ""}`}>
                  <div className="poster-hover-actions">
                    {anime.trailerYoutubeId && (
                      <button
                        className="poster-action-btn poster-action-play"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTrailer(anime);
                        }}
                      >
                        <Play size={18} fill="currentColor" />
                        Trailer
                      </button>
                    )}
                    <button
                      className="poster-action-btn poster-action-info"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetail(anime);
                      }}
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>

              {/* Info below poster */}
              <div className="poster-card-info">
                <h3 className="poster-card-name" title={anime.title}>{anime.title}</h3>
                <div className="poster-card-meta">
                  <div className="poster-rating">
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    <span>{anime.rating}</span>
                  </div>
                  {userRating && (
                    <div className="poster-user-rating">
                      <Star size={12} fill="#38bdf8" color="#38bdf8" />
                      <span>{userRating}</span>
                    </div>
                  )}
                  <span className="poster-year">{anime.year}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
