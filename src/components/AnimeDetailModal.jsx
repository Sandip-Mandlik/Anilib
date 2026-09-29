import React, { useState } from "react";
import {
  Star,
  X,
  Play,
  Bookmark,
  MessageSquarePlus,
  ThumbsUp,
  AlertTriangle,
  Eye,
  SlidersHorizontal,
  Trash2,
  Share2,
  Heart
} from "lucide-react";
import { getMergedReviewsForAnime } from "../services/storage";

export function AnimeDetailModal({
  anime,
  userRating,
  inWatchlist,
  isFavorite,
  reviewVotes,
  currentUser,
  onClose,
  onOpenRating,
  onOpenTrailer,
  onOpenReviewForm,
  onToggleWatchlist,
  onToggleFavorite,
  onVoteReview,
  onDeleteReview,
  onShare,
  username
}) {
  const [reviewSort, setReviewSort] = useState("helpful"); // 'helpful' | 'newest' | 'highest' | 'lowest'
  const [spoilerFilter, setSpoilerFilter] = useState("all"); // 'all' | 'safe' | 'spoilers'
  const [revealedSpoilers, setRevealedSpoilers] = useState({});

  if (!anime) return null;

  // Retrieve combined reviews (seeded + user submitted)
  const allReviews = getMergedReviewsForAnime(anime.id, anime.reviews || [], username);

  // Filter & Sort reviews
  const filteredReviews = allReviews
    .filter((rev) => {
      if (spoilerFilter === "safe") return !rev.containsSpoiler;
      if (spoilerFilter === "spoilers") return rev.containsSpoiler;
      return true;
    })
    .sort((a, b) => {
      if (reviewSort === "newest") {
        return new Date(b.date) - new Date(a.date);
      }
      if (reviewSort === "highest") {
        return b.rating - a.rating;
      }
      if (reviewSort === "lowest") {
        return a.rating - b.rating;
      }
      // 'helpful' default
      const votesA = (a.helpfulCount || 0) + (reviewVotes[a.id] === "helpful" ? 1 : 0);
      const votesB = (b.helpfulCount || 0) + (reviewVotes[b.id] === "helpful" ? 1 : 0);
      return votesB - votesA;
    });

  const toggleRevealSpoiler = (revId) => {
    setRevealedSpoilers((prev) => ({
      ...prev,
      [revId]: !prev[revId]
    }));
  };

  // Score distribution object (1 to 10)
  const dist = anime.scoreDistribution || {
    10: 50, 9: 25, 8: 12, 7: 6, 6: 3, 5: 2, 4: 1, 3: 0.4, 2: 0.3, 1: 0.3
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
          <X size={20} />
        </button>

        {/* Top Cinematic Backdrop Banner */}
        <div
          className="detail-banner"
          style={{ backgroundImage: `url(${anime.backdropImage || anime.posterImage})` }}
        >
          <div className="detail-banner-gradient" />

          {/* Banner content: poster + titles */}
          <div className="detail-banner-content">
            <img
              src={anime.posterImage}
              alt={anime.title}
              className="detail-poster-img"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80";
              }}
            />

            <div className="detail-banner-titles">
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <span className="badge badge-purple">{anime.type}</span>
                <span className="badge badge-gold">Rank #{anime.id % 25 + 1}</span>
                <span className="badge badge-glass">{anime.status}</span>
              </div>

              <h1 className="detail-title">{anime.title}</h1>
              {anime.japaneseTitle && (
                <div className="detail-jap-title">{anime.japaneseTitle}</div>
              )}

              {/* Action Buttons Row */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
                {anime.trailerYoutubeId && (
                  <button className="btn btn-imdb" onClick={() => onOpenTrailer(anime)}>
                    <Play size={16} fill="currentColor" /> Watch Trailer
                  </button>
                )}

                <button
                  className={`btn ${isFavorite ? "btn-primary" : "btn-secondary"}`}
                  style={{
                    background: isFavorite ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : undefined,
                    borderColor: isFavorite ? "#ef4444" : undefined
                  }}
                  onClick={() => onToggleFavorite(anime.id)}
                >
                  <Heart size={16} fill={isFavorite ? "currentColor" : "none"} color={isFavorite ? "#ffffff" : "#ef4444"} />
                  {isFavorite ? "Favorited ❤️" : "Favorite"}
                </button>

                <button
                  className={`btn ${inWatchlist ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => onToggleWatchlist(anime.id)}
                >
                  <Bookmark size={16} fill={inWatchlist ? "currentColor" : "none"} />
                  {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
                </button>

                <button className="btn btn-secondary" onClick={() => onShare(anime)}>
                  <Share2 size={16} /> Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="detail-body">
          {/* Metadata Bar */}
          <div className="detail-stats-bar">
            <div className="detail-stat-item">
              <span className="detail-stat-label">Studio</span>
              <span className="detail-stat-val">{anime.studio}</span>
            </div>
            <div className="detail-stat-item">
              <span className="detail-stat-label">Season & Year</span>
              <span className="detail-stat-val">{anime.season || anime.year}</span>
            </div>
            <div className="detail-stat-item">
              <span className="detail-stat-label">Format / Episodes</span>
              <span className="detail-stat-val">{anime.episodes}</span>
            </div>
            <div className="detail-stat-item">
              <span className="detail-stat-label">Duration</span>
              <span className="detail-stat-val">{anime.duration}</span>
            </div>
            <div className="detail-stat-item">
              <span className="detail-stat-label">Rating</span>
              <span className="detail-stat-val">{anime.ageRating}</span>
            </div>
          </div>

          {/* Synopsis & Genre Pills */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Synopsis</h3>
            <p style={{ color: "#cbd5e1", lineHeight: 1.7, fontSize: "1rem" }}>
              {anime.synopsis}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
              {anime.genres.map((g) => (
                <span key={g} className="badge badge-purple">
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* IMDb Score & 1-10 Rating Breakdown Histogram */}
          <div className="score-breakdown-card">
            {/* Left: Overall score & personal rating button */}
            <div className="score-main-col">
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                IMDb RATING
              </span>
              <div className="score-big-number">
                <Star size={36} fill="#f59e0b" color="#f59e0b" />
                <span>{anime.rating}</span>
                <span style={{ fontSize: "1.25rem", color: "var(--text-muted)", fontWeight: 500 }}>/10</span>
              </div>
              <div className="score-total-votes">
                {anime.ratingCount?.toLocaleString() || "250,000"} user ratings
              </div>

              {/* Personal Rating Status */}
              <div className="user-score-box">
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.25rem" }}>
                  YOUR RATING
                </div>
                {userRating ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "1.1rem" }}>
                      ★ {userRating}/10
                    </span>
                    <button
                      onClick={() => onOpenRating(anime)}
                      style={{ fontSize: "0.8rem", color: "var(--text-muted)", textDecoration: "underline" }}
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-outline-gold"
                    style={{ width: "100%", padding: "0.45rem", fontSize: "0.85rem" }}
                    onClick={() => onOpenRating(anime)}
                  >
                    <Star size={14} /> Rate This
                  </button>
                )}
              </div>
            </div>

            {/* Right: 10 to 1 Star Histogram Bars */}
            <div className="histogram-col">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff" }}>
                  Rating Distribution
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Breakdown by star
                </span>
              </div>

              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((stars) => {
                const pct = dist[stars] || 1;
                return (
                  <div key={stars} className="histogram-row">
                    <span className="hist-star-label">
                      {stars} <Star size={12} fill="#94a3b8" color="#94a3b8" />
                    </span>
                    <div className="hist-bar-track">
                      <div className="hist-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="hist-pct-label">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cast & Characters Showcase */}
          {anime.characters && anime.characters.length > 0 && (
            <div style={{ marginBottom: "2.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Top Cast & Characters</h3>
              <div className="characters-grid">
                {anime.characters.map((char, i) => (
                  <div key={i} className="character-card">
                    <div className="char-initials">
                      {char.name.charAt(0)}
                    </div>
                    <div className="char-info">
                      <div className="char-name">{char.name}</div>
                      <div className="char-sub">VA: {char.voiceActor}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Reviews Section */}
          <div style={{ marginTop: "3rem" }}>
            <div className="reviews-header-bar">
              <div>
                <h3 style={{ fontSize: "1.5rem", color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  User Reviews
                  <span className="badge badge-purple">{filteredReviews.length}</span>
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Verified member critiques and community discussions
                </p>
              </div>

              {/* Write a review button */}
              <button className="btn btn-imdb" onClick={() => onOpenReviewForm(anime)}>
                <MessageSquarePlus size={18} />
                Write a Review
              </button>
            </div>

            {/* Filter & Sort Controls for Reviews */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.85rem 1rem",
                background: "rgba(0,0,0,0.2)",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                marginBottom: "1.5rem",
                flexWrap: "wrap",
                gap: "0.75rem"
              }}
            >
              {/* Sort selector */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                <SlidersHorizontal size={16} color="var(--text-muted)" />
                <span style={{ color: "var(--text-muted)" }}>Sort by:</span>
                <select
                  className="select-control"
                  style={{ padding: "0.35rem 0.75rem" }}
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value)}
                >
                  <option value="helpful">Most Helpful</option>
                  <option value="newest">Newest</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>

              {/* Spoiler filter toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Spoilers:</span>
                <select
                  className="select-control"
                  style={{ padding: "0.35rem 0.75rem" }}
                  value={spoilerFilter}
                  onChange={(e) => setSpoilerFilter(e.target.value)}
                >
                  <option value="all">All Reviews</option>
                  <option value="safe">Hide Spoilers</option>
                  <option value="spoilers">Spoilers Only</option>
                </select>
              </div>
            </div>

            {/* Review Cards List */}
            {filteredReviews.length === 0 ? (
              <div
                style={{
                  padding: "3rem",
                  textAlign: "center",
                  background: "var(--bg-surface)",
                  borderRadius: "12px",
                  border: "1px dashed var(--border-subtle)"
                }}
              >
                <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
                  No reviews match your current filter. Be the first to share your thoughts!
                </p>
                <button className="btn btn-imdb" onClick={() => onOpenReviewForm(anime)}>
                  <MessageSquarePlus size={16} /> Write the First Review
                </button>
              </div>
            ) : (
              filteredReviews.map((review) => {
                const isRevealed = revealedSpoilers[review.id];
                const isVoted = reviewVotes[review.id] === "helpful";
                const totalHelpful = (review.helpfulCount || 0) + (isVoted ? 1 : 0);

                return (
                  <div key={review.id} className="review-card">
                    {/* Reviewer Header */}
                    <div className="review-card-top">
                      <div className="reviewer-meta">
                        <img
                          src={review.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                          alt={review.author}
                          className="reviewer-avatar"
                        />
                        <div>
                          <div className="reviewer-name">
                            {review.author}
                            {review.isUserSubmission && (
                              <span className="badge badge-cyan" style={{ marginLeft: "0.5rem", fontSize: "0.65rem" }}>
                                You
                              </span>
                            )}
                          </div>
                          <div className="review-date">{review.date}</div>
                        </div>
                      </div>

                      {/* Rating Pill */}
                      <div className="review-rating-pill">
                        <Star size={14} fill="#f59e0b" color="#f59e0b" />
                        <span>{review.rating}/10</span>
                      </div>
                    </div>

                    {/* Headline */}
                    <h4 className="review-headline">{review.title}</h4>

                    {/* Tags */}
                    {review.tags && review.tags.length > 0 && (
                      <div className="review-tags">
                        {review.tags.map((t) => (
                          <span key={t} className="review-tag">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Review Body with Spoiler Support */}
                    {review.containsSpoiler && !isRevealed ? (
                      <div
                        className="spoiler-container"
                        onClick={() => toggleRevealSpoiler(review.id)}
                        title="Click to reveal spoiler"
                      >
                        <div className="spoiler-warning-badge">
                          <AlertTriangle size={16} />
                          <span>WARNING: This review contains spoilers</span>
                        </div>
                        <div className="spoiler-text-blurred">
                          {review.content.slice(0, 180)}...
                        </div>
                        <div className="spoiler-click-hint" style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.5rem" }}>
                          <Eye size={14} /> Click anywhere to reveal spoiler content
                        </div>
                      </div>
                    ) : (
                      <div className="review-body-text">
                        {review.content}
                      </div>
                    )}

                    {/* Review Footer: Helpful votes & delete if user's own */}
                    <div className="review-footer">
                      <div className="helpful-vote-group">
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          Was this review helpful?
                        </span>
                        <button
                          className={`btn-vote ${isVoted ? "voted" : ""}`}
                          onClick={() => onVoteReview(review.id)}
                          title="Vote helpful"
                        >
                          <ThumbsUp size={14} />
                          <span>Helpful ({totalHelpful})</span>
                        </button>
                      </div>

                      {review.isUserSubmission && (
                        <button
                          className="btn-vote"
                          style={{ color: "#f87171" }}
                          onClick={() => onDeleteReview(review.id)}
                          title="Delete your review"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
