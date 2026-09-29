import React from "react";
import { SlidersHorizontal, ArrowUpDown, Star, RotateCcw, Heart } from "lucide-react";
import { GENRE_LIST } from "../data/curatedAnime";

export function FilterBar({
  typeFilter,
  setTypeFilter,
  selectedGenre,
  setSelectedGenre,
  minRating,
  setMinRating,
  sortBy,
  setSortBy,
  showFavoritesOnly,
  setShowFavoritesOnly,
  onResetFilters,
  totalResults
}) {
  const isFiltered = typeFilter !== "all" || selectedGenre !== "All" || minRating > 0 || sortBy !== "rating" || showFavoritesOnly;

  return (
    <div className="filter-bar">
      {/* Top Row: Type toggles, Count, Sort, and Rating Filters */}
      <div className="filter-top-row">
        {/* Type Toggle: All / TV Series / Movies / Favorites */}
        <div className="type-toggle-group">
          <button
            className={`type-toggle-btn ${typeFilter === "all" ? "active" : ""}`}
            onClick={() => setTypeFilter("all")}
          >
            All Anime
          </button>
          <button
            className={`type-toggle-btn ${typeFilter === "TV Series" ? "active" : ""}`}
            onClick={() => setTypeFilter("TV Series")}
          >
            TV Series
          </button>
          <button
            className={`type-toggle-btn ${typeFilter === "Movie" ? "active" : ""}`}
            onClick={() => setTypeFilter("Movie")}
          >
            Movies
          </button>

          {/* Favorites Only Toggle */}
          <button
            className={`type-toggle-btn ${showFavoritesOnly ? "active" : ""}`}
            style={{
              background: showFavoritesOnly ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : undefined,
              borderColor: showFavoritesOnly ? "#ef4444" : undefined,
              color: showFavoritesOnly ? "#ffffff" : "#f87171"
            }}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Heart size={14} fill={showFavoritesOnly ? "#ffffff" : "none"} color={showFavoritesOnly ? "#ffffff" : "#ef4444"} style={{ marginRight: "0.3rem", verticalAlign: "middle" }} />
            Favorites Only
          </button>
        </div>

        {/* Results Counter & Controls */}
        <div className="sort-controls">
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginRight: "0.5rem" }}>
            Showing <strong style={{ color: "#ffffff" }}>{totalResults}</strong> titles
          </span>

          {/* Min Rating Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Star size={16} color="var(--accent-gold)" />
            <select
              className="select-control"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              aria-label="Filter by minimum score"
            >
              <option value={0}>Any Score</option>
              <option value={9.0}>9.0+ Masterpiece</option>
              <option value={8.5}>8.5+ Highly Acclaimed</option>
              <option value={8.0}>8.0+ Great</option>
            </select>
          </div>

          {/* Sort By Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <ArrowUpDown size={16} color="var(--text-muted)" />
            <select
              className="select-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort anime list"
            >
              <option value="rating">Top Rated (IMDb Score)</option>
              <option value="popularity">Most Popular (Votes)</option>
              <option value="newest">Release Year (Newest)</option>
              <option value="title">Title (A to Z)</option>
            </select>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              className="btn btn-secondary"
              style={{ padding: "0.45rem 0.8rem", fontSize: "0.8rem" }}
              onClick={onResetFilters}
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Genre Chips Row */}
      <div className="genre-chips-container">
        {GENRE_LIST.map((genre) => (
          <button
            key={genre}
            className={`genre-chip ${selectedGenre === genre ? "active" : ""}`}
            onClick={() => setSelectedGenre(genre)}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
}
