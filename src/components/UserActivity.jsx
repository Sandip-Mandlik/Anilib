import React, { useState, useMemo } from "react";
import {
  Star, MessageSquare, Bookmark, Trash2, Edit3, Clock,
  PlayCircle, Heart, Search, Share2, Plus, Eye, EyeOff, Sparkles,
  Trophy, ChevronRight, Settings, Grid, List, ThumbsUp,
  Check, AlertCircle, ArrowUpRight
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { PRESET_AVATARS, PRESET_AVATAR_NAMES } from "../services/auth";
import { AnimeCard } from "./AnimeCard";

export function UserActivity({
  activeSubTab = "overview", // 'overview' | 'favorites' | 'watchlist' | 'reviews' | 'ratings' | 'settings'
  onSubTabChange,
  userReviews = [],
  userRatings = {},
  watchlist = {},
  favorites = {},
  animeList = [],
  onOpenDetail,
  onOpenRating,
  onEditReview,
  onDeleteReview,
  onUpdateWatchlistStatus,
  onUpdateWatchlistProgress,
  onToggleFavorite,
  onOpenAuth,
  addToast,
}) {
  const { currentUser, updateProfile } = useAuth();

  // Active sub-tab state (syncs with prop if provided)
  const [currentTab, setCurrentTab] = useState(activeSubTab);

  // Sync state if activeSubTab prop changes from outside (e.g. Navbar click)
  React.useEffect(() => {
    if (activeSubTab) setCurrentTab(activeSubTab);
  }, [activeSubTab]);

  const switchTab = (tab) => {
    setCurrentTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  // ── Sub-filters & view modes ───────────────────────────────────────────────
  const [watchlistFilter, setWatchlistFilter] = useState("all"); // 'all' | 'watching' | 'plan' | 'completed' | 'on_hold' | 'dropped'
  const [watchlistSearch, setWatchlistSearch] = useState("");
  const [watchlistSort,   setWatchlistSort]   = useState("recent"); // 'recent' | 'title' | 'score' | 'progress'
  const [watchlistView,   setWatchlistView]   = useState("grid");   // 'grid' | 'table'

  const [favoritesSearch, setFavoritesSearch] = useState("");
  const [favoritesType,   setFavoritesType]   = useState("all");    // 'all' | 'Movie' | 'TV Series'
  const [favoritesSort,   setFavoritesSort]   = useState("rating"); // 'rating' | 'userRating' | 'title' | 'year'

  const [reviewsSearch,   setReviewsSearch]   = useState("");
  const [reviewsRatingFilter, setReviewsRatingFilter] = useState("all");
  const [revealedSpoilers, setRevealedSpoilers] = useState({});
  const [reviewToDelete, setReviewToDelete] = useState(null);

  const [ratingScoreFilter, setRatingScoreFilter] = useState(null); // null or 1-10

  // ── Profile Settings Form State ───────────────────────────────────────────
  const isGuest = !currentUser;
  const initialName = currentUser?.displayName || currentUser?.username || "Guest Otaku";
  const initialAvatar = currentUser?.avatar || PRESET_AVATARS[0];
  const initialBio = currentUser?.bio || "Anime enthusiast exploring legendary series and theatrical masterpieces on AniLib.";

  const [editName, setEditName] = useState(initialName);
  const [editAvatar, setEditAvatar] = useState(initialAvatar);
  const [editBio, setEditBio] = useState(initialBio);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [profileSavedFeedback, setProfileSavedFeedback] = useState(false);

  // Sync settings when currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.displayName || currentUser.username || "");
      setEditAvatar(currentUser.avatar || PRESET_AVATARS[0]);
      setEditBio(currentUser.bio || initialBio);
    }
  }, [currentUser]);

  // ── Derived Data & Statistics ─────────────────────────────────────────────
  const ratedAnimeIds = Object.keys(userRatings);
  const totalRated = ratedAnimeIds.length;
  const avgRating = totalRated > 0
    ? (ratedAnimeIds.reduce((sum, id) => sum + (Number(userRatings[id]) || 0), 0) / totalRated).toFixed(1)
    : "—";

  // Score distribution histogram (10 down to 1)
  const scoreCounts = useMemo(() => {
    const counts = { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratedAnimeIds.forEach((id) => {
      const score = Math.round(Number(userRatings[id]));
      if (counts[score] !== undefined) counts[score] += 1;
    });
    return counts;
  }, [userRatings, ratedAnimeIds]);

  // Watchlist Items with parsed episodes
  const watchlistEntries = useMemo(() => {
    return Object.entries(watchlist).map(([id, data]) => {
      const anime = animeList.find((a) => Number(a.id) === Number(id));
      if (!anime) return null;
      const totalEps = parseInt(anime.episodes?.match(/\d+/)?.[0] || (anime.type === "Movie" ? "1" : "12"), 10);
      return {
        animeId: id,
        status: data.status || "plan",
        progress: Number(data.progress) || (data.status === "completed" ? totalEps : 0),
        notes: data.notes || "",
        totalEps,
        updatedAt: data.updatedAt,
        anime,
      };
    }).filter(Boolean);
  }, [watchlist, animeList]);

  // Status counts
  const watchlistCounts = useMemo(() => {
    return {
      all: watchlistEntries.length,
      watching: watchlistEntries.filter((w) => w.status === "watching").length,
      plan: watchlistEntries.filter((w) => w.status === "plan").length,
      completed: watchlistEntries.filter((w) => w.status === "completed").length,
      on_hold: watchlistEntries.filter((w) => w.status === "on_hold").length,
      dropped: watchlistEntries.filter((w) => w.status === "dropped").length,
    };
  }, [watchlistEntries]);

  // Estimated Watch Time (calculated in hours & days from watched episodes)
  const totalWatchTimeHours = useMemo(() => {
    let totalMinutes = 0;
    watchlistEntries.forEach((item) => {
      if (item.status === "completed") {
        totalMinutes += item.totalEps * 24;
      } else {
        totalMinutes += (item.progress || 0) * 24;
      }
    });
    return Math.round(totalMinutes / 60);
  }, [watchlistEntries]);

  const watchTimeDisplay = totalWatchTimeHours > 24
    ? `${(totalWatchTimeHours / 24).toFixed(1)} Days (${totalWatchTimeHours} hrs)`
    : `${totalWatchTimeHours} Hours`;

  // Favorited anime list
  const favoritedAnime = useMemo(() => {
    return Object.keys(favorites)
      .map((id) => animeList.find((a) => Number(a.id) === Number(id)))
      .filter(Boolean);
  }, [favorites, animeList]);

  // Top Genre Affinity
  const topGenre = useMemo(() => {
    const genreTally = {};
    favoritedAnime.forEach((a) => {
      a.genres?.forEach((g) => { genreTally[g] = (genreTally[g] || 0) + 2; });
    });
    ratedAnimeIds.forEach((id) => {
      const a = animeList.find((item) => Number(item.id) === Number(id));
      if (a && userRatings[id] >= 8) {
        a.genres?.forEach((g) => { genreTally[g] = (genreTally[g] || 0) + 1; });
      }
    });
    const sorted = Object.entries(genreTally).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "Action & Drama";
  }, [favoritedAnime, ratedAnimeIds, animeList, userRatings]);

  // Total helpful votes received on reviews
  const totalHelpfulVotes = useMemo(() => {
    return userReviews.reduce((sum, r) => sum + (Number(r.helpfulCount) || 0), 0);
  }, [userReviews]);

  // ── Filtered & Sorted Watchlist ───────────────────────────────────────────
  const filteredWatchlist = useMemo(() => {
    const q = watchlistSearch.toLowerCase().trim();
    return watchlistEntries
      .filter((item) => {
        if (watchlistFilter !== "all" && item.status !== watchlistFilter) return false;
        if (q && !item.anime.title.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        if (watchlistSort === "recent") return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        if (watchlistSort === "title") return a.anime.title.localeCompare(b.anime.title);
        if (watchlistSort === "score") return (b.anime.rating || 0) - (a.anime.rating || 0);
        if (watchlistSort === "progress") return (b.progress / (b.totalEps || 1)) - (a.progress / (a.totalEps || 1));
        return 0;
      });
  }, [watchlistEntries, watchlistFilter, watchlistSearch, watchlistSort]);

  // ── Filtered & Sorted Favorites ───────────────────────────────────────────
  const filteredFavorites = useMemo(() => {
    const q = favoritesSearch.toLowerCase().trim();
    return favoritedAnime
      .filter((anime) => {
        if (favoritesType !== "all" && anime.type !== favoritesType) return false;
        if (q && !anime.title.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        if (favoritesSort === "rating") return b.rating - a.rating;
        if (favoritesSort === "userRating") return (userRatings[b.id] || 0) - (userRatings[a.id] || 0);
        if (favoritesSort === "title") return a.title.localeCompare(b.title);
        if (favoritesSort === "year") return (b.year || 0) - (a.year || 0);
        return 0;
      });
  }, [favoritedAnime, favoritesSearch, favoritesType, favoritesSort, userRatings]);

  // ── Filtered Reviews ──────────────────────────────────────────────────────
  const filteredReviews = useMemo(() => {
    const q = reviewsSearch.toLowerCase().trim();
    return userReviews.filter((rev) => {
      if (reviewsRatingFilter !== "all") {
        if (Number(rev.rating) !== Number(reviewsRatingFilter)) return false;
      }
      if (q) {
        const inTitle = rev.title?.toLowerCase().includes(q);
        const inContent = rev.content?.toLowerCase().includes(q);
        const inAnime = rev.animeTitle?.toLowerCase().includes(q);
        if (!inTitle && !inContent && !inAnime) return false;
      }
      return true;
    });
  }, [userReviews, reviewsSearch, reviewsRatingFilter]);

  // ── Filtered Ratings List ─────────────────────────────────────────────────
  const filteredRatingsList = useMemo(() => {
    return ratedAnimeIds
      .map((id) => {
        const anime = animeList.find((a) => Number(a.id) === Number(id));
        const score = userRatings[id];
        return { id, anime, score };
      })
      .filter((item) => item.anime)
      .filter((item) => {
        if (ratingScoreFilter !== null && Math.round(item.score) !== ratingScoreFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.score - a.score);
  }, [ratedAnimeIds, animeList, userRatings, ratingScoreFilter]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleProgressIncrement = (animeId, currentProg, totalEps) => {
    const nextProg = Math.min((currentProg || 0) + 1, totalEps || 9999);
    if (onUpdateWatchlistProgress) {
      onUpdateWatchlistProgress(animeId, nextProg, totalEps);
    }
  };

  const handleToggleSpoiler = (id) => {
    setRevealedSpoilers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShareFavorites = () => {
    const favTitles = favoritedAnime.slice(0, 10).map((a, i) => `${i + 1}. ${a.title} (★ ${a.rating})`).join("\n");
    const shareText = `My Top Anime Favorites on AniLib:\n${favTitles}\n\nCheck out AniLib for rankings and reviews!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      if (addToast) addToast("Copied your Favorites list to clipboard!", "success");
    }
  };

  const handleSaveProfileSettings = (e) => {
    e.preventDefault();
    const finalAvatar = customAvatarUrl.trim() || editAvatar;
    if (updateProfile) {
      updateProfile({
        displayName: editName.trim() || (currentUser?.username || "Otaku"),
        bio: editBio.trim(),
        avatar: finalAvatar,
      });
    }
    setProfileSavedFeedback(true);
    if (addToast) addToast("Profile updated successfully!", "success");
    setTimeout(() => setProfileSavedFeedback(false), 3000);
  };

  return (
    <div className="container" style={{ padding: "2rem 1.5rem" }}>

      {/* ── Guest Encouragement Banner ── */}
      {isGuest && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.12) 100%)",
            border: "1px solid rgba(139, 92, 246, 0.35)",
            borderRadius: "16px",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            boxShadow: "0 8px 32px rgba(139, 92, 246, 0.12)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "var(--accent-purple)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <Sparkles size={22} color="#fff" />
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem" }}>
                You're viewing the Profile as a Guest
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                Your favorites, watchlist, and ratings are currently saved in this browser. Create a free account to back up and sync across all your devices!
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              className="btn btn-secondary"
              style={{ padding: "0.45rem 0.9rem", fontSize: "0.85rem" }}
              onClick={() => onOpenAuth && onOpenAuth("login")}
            >
              Sign In
            </button>
            <button
              className="btn btn-primary"
              style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
              onClick={() => onOpenAuth && onOpenAuth("signup")}
            >
              <Sparkles size={14} /> Join Free
            </button>
          </div>
        </div>
      )}

      {/* ── Main Profile Banner ── */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(26, 31, 46, 0.9) 0%, var(--bg-surface) 100%)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "20px",
          padding: "2rem",
          marginBottom: "2rem",
          boxShadow: "var(--shadow-md)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Subtle decorative glow in top right */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "260px",
            height: "260px",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)",
            pointerEvents: "none"
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.75rem", position: "relative", zIndex: 1 }}>
          {/* User Avatar + Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ position: "relative" }}>
              <img
                src={currentUser?.avatar || initialAvatar}
                alt={initialName}
                onError={(e) => { e.target.src = "/avatars/tanjiro.jpg"; }}
                style={{
                  width: "82px",
                  height: "82px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid var(--accent-purple)",
                  boxShadow: "0 0 24px rgba(139, 92, 246, 0.45)"
                }}
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";
                }}
              />
              <button
                onClick={() => switchTab("settings")}
                title="Change Avatar"
                style={{
                  position: "absolute",
                  bottom: "0",
                  right: "0",
                  background: "var(--accent-purple)",
                  border: "2px solid #0f172a",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  cursor: "pointer"
                }}
              >
                <Edit3 size={13} />
              </button>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "1.75rem", color: "#ffffff", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  {currentUser?.displayName || currentUser?.username || "Guest Otaku"}
                </h2>
                <span className="badge badge-gold">
                  {currentUser?.badge || "Anime Connoisseur"}
                </span>
                {isGuest && (
                  <span className="badge badge-purple" style={{ fontSize: "0.68rem" }}>
                    Guest Mode
                  </span>
                )}
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "0.25rem", maxWidth: "520px", lineHeight: 1.5 }}>
                {currentUser?.bio || initialBio}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                <span>⛩️ Member since {currentUser?.joined || "2024"}</span>
                <span>•</span>
                <span>Affinity: <strong style={{ color: "var(--accent-gold)" }}>{topGenre}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Stat Tiles */}
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
            <div
              onClick={() => switchTab("favorites")}
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "14px",
                padding: "0.85rem 1.15rem",
                textAlign: "center",
                cursor: "pointer",
                minWidth: "85px",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, color: "#ef4444" }}>
                {favoritedAnime.length}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginTop: "2px" }}>
                Favorites
              </div>
            </div>

            <div
              onClick={() => switchTab("watchlist")}
              style={{
                background: "rgba(168, 85, 247, 0.08)",
                border: "1px solid rgba(168, 85, 247, 0.2)",
                borderRadius: "14px",
                padding: "0.85rem 1.15rem",
                textAlign: "center",
                cursor: "pointer",
                minWidth: "85px",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-purple)" }}>
                {watchlistCounts.all}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginTop: "2px" }}>
                Watchlist
              </div>
            </div>

            <div
              onClick={() => switchTab("reviews")}
              style={{
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                borderRadius: "14px",
                padding: "0.85rem 1.15rem",
                textAlign: "center",
                cursor: "pointer",
                minWidth: "85px",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-gold)" }}>
                {userReviews.length}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginTop: "2px" }}>
                Reviews
              </div>
            </div>

            <div
              onClick={() => switchTab("ratings")}
              style={{
                background: "rgba(56, 189, 248, 0.08)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: "14px",
                padding: "0.85rem 1.15rem",
                textAlign: "center",
                cursor: "pointer",
                minWidth: "85px",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, color: "#38bdf8" }}>
                {avgRating} <span style={{ fontSize: "0.95rem" }}>★</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginTop: "2px" }}>
                {totalRated} Rated
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation Navigation Bar ── */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: "2rem",
          flexWrap: "wrap",
          overflowX: "auto"
        }}
      >
        <button
          className={`type-toggle-btn ${currentTab === "overview" ? "active" : ""}`}
          style={{ borderRadius: "10px 10px 0 0", padding: "0.75rem 1.4rem" }}
          onClick={() => switchTab("overview")}
        >
          <Sparkles size={16} style={{ marginRight: "0.45rem", verticalAlign: "middle" }} />
          Overview
        </button>

        <button
          className={`type-toggle-btn ${currentTab === "favorites" ? "active" : ""}`}
          style={{
            borderRadius: "10px 10px 0 0",
            padding: "0.75rem 1.4rem",
            background: currentTab === "favorites" ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : undefined,
            color: currentTab === "favorites" ? "#ffffff" : undefined
          }}
          onClick={() => switchTab("favorites")}
        >
          <Heart
            size={16}
            fill={currentTab === "favorites" ? "#ffffff" : (favoritedAnime.length > 0 ? "#ef4444" : "none")}
            color={currentTab === "favorites" ? "#ffffff" : "#ef4444"}
            style={{ marginRight: "0.45rem", verticalAlign: "middle" }}
          />
          Favorites ({favoritedAnime.length})
        </button>

        <button
          className={`type-toggle-btn ${currentTab === "watchlist" ? "active" : ""}`}
          style={{ borderRadius: "10px 10px 0 0", padding: "0.75rem 1.4rem" }}
          onClick={() => switchTab("watchlist")}
        >
          <Bookmark size={16} style={{ marginRight: "0.45rem", verticalAlign: "middle" }} />
          Watchlist ({watchlistCounts.all})
        </button>

        <button
          className={`type-toggle-btn ${currentTab === "reviews" ? "active" : ""}`}
          style={{ borderRadius: "10px 10px 0 0", padding: "0.75rem 1.4rem" }}
          onClick={() => switchTab("reviews")}
        >
          <MessageSquare size={16} style={{ marginRight: "0.45rem", verticalAlign: "middle" }} />
          My Reviews ({userReviews.length})
        </button>

        <button
          className={`type-toggle-btn ${currentTab === "ratings" ? "active" : ""}`}
          style={{ borderRadius: "10px 10px 0 0", padding: "0.75rem 1.4rem" }}
          onClick={() => switchTab("ratings")}
        >
          <Star size={16} style={{ marginRight: "0.45rem", verticalAlign: "middle" }} />
          My Ratings ({totalRated})
        </button>

        <button
          className={`type-toggle-btn ${currentTab === "settings" ? "active" : ""}`}
          style={{ borderRadius: "10px 10px 0 0", padding: "0.75rem 1.4rem" }}
          onClick={() => switchTab("settings")}
        >
          <Settings size={16} style={{ marginRight: "0.45rem", verticalAlign: "middle" }} />
          Profile Settings
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW DASHBOARD
         ══════════════════════════════════════════════════════════════════════ */}
      {currentTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {/* Quick Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>TIME INVESTED</span>
                <Clock size={18} color="var(--accent-purple)" />
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", fontFamily: "var(--font-display)" }}>
                {watchTimeDisplay}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Across completed series and active watchlist
              </div>
            </div>

            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>CURRENT WATCHING</span>
                <PlayCircle size={18} color="#38bdf8" />
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#38bdf8", fontFamily: "var(--font-display)" }}>
                {watchlistCounts.watching} <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 400 }}>series active</span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {watchlistCounts.completed} completed • {watchlistCounts.plan} planned
              </div>
            </div>

            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>CRITIQUE IMPACT</span>
                <ThumbsUp size={18} color="var(--accent-gold)" />
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-gold)", fontFamily: "var(--font-display)" }}>
                {totalHelpfulVotes} <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 400 }}>helpful votes</span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Across {userReviews.length} community reviews published
              </div>
            </div>

            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>FAVORITE GENRE</span>
                <Trophy size={18} color="#ef4444" />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ef4444", fontFamily: "var(--font-display)" }}>
                {topGenre}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Based on your ratings & favorited library
              </div>
            </div>
          </div>

          {/* Currently Watching Shelf */}
          {watchlistCounts.watching > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.25rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <PlayCircle size={20} color="#38bdf8" /> Currently Watching
                </h3>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: "0.85rem", color: "var(--accent-purple)" }}
                  onClick={() => { setWatchlistFilter("watching"); switchTab("watchlist"); }}
                >
                  View All ({watchlistCounts.watching}) <ChevronRight size={14} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {watchlistEntries.filter((w) => w.status === "watching").slice(0, 3).map((item) => (
                  <div
                    key={item.animeId}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "14px",
                      padding: "1rem",
                      display: "flex",
                      gap: "1rem",
                      alignItems: "center"
                    }}
                  >
                    <img
                      src={item.anime.posterImage}
                      alt={item.anime.title}
                      style={{ width: "55px", height: "80px", objectFit: "cover", borderRadius: "8px", flexShrink: 0, cursor: "pointer" }}
                      onClick={() => onOpenDetail(item.anime)}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h4
                        style={{ fontSize: "0.95rem", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer" }}
                        onClick={() => onOpenDetail(item.anime)}
                      >
                        {item.anime.title}
                      </h4>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                        <span>Ep {item.progress} of {item.totalEps}</span>
                        <span style={{ color: "var(--accent-gold)" }}>★ {item.anime.rating}</span>
                      </div>
                      {/* Mini progress bar */}
                      <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "4px", height: "6px", width: "100%", marginTop: "0.4rem", overflow: "hidden" }}>
                        <div
                          style={{
                            background: "linear-gradient(90deg, #38bdf8, var(--accent-purple))",
                            height: "100%",
                            width: `${Math.min(100, (item.progress / (item.totalEps || 1)) * 100)}%`,
                            transition: "width 0.3s ease"
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}
                          onClick={() => handleProgressIncrement(item.animeId, item.progress, item.totalEps)}
                          title="Watched +1 Episode"
                        >
                          <Plus size={12} /> +1 Ep
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Favorites Shelf */}
          {favoritedAnime.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.25rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Heart size={20} color="#ef4444" fill="#ef4444" /> Top Favorites
                </h3>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: "0.85rem", color: "#ef4444" }}
                  onClick={() => switchTab("favorites")}
                >
                  View All ({favoritedAnime.length}) <ChevronRight size={14} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {favoritedAnime.slice(0, 4).map((anime) => (
                  <div
                    key={anime.id}
                    className="anime-card"
                    style={{ cursor: "pointer" }}
                    onClick={() => onOpenDetail(anime)}
                  >
                    <div className="anime-card-poster-wrap" style={{ height: "260px" }}>
                      <img src={anime.posterImage} alt={anime.title} className="anime-card-poster" />
                      <div className="anime-card-badges">
                        <span className="badge badge-purple">{anime.type}</span>
                        <span className="badge badge-gold">★ {anime.rating}</span>
                      </div>
                    </div>
                    <div className="anime-card-body" style={{ padding: "0.75rem" }}>
                      <h4 className="anime-card-title" style={{ fontSize: "0.92rem" }}>{anime.title}</h4>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{anime.year}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rating Histogram Preview */}
          {totalRated > 0 && (
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "1.75rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Star size={18} color="#f59e0b" fill="#f59e0b" /> Score Distribution
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Mean score: <strong style={{ color: "#fff" }}>{avgRating}/10</strong> across {totalRated} ratings
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                  onClick={() => switchTab("ratings")}
                >
                  Manage Ratings
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((score) => {
                  const count = scoreCounts[score] || 0;
                  const pct = totalRated > 0 ? (count / totalRated) * 100 : 0;
                  return (
                    <div key={score} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.82rem" }}>
                      <span style={{ width: "24px", color: "var(--accent-gold)", fontWeight: 700, textAlign: "right" }}>
                        {score}★
                      </span>
                      <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            background: score >= 9 ? "#f59e0b" : score >= 7 ? "var(--accent-purple)" : "#64748b",
                            height: "100%",
                            width: `${pct}%`,
                            borderRadius: "4px",
                            transition: "width 0.4s ease"
                          }}
                        />
                      </div>
                      <span style={{ width: "45px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        {count} ({Math.round(pct)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: FAVORITES
         ══════════════════════════════════════════════════════════════════════ */}
      {currentTab === "favorites" && (
        <div>
          {/* Controls bar: Search, Format Filter, Sort, Share */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "14px",
              padding: "1rem 1.25rem",
              marginBottom: "1.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem"
            }}
          >
            {/* Search within favorites */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "220px" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
                <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Search favorites..."
                  value={favoritesSearch}
                  onChange={(e) => setFavoritesSearch(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: "2.25rem", height: "38px", fontSize: "0.85rem", width: "100%" }}
                />
              </div>

              {/* Format Filter */}
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button
                  className={`genre-chip ${favoritesType === "all" ? "active" : ""}`}
                  style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                  onClick={() => setFavoritesType("all")}
                >
                  All ({favoritedAnime.length})
                </button>
                <button
                  className={`genre-chip ${favoritesType === "TV Series" ? "active" : ""}`}
                  style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                  onClick={() => setFavoritesType("TV Series")}
                >
                  TV Series
                </button>
                <button
                  className={`genre-chip ${favoritesType === "Movie" ? "active" : ""}`}
                  style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                  onClick={() => setFavoritesType("Movie")}
                >
                  Movies
                </button>
              </div>
            </div>

            {/* Sort & Share */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <select
                className="select-control"
                value={favoritesSort}
                onChange={(e) => setFavoritesSort(e.target.value)}
                style={{ fontSize: "0.82rem", padding: "0.4rem 0.75rem" }}
              >
                <option value="rating">Sort: Community Rating</option>
                <option value="userRating">Sort: My Rating</option>
                <option value="title">Sort: Title (A-Z)</option>
                <option value="year">Sort: Release Year</option>
              </select>

              {favoritedAnime.length > 0 && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: "0.4rem 0.85rem", fontSize: "0.82rem" }}
                  onClick={handleShareFavorites}
                  title="Share My Favorites list"
                >
                  <Share2 size={14} /> Share List
                </button>
              )}
            </div>
          </div>

          {filteredFavorites.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4.5rem 2rem", background: "var(--bg-surface)", borderRadius: "16px", border: "1px dashed var(--border-subtle)" }}>
              <Heart size={52} color="#ef4444" style={{ margin: "0 auto 1.25rem" }} />
              <h3 style={{ color: "#ffffff", fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                {favoritesSearch ? `No favorites found matching "${favoritesSearch}"` : "No favorite anime yet"}
              </h3>
              <p style={{ color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                Click the ❤️ heart icon on any anime card or detail modal across AniLib to build your personal hall of fame!
              </p>
            </div>
          ) : (
            <div className="anime-grid">
              {filteredFavorites.map((anime) => (
                <div key={anime.id} style={{ position: "relative" }}>
                  <AnimeCard
                    anime={anime}
                    userRating={userRatings[anime.id]}
                    inWatchlist={Boolean(watchlist[anime.id])}
                    isFavorite={true}
                    onOpenDetail={onOpenDetail}
                    onOpenRating={onOpenRating}
                    onOpenTrailer={() => {}}
                    onToggleWatchlist={() => onUpdateWatchlistStatus(anime.id, watchlist[anime.id] ? null : "plan")}
                    onToggleFavorite={onToggleFavorite}
                  />
                  {/* Status selector directly on favorite card */}
                  <div
                    style={{
                      background: "rgba(15, 23, 42, 0.9)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "0 0 12px 12px",
                      padding: "0.45rem 0.75rem",
                      marginTop: "-6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.78rem"
                    }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>Watchlist:</span>
                    <select
                      className="select-control"
                      style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", height: "auto" }}
                      value={watchlist[anime.id]?.status || ""}
                      onChange={(e) => onUpdateWatchlistStatus(anime.id, e.target.value)}
                    >
                      <option value="">(Not in list)</option>
                      <option value="watching">▶ Watching</option>
                      <option value="plan">📅 Plan</option>
                      <option value="completed">✓ Completed</option>
                      <option value="on_hold">⏸ On Hold</option>
                      <option value="dropped">⏹ Dropped</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: WATCHLIST (Rich Filters, Progress Tracker & Table View)
         ══════════════════════════════════════════════════════════════════════ */}
      {currentTab === "watchlist" && (
        <div>
          {/* Watchlist Status Tabs */}
          <div style={{ display: "flex", gap: "0.45rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <button
              className={`genre-chip ${watchlistFilter === "all" ? "active" : ""}`}
              onClick={() => setWatchlistFilter("all")}
            >
              All ({watchlistCounts.all})
            </button>
            <button
              className={`genre-chip ${watchlistFilter === "watching" ? "active" : ""}`}
              onClick={() => setWatchlistFilter("watching")}
            >
              ▶ Watching ({watchlistCounts.watching})
            </button>
            <button
              className={`genre-chip ${watchlistFilter === "plan" ? "active" : ""}`}
              onClick={() => setWatchlistFilter("plan")}
            >
              📅 Plan to Watch ({watchlistCounts.plan})
            </button>
            <button
              className={`genre-chip ${watchlistFilter === "completed" ? "active" : ""}`}
              onClick={() => setWatchlistFilter("completed")}
            >
              ✓ Completed ({watchlistCounts.completed})
            </button>
            <button
              className={`genre-chip ${watchlistFilter === "on_hold" ? "active" : ""}`}
              onClick={() => setWatchlistFilter("on_hold")}
            >
              ⏸ On Hold ({watchlistCounts.on_hold})
            </button>
            <button
              className={`genre-chip ${watchlistFilter === "dropped" ? "active" : ""}`}
              onClick={() => setWatchlistFilter("dropped")}
            >
              ⏹ Dropped ({watchlistCounts.dropped})
            </button>
          </div>

          {/* Sub-toolbar: Search, Sort, View Toggle */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "14px",
              padding: "0.85rem 1.25rem",
              marginBottom: "1.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem"
            }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: "220px", maxWidth: "340px" }}>
              <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Filter watchlist..."
                value={watchlistSearch}
                onChange={(e) => setWatchlistSearch(e.target.value)}
                className="search-input"
                style={{ paddingLeft: "2.25rem", height: "38px", fontSize: "0.85rem", width: "100%" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <select
                className="select-control"
                value={watchlistSort}
                onChange={(e) => setWatchlistSort(e.target.value)}
                style={{ fontSize: "0.82rem", padding: "0.4rem 0.75rem" }}
              >
                <option value="recent">Sort: Recently Updated</option>
                <option value="title">Sort: Title (A-Z)</option>
                <option value="score">Sort: Community Score</option>
                <option value="progress">Sort: Progress %</option>
              </select>

              {/* View Switcher: Grid vs Table */}
              <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: "8px", padding: "2px" }}>
                <button
                  className="btn-icon"
                  style={{
                    width: "32px",
                    height: "32px",
                    background: watchlistView === "grid" ? "var(--accent-purple)" : "transparent",
                    color: watchlistView === "grid" ? "#fff" : "var(--text-muted)"
                  }}
                  onClick={() => setWatchlistView("grid")}
                  title="Grid View"
                >
                  <Grid size={15} />
                </button>
                <button
                  className="btn-icon"
                  style={{
                    width: "32px",
                    height: "32px",
                    background: watchlistView === "table" ? "var(--accent-purple)" : "transparent",
                    color: watchlistView === "table" ? "#fff" : "var(--text-muted)"
                  }}
                  onClick={() => setWatchlistView("table")}
                  title="Table View"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {filteredWatchlist.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4.5rem 2rem", background: "var(--bg-surface)", borderRadius: "16px", border: "1px dashed var(--border-subtle)" }}>
              <Bookmark size={52} color="var(--accent-purple)" style={{ margin: "0 auto 1.25rem" }} />
              <h3 style={{ color: "#ffffff", fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                {watchlistSearch ? `No titles found matching "${watchlistSearch}"` : "No titles in this list"}
              </h3>
              <p style={{ color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                Bookmark anime to build your queue, track watched episodes, and monitor your anime journey!
              </p>
            </div>
          ) : watchlistView === "grid" ? (
            /* ── GRID VIEW WITH EPISODE PROGRESS TRACKER ── */
            <div className="anime-grid">
              {filteredWatchlist.map(({ animeId, status, progress, totalEps, anime }) => {
                const pct = Math.min(100, Math.round((progress / (totalEps || 1)) * 100));
                return (
                  <div
                    key={animeId}
                    className="anime-card"
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <div
                      className="anime-card-poster-wrap"
                      onClick={() => onOpenDetail(anime)}
                      style={{ cursor: "pointer" }}
                    >
                      <img src={anime.posterImage} alt={anime.title} className="anime-card-poster" />
                      <div className="anime-card-badges">
                        <span className="badge badge-purple">{anime.type}</span>
                        <span className="badge badge-gold">★ {anime.rating}</span>
                      </div>
                    </div>

                    <div className="anime-card-body" style={{ display: "flex", flexDirection: "column", flex: 1, padding: "0.85rem" }}>
                      <h4
                        className="anime-card-title"
                        style={{ fontSize: "0.95rem", cursor: "pointer" }}
                        onClick={() => onOpenDetail(anime)}
                      >
                        {anime.title}
                      </h4>

                      {/* Episode Progress Slider & Quick +1 */}
                      <div style={{ marginTop: "0.75rem", background: "rgba(255,255,255,0.03)", padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem" }}>
                          <span style={{ color: "var(--text-secondary)" }}>
                            Ep <strong style={{ color: "#fff" }}>{progress}</strong> / {totalEps}
                          </span>
                          <span style={{ color: pct >= 100 ? "#22c55e" : "var(--accent-purple)", fontWeight: 700 }}>
                            {pct}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "4px", height: "6px", width: "100%", margin: "0.4rem 0", overflow: "hidden" }}>
                          <div
                            style={{
                              background: pct >= 100 ? "#22c55e" : "linear-gradient(90deg, #38bdf8, var(--accent-purple))",
                              height: "100%",
                              width: `${pct}%`,
                              transition: "width 0.3s ease"
                            }}
                          />
                        </div>

                        {/* Quick Progress Buttons */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.4rem" }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "0.2rem 0.55rem", fontSize: "0.72rem" }}
                            onClick={() => onOpenRating(anime)}
                          >
                            <Star size={11} color="var(--accent-gold)" /> Rate
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "0.2rem 0.65rem", fontSize: "0.75rem", background: "rgba(139, 92, 246, 0.2)", borderColor: "var(--accent-purple)" }}
                            onClick={() => handleProgressIncrement(animeId, progress, totalEps)}
                            title="Increment watched episode by 1"
                          >
                            <Plus size={12} /> +1 Ep
                          </button>
                        </div>
                      </div>

                      {/* Status Selector Dropdown */}
                      <div style={{ marginTop: "0.75rem" }}>
                        <select
                          className="select-control"
                          style={{ width: "100%", fontSize: "0.78rem", padding: "0.35rem 0.6rem" }}
                          value={status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onUpdateWatchlistStatus(animeId, e.target.value)}
                        >
                          <option value="watching">▶ Currently Watching</option>
                          <option value="plan">📅 Plan to Watch</option>
                          <option value="completed">✓ Completed</option>
                          <option value="on_hold">⏸ On Hold</option>
                          <option value="dropped">⏹ Dropped</option>
                          <option value="">✕ Remove from Watchlist</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── DETAILED TABLE VIEW ── */
            <div style={{ background: "var(--bg-surface)", borderRadius: "14px", border: "1px solid var(--border-subtle)", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "1rem" }}>Anime</th>
                    <th style={{ padding: "1rem" }}>Status</th>
                    <th style={{ padding: "1rem" }}>Progress</th>
                    <th style={{ padding: "1rem" }}>Score</th>
                    <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWatchlist.map(({ animeId, status, progress, totalEps, anime }) => (
                    <tr key={animeId} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
                        <img
                          src={anime.posterImage}
                          alt={anime.title}
                          style={{ width: "42px", height: "60px", objectFit: "cover", borderRadius: "6px", cursor: "pointer" }}
                          onClick={() => onOpenDetail(anime)}
                        />
                        <div>
                          <div
                            style={{ color: "#fff", fontWeight: 600, cursor: "pointer" }}
                            onClick={() => onOpenDetail(anime)}
                          >
                            {anime.title}
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {anime.type} • {anime.year}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: "0.85rem 1rem" }}>
                        <select
                          className="select-control"
                          style={{ fontSize: "0.78rem", padding: "0.3rem 0.5rem" }}
                          value={status}
                          onChange={(e) => onUpdateWatchlistStatus(animeId, e.target.value)}
                        >
                          <option value="watching">▶ Watching</option>
                          <option value="plan">📅 Plan</option>
                          <option value="completed">✓ Completed</option>
                          <option value="on_hold">⏸ On Hold</option>
                          <option value="dropped">⏹ Dropped</option>
                        </select>
                      </td>

                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span style={{ color: "#fff", fontWeight: 600, minWidth: "55px" }}>
                            {progress}/{totalEps}
                          </span>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "0.2rem 0.5rem", fontSize: "0.72rem" }}
                            onClick={() => handleProgressIncrement(animeId, progress, totalEps)}
                          >
                            +1 Ep
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--accent-gold)" }}>
                          <Star size={13} fill="#f59e0b" color="#f59e0b" />
                          <span>{anime.rating}</span>
                        </div>
                      </td>

                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <button
                          className="btn-icon"
                          style={{ width: "32px", height: "32px", color: "#f87171" }}
                          onClick={() => onUpdateWatchlistStatus(animeId, null)}
                          title="Remove from watchlist"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: MY WRITTEN REVIEWS (Edit, Delete Confirmation, Spoilers)
         ══════════════════════════════════════════════════════════════════════ */}
      {currentTab === "reviews" && (
        <div>
          {/* Controls Bar: Search & Rating Filter */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "14px",
              padding: "0.85rem 1.25rem",
              marginBottom: "1.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem"
            }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: "220px", maxWidth: "340px" }}>
              <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search reviews..."
                value={reviewsSearch}
                onChange={(e) => setReviewsSearch(e.target.value)}
                className="search-input"
                style={{ paddingLeft: "2.25rem", height: "38px", fontSize: "0.85rem", width: "100%" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Score filter:</span>
              <select
                className="select-control"
                value={reviewsRatingFilter}
                onChange={(e) => setReviewsRatingFilter(e.target.value)}
                style={{ fontSize: "0.82rem", padding: "0.4rem 0.75rem" }}
              >
                <option value="all">All Scores ({userReviews.length})</option>
                <option value="10">10★ Masterpiece</option>
                <option value="9">9★ Great</option>
                <option value="8">8★ Very Good</option>
                <option value="7">7★ Good</option>
                <option value="6">6★ Fine</option>
              </select>
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4.5rem 2rem", background: "var(--bg-surface)", borderRadius: "16px", border: "1px dashed var(--border-subtle)" }}>
              <MessageSquare size={52} color="var(--text-muted)" style={{ margin: "0 auto 1.25rem" }} />
              <h3 style={{ color: "#ffffff", fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                {reviewsSearch ? `No reviews found matching "${reviewsSearch}"` : "You haven't written any reviews yet"}
              </h3>
              <p style={{ color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                Select any anime series or movie from the Explore tab and share your thoughts, critiques, and scores with the community!
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {filteredReviews.map((rev) => {
                const anime = animeList.find((a) => Number(a.id) === Number(rev.animeId));
                const isSpoilerRevealed = revealedSpoilers[rev.id];

                return (
                  <div
                    key={rev.id}
                    className="review-card"
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "16px",
                      padding: "1.5rem"
                    }}
                  >
                    <div className="review-card-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        {rev.animePoster && (
                          <img
                            src={rev.animePoster}
                            alt={rev.animeTitle}
                            style={{ width: "48px", height: "70px", objectFit: "cover", borderRadius: "8px", cursor: "pointer" }}
                            onClick={() => anime && onOpenDetail(anime)}
                          />
                        )}
                        <div>
                          <h4
                            style={{ fontSize: "1.15rem", color: "#ffffff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
                            onClick={() => anime && onOpenDetail(anime)}
                          >
                            {rev.animeTitle || anime?.title || "Anime Title"}
                            <ArrowUpRight size={15} color="var(--text-muted)" />
                          </h4>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            Published on {rev.date} • by {rev.author}
                          </div>
                        </div>
                      </div>

                      {/* Rating pill + Edit & Delete actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className="review-rating-pill" style={{ fontSize: "0.85rem", padding: "0.35rem 0.75rem" }}>
                          <Star size={14} fill="#f59e0b" color="#f59e0b" />
                          <span>{rev.rating}/10</span>
                        </div>

                        {/* EDIT REVIEW BUTTON */}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
                          onClick={() => onEditReview(rev)}
                          title="Edit this review"
                        >
                          <Edit3 size={14} /> Edit
                        </button>

                        {/* DELETE REVIEW BUTTON */}
                        <button
                          className="btn-icon"
                          style={{ width: "34px", height: "34px", color: "#f87171" }}
                          onClick={() => setReviewToDelete(rev)}
                          title="Delete review"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Headline */}
                    <h5 style={{ fontSize: "1.1rem", color: "#ffffff", marginTop: "1rem", marginBottom: "0.5rem", fontWeight: 600 }}>
                      "{rev.title}"
                    </h5>

                    {/* Tags */}
                    {rev.tags && rev.tags.length > 0 && (
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.85rem" }}>
                        {rev.tags.map((tag) => (
                          <span
                            key={tag}
                            className="badge badge-purple"
                            style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Spoiler Protection */}
                    {rev.containsSpoiler && !isSpoilerRevealed ? (
                      <div
                        style={{
                          background: "rgba(239, 68, 68, 0.08)",
                          border: "1px dashed rgba(239, 68, 68, 0.3)",
                          borderRadius: "10px",
                          padding: "1rem",
                          margin: "0.5rem 0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "1rem"
                        }}
                      >
                        <span style={{ color: "#fca5a5", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <AlertCircle size={16} color="#ef4444" /> This critique contains plot spoilers.
                        </span>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                          onClick={() => handleToggleSpoiler(rev.id)}
                        >
                          <Eye size={13} /> Reveal Spoiler
                        </button>
                      </div>
                    ) : (
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.65, marginTop: "0.5rem" }}>
                        {rev.content}
                      </p>
                    )}

                    {/* Helpful count */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <ThumbsUp size={14} color="var(--accent-gold)" />
                        <span>{rev.helpfulCount || 0} members found this review helpful</span>
                      </span>
                      {rev.containsSpoiler && isSpoilerRevealed && (
                        <button
                          className="btn-link"
                          style={{ fontSize: "0.78rem", color: "var(--text-muted)", cursor: "pointer" }}
                          onClick={() => handleToggleSpoiler(rev.id)}
                        >
                          <EyeOff size={13} /> Hide spoiler
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Delete Confirmation Modal Dialog */}
          {reviewToDelete && (
            <div className="modal-backdrop" onClick={() => setReviewToDelete(null)}>
              <div
                className="modal-content"
                style={{ maxWidth: "420px", padding: "1.75rem", textAlign: "center" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "rgba(239, 68, 68, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                    color: "#ef4444"
                  }}
                >
                  <Trash2 size={24} />
                </div>
                <h3 style={{ color: "#fff", fontSize: "1.2rem", marginBottom: "0.5rem" }}>Delete this Review?</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
                  Are you sure you want to permanently delete your review for <strong>"{reviewToDelete.animeTitle}"</strong>? This action cannot be undone.
                </p>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setReviewToDelete(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ background: "#ef4444", borderColor: "#ef4444" }}
                    onClick={() => {
                      onDeleteReview(reviewToDelete.id);
                      setReviewToDelete(null);
                    }}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: MY RATINGS (Histogram & Interactive Score Explorer)
         ══════════════════════════════════════════════════════════════════════ */}
      {currentTab === "ratings" && (
        <div>
          {totalRated === 0 ? (
            <div style={{ textAlign: "center", padding: "4.5rem 2rem", background: "var(--bg-surface)", borderRadius: "16px", border: "1px dashed var(--border-subtle)" }}>
              <Star size={52} color="var(--text-muted)" style={{ margin: "0 auto 1.25rem" }} />
              <h3 style={{ color: "#ffffff", fontSize: "1.3rem", marginBottom: "0.5rem" }}>No ratings logged yet</h3>
              <p style={{ color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                Rate anime on a 1-10 scale by clicking the star icon on any card to discover your personal score distribution!
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Score Distribution Breakdown Card */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "16px",
                  padding: "1.75rem",
                  display: "flex",
                  gap: "2rem",
                  flexWrap: "wrap",
                  alignItems: "center"
                }}
              >
                {/* Mean score badge */}
                <div style={{ textAlign: "center", minWidth: "160px" }}>
                  <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--accent-gold)", fontFamily: "var(--font-display)", lineHeight: 1 }}>
                    {avgRating}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#fff", fontWeight: 700, marginTop: "0.25rem" }}>
                    MEAN SCORE
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    {totalRated} anime scored
                  </div>
                </div>

                {/* Score breakdown bars */}
                <div style={{ flex: 1, minWidth: "260px", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((score) => {
                    const count = scoreCounts[score] || 0;
                    const pct = totalRated > 0 ? (count / totalRated) * 100 : 0;
                    const isSelected = ratingScoreFilter === score;
                    return (
                      <div
                        key={score}
                        onClick={() => setRatingScoreFilter(isSelected ? null : score)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          fontSize: "0.82rem",
                          cursor: "pointer",
                          padding: "0.15rem 0.4rem",
                          borderRadius: "6px",
                          background: isSelected ? "rgba(139, 92, 246, 0.2)" : "transparent"
                        }}
                      >
                        <span style={{ width: "24px", color: isSelected ? "#fff" : "var(--accent-gold)", fontWeight: 700, textAlign: "right" }}>
                          {score}★
                        </span>
                        <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                          <div
                            style={{
                              background: score >= 9 ? "#f59e0b" : score >= 7 ? "var(--accent-purple)" : "#64748b",
                              height: "100%",
                              width: `${pct}%`,
                              borderRadius: "4px",
                              transition: "width 0.4s ease"
                            }}
                          />
                        </div>
                        <span style={{ width: "55px", color: isSelected ? "#fff" : "var(--text-muted)", fontSize: "0.75rem" }}>
                          {count} ({Math.round(pct)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Filter Indicator */}
              {ratingScoreFilter !== null && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(139, 92, 246, 0.1)", border: "1px solid var(--accent-purple)", borderRadius: "10px", padding: "0.6rem 1rem" }}>
                  <span style={{ fontSize: "0.88rem", color: "#fff" }}>
                    Filtering for <strong style={{ color: "var(--accent-gold)" }}>{ratingScoreFilter}★</strong> ratings ({filteredRatingsList.length} titles)
                  </span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}
                    onClick={() => setRatingScoreFilter(null)}
                  >
                    Show All
                  </button>
                </div>
              )}

              {/* Grid of Rated Anime Cards */}
              <div className="anime-grid">
                {filteredRatingsList.map(({ id, anime, score }) => (
                  <div key={id} className="anime-card" style={{ display: "flex", flexDirection: "column" }}>
                    <div
                      className="anime-card-poster-wrap"
                      onClick={() => onOpenDetail(anime)}
                      style={{ cursor: "pointer" }}
                    >
                      <img src={anime.posterImage} alt={anime.title} className="anime-card-poster" />
                      <div className="anime-card-badges">
                        <span className="badge badge-purple">{anime.type}</span>
                        <div
                          style={{
                            background: "rgba(2, 132, 199, 0.95)",
                            color: "#fff",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: "3px"
                          }}
                        >
                          <Star size={11} fill="#fff" color="#fff" /> Your: {score}/10
                        </div>
                      </div>
                    </div>

                    <div className="anime-card-body" style={{ padding: "0.85rem", display: "flex", flexDirection: "column", flex: 1 }}>
                      <h4
                        className="anime-card-title"
                        style={{ fontSize: "0.95rem", cursor: "pointer" }}
                        onClick={() => onOpenDetail(anime)}
                      >
                        {anime.title}
                      </h4>

                      <div style={{ marginTop: "auto", paddingTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          IMDb: <strong style={{ color: "var(--accent-gold)" }}>{anime.rating}</strong>
                        </span>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.65rem", fontSize: "0.75rem" }}
                          onClick={() => onOpenRating(anime)}
                        >
                          Edit Score
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 6: PROFILE SETTINGS & AVATAR PICKER
         ══════════════════════════════════════════════════════════════════════ */}
      {currentTab === "settings" && (
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <form
            onSubmit={handleSaveProfileSettings}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "18px",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              boxShadow: "var(--shadow-md)"
            }}
          >
            <div>
              <h3 style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700 }}>Profile & Account Customization</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "0.25rem" }}>
                Personalize your public presence, avatar, and bio on AniLib.
              </p>
            </div>

            {/* Display Name Input */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "0.4rem" }}>
                Display Name
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: "100%", height: "42px", fontSize: "0.95rem" }}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your public display name..."
                required
              />
            </div>

            {/* Bio Input */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "0.4rem" }}>
                Bio / Favorite Anime Quote
              </label>
              <textarea
                className="search-input"
                style={{ width: "100%", height: "90px", fontSize: "0.9rem", padding: "0.6rem 0.85rem", resize: "vertical" }}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Write a brief bio about your anime taste or favorite quote..."
              />
            </div>

            {/* Avatar Selector from anime presets */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "0.65rem" }}>
                Choose Your Anime Character Avatar
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(75px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                {PRESET_AVATARS.map((url, idx) => {
                  const isSelected = editAvatar === url && !customAvatarUrl;
                  const name = PRESET_AVATAR_NAMES[idx] || "Avatar";
                  return (
                    <div
                      key={url}
                      onClick={() => { setEditAvatar(url); setCustomAvatarUrl(""); }}
                      style={{
                        cursor: "pointer",
                        textAlign: "center",
                        border: isSelected ? "2px solid var(--accent-purple)" : "2px solid transparent",
                        borderRadius: "12px",
                        padding: "4px",
                        background: isSelected ? "rgba(139, 92, 246, 0.2)" : "rgba(255,255,255,0.03)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <img
                        src={url}
                        alt={name}
                        onError={(e) => {
                          e.target.src = "/avatars/tanjiro.jpg";
                        }}
                        style={{
                          width: "55px",
                          height: "55px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          margin: "0 auto",
                          display: "block"
                        }}
                      />
                      <div style={{ fontSize: "0.68rem", color: isSelected ? "#fff" : "var(--text-muted)", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {name}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Avatar URL option */}
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                  Or paste a custom image URL:
                </label>
                <input
                  type="url"
                  className="search-input"
                  style={{ width: "100%", height: "38px", fontSize: "0.82rem" }}
                  placeholder="https://example.com/your-avatar.jpg"
                  value={customAvatarUrl}
                  onChange={(e) => {
                    setCustomAvatarUrl(e.target.value);
                    if (e.target.value) setEditAvatar(e.target.value);
                  }}
                />
              </div>
            </div>

            {/* Submit button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
              {profileSavedFeedback && (
                <span style={{ color: "#22c55e", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Check size={16} /> Changes saved!
                </span>
              )}
              <div style={{ marginLeft: "auto" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "0.6rem 1.4rem", fontSize: "0.9rem" }}
                >
                  Save Profile Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
