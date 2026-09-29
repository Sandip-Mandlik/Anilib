import React, { useState } from "react";
import { Star, Trophy, Bookmark, Sparkles, Filter, Heart } from "lucide-react";

export function TopChart({
  animeList,
  userRatings,
  watchlist,
  favorites = {},
  onOpenDetail,
  onOpenRating,
  onToggleWatchlist,
  onToggleFavorite
}) {
  const [chartFilter, setChartFilter] = useState("all"); // 'all' | 'TV Series' | 'Movie'

  // Sort by rating descending, then ratingCount descending
  const sorted = [...animeList]
    .filter((a) => {
      if (chartFilter === "all") return true;
      return a.type === chartFilter;
    })
    .sort((a, b) => b.rating - a.rating || (b.ratingCount || 0) - (a.ratingCount || 0));

  return (
    <div className="container" style={{ padding: "2rem 1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Trophy size={24} color="var(--accent-gold)" />
            <h2 style={{ fontSize: "2rem", color: "#ffffff" }}>Top Rated Anime Charts</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            The highest-rated anime series and theatrical films voted by millions of fans worldwide.
          </p>
        </div>

        {/* Category switcher */}
        <div className="type-toggle-group">
          <button
            className={`type-toggle-btn ${chartFilter === "all" ? "active" : ""}`}
            onClick={() => setChartFilter("all")}
          >
            All ({animeList.length})
          </button>
          <button
            className={`type-toggle-btn ${chartFilter === "TV Series" ? "active" : ""}`}
            onClick={() => setChartFilter("TV Series")}
          >
            Top Series
          </button>
          <button
            className={`type-toggle-btn ${chartFilter === "Movie" ? "active" : ""}`}
            onClick={() => setChartFilter("Movie")}
          >
            Top Movies
          </button>
        </div>
      </div>

      {/* Table View */}
      <div className="top-table-container">
        <table className="top-table">
          <thead>
            <tr>
              <th style={{ width: "60px", textAlign: "center" }}>Rank</th>
              <th style={{ width: "70px" }}>Poster</th>
              <th>Title & Details</th>
              <th style={{ width: "140px" }}>Community Score</th>
              <th style={{ width: "130px" }}>Your Rating</th>
              <th style={{ width: "110px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((anime, index) => {
              const rank = index + 1;
              const personalRating = userRatings[anime.id];
              const inWatchlist = Boolean(watchlist[anime.id]);
              const isFavorite = Boolean(favorites[anime.id]);

              return (
                <tr
                  key={anime.id}
                  onClick={() => onOpenDetail(anime)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Rank */}
                  <td style={{ textAlign: "center" }}>
                    <span className={`rank-number ${rank <= 3 ? "top3" : ""}`}>
                      {rank <= 3 ? `🥇 #${rank}` : `#${rank}`}
                    </span>
                  </td>

                  {/* Thumbnail Poster */}
                  <td>
                    <img
                      src={anime.posterImage}
                      alt={anime.title}
                      style={{
                        width: "50px",
                        height: "72px",
                        objectFit: "cover",
                        borderRadius: "6px"
                      }}
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80";
                      }}
                    />
                  </td>

                  {/* Title & Info */}
                  <td>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#ffffff", marginBottom: "0.2rem" }}>
                      {anime.title}
                    </div>
                    <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", display: "flex", gap: "0.6rem", alignItems: "center" }}>
                      <span>{anime.year}</span>
                      <span>•</span>
                      <span>{anime.type}</span>
                      <span>•</span>
                      <span>{anime.episodes}</span>
                      <span>•</span>
                      <span>{anime.studio}</span>
                    </div>
                  </td>

                  {/* IMDb Score */}
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 800, color: "var(--accent-gold)", fontSize: "1.05rem" }}>
                      <Star size={16} fill="#f59e0b" color="#f59e0b" />
                      <span>{anime.rating}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
                        ({Math.round((anime.ratingCount || 100000) / 1000)}k)
                      </span>
                    </div>
                  </td>

                  {/* Your Rating */}
                  <td>
                    {personalRating ? (
                      <button
                        className="user-rated-pill"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRating(anime);
                        }}
                        title="Click to change your rating"
                      >
                        <Star size={13} fill="#38bdf8" color="#38bdf8" />
                        <span>{personalRating}/10</span>
                      </button>
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
                          color: "var(--text-muted)",
                          fontSize: "0.825rem",
                          cursor: "pointer"
                        }}
                      >
                        <Star size={14} /> Rate
                      </button>
                    )}
                  </td>

                  {/* Favorite & Watchlist Buttons */}
                  <td style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center" }}>
                      <button
                        className="btn-icon"
                        style={{
                          width: "36px",
                          height: "36px",
                          background: isFavorite ? "rgba(239, 68, 68, 0.95)" : "rgba(255,255,255,0.06)",
                          color: isFavorite ? "#ffffff" : "#f87171"
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(anime.id);
                        }}
                        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Heart size={16} fill={isFavorite ? "#ffffff" : "none"} color={isFavorite ? "#ffffff" : "#ef4444"} />
                      </button>

                      <button
                        className="btn-icon"
                        style={{
                          width: "36px",
                          height: "36px",
                          background: inWatchlist ? "var(--accent-purple)" : "rgba(255,255,255,0.06)",
                          color: inWatchlist ? "#ffffff" : "var(--text-muted)"
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatchlist(anime.id);
                        }}
                        title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                      >
                        <Bookmark size={16} fill={inWatchlist ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
