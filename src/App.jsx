import React, { useState, useEffect, useMemo, useCallback } from "react";
import { CURATED_ANIME } from "./data/curatedAnime";
import { searchAnimeOnline } from "./services/animeApi";
import {
  getAllUserRatings,
  setUserRating,
  removeUserRating,
  getUserReviews,
  saveUserReview,
  deleteUserReview,
  getWatchlist,
  setWatchlistStatus,
  getReviewVotes,
  toggleReviewVote,
  getFavorites,
  toggleFavorite,
} from "./services/storage";

import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { Navbar }           from "./components/Navbar";
import { HeroSpotlight }    from "./components/HeroSpotlight";
import { FilterBar }        from "./components/FilterBar";
import { AnimeCard }        from "./components/AnimeCard";
import { AnimeDetailModal } from "./components/AnimeDetailModal";
import { RatingModal }      from "./components/RatingModal";
import { ReviewModal }      from "./components/ReviewModal";
import { TrailerModal }     from "./components/TrailerModal";
import { TopChart }         from "./components/TopChart";
import { UserActivity }     from "./components/UserActivity";
import { PosterGallery }    from "./components/PosterGallery";
import { AuthModal }        from "./components/AuthModal";
import { Toast }            from "./components/Toast";
import { Film, Tv, Flame, Search, X } from "lucide-react";

// ── Inner app — consumes AuthContext ──────────────────────────────────────────
function AppInner() {
  const { currentUser } = useAuth();
  const username = currentUser?.username || null;

  // Master anime catalog
  const [animeList, setAnimeList] = useState(CURATED_ANIME);
  const [activeTab, setActiveTab] = useState("explore");
  const [profileSubTab, setProfileSubTab] = useState("overview");

  // Search state
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching,   setIsSearching]   = useState(false);

  // Filters
  const [typeFilter,         setTypeFilter]         = useState("all");
  const [selectedGenre,      setSelectedGenre]      = useState("All");
  const [minRating,          setMinRating]          = useState(0);
  const [sortBy,             setSortBy]             = useState("rating");
  const [showFavoritesOnly,  setShowFavoritesOnly]  = useState(false);

  // Persistent user data — reloaded whenever username changes
  const [userRatings,  setUserRatings]  = useState({});
  const [userReviews,  setUserReviews]  = useState([]);
  const [watchlist,    setWatchlist]    = useState({});
  const [favorites,    setFavorites]    = useState({});
  const [reviewVotes,  setReviewVotes]  = useState({});

  // Modals
  const [selectedAnimeDetail,  setSelectedAnimeDetail]  = useState(null);
  const [ratingTargetAnime,    setRatingTargetAnime]    = useState(null);
  const [reviewTargetAnime,    setReviewTargetAnime]    = useState(null);
  const [trailerTargetAnime,   setTrailerTargetAnime]   = useState(null);
  const [authModalOpen,        setAuthModalOpen]        = useState(false);
  const [authModalTab,         setAuthModalTab]         = useState("login");
  const [authPromptMessage,    setAuthPromptMessage]    = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  // ── Reload user data whenever we log in / out ────────────────────────────
  useEffect(() => {
    setUserRatings(getAllUserRatings(username));
    setUserReviews(getUserReviews(username));
    setWatchlist(getWatchlist(username));
    setFavorites(getFavorites(username));
    setReviewVotes(getReviewVotes(username));
  }, [username]);

  // ── Sync tab → type filter ───────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "movies")  setTypeFilter("Movie");
    else if (activeTab === "series") setTypeFilter("TV Series");
    else if (activeTab === "explore") setTypeFilter("all");
  }, [activeTab]);

  // ── Live search with debounce ────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchAnimeOnline(searchQuery);
        setSearchResults(results);
        setAnimeList((prev) => {
          const map = new Map();
          prev.forEach((a) => map.set(a.id, a));
          results.forEach((a) => map.set(a.id, a));
          return Array.from(map.values());
        });
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Auth gate helper ─────────────────────────────────────────────────────
  const requireAuth = useCallback((action, message) => {
    if (currentUser) {
      action();
    } else {
      setAuthPromptMessage(message || "Sign in to save your progress.");
      setAuthModalTab("login");
      setAuthModalOpen(true);
    }
  }, [currentUser]);

  const openAuth = useCallback((tab = "login") => {
    setAuthModalTab(tab);
    setAuthPromptMessage(null);
    setAuthModalOpen(true);
  }, []);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const addToast = (message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const handleDismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Rating actions ───────────────────────────────────────────────────────
  const handleSaveRating = (animeId, rating) => {
    const updated = setUserRating(animeId, rating, username);
    setUserRatings({ ...updated });
    addToast(`Rated ${rating}/10! Your score has been logged.`, "gold");
  };

  const handleRemoveRating = (animeId) => {
    const updated = removeUserRating(animeId, username);
    setUserRatings({ ...updated });
    addToast("Your rating has been removed.", "info");
  };

  // ── Review actions ───────────────────────────────────────────────────────
  const handleSaveReview = (reviewData) => {
    // Attach current user info to the review
    const enriched = {
      ...reviewData,
      author: currentUser?.displayName || currentUser?.username || "Guest",
      avatar: currentUser?.avatar,
    };
    saveUserReview(enriched, username);
    setUserReviews(getUserReviews(username));
    addToast("Review published! Thank you for your critique.", "success");
    if (selectedAnimeDetail && Number(selectedAnimeDetail.id) === Number(reviewData.animeId)) {
      setSelectedAnimeDetail({ ...selectedAnimeDetail });
    }
  };

  const handleDeleteReview = (reviewId) => {
    deleteUserReview(reviewId, username);
    setUserReviews(getUserReviews(username));
    addToast("Review deleted.", "info");
  };

  // ── Watchlist actions ────────────────────────────────────────────────────
  const handleToggleWatchlist = (animeId) => {
    requireAuth(() => {
      const current = watchlist[animeId];
      if (current) {
        const updated = setWatchlistStatus(animeId, null, username);
        setWatchlist({ ...updated });
        addToast("Removed from your watchlist.", "info");
      } else {
        const updated = setWatchlistStatus(animeId, "plan", username);
        setWatchlist({ ...updated });
        addToast("Added to your watchlist!", "watchlist");
      }
    }, "Sign in to save anime to your watchlist.");
  };

  const handleUpdateWatchlistStatus = (animeId, status) => {
    const updated = setWatchlistStatus(animeId, status, username);
    setWatchlist({ ...updated });
    if (status) addToast(`Watchlist status updated to ${status}.`, "watchlist");
    else addToast("Removed from watchlist.", "info");
  };

  const handleUpdateWatchlistProgress = (animeId, progress, totalEpisodes) => {
    const current = watchlist[animeId] || {};
    let newStatus = current.status || "watching";
    if (totalEpisodes && progress >= totalEpisodes) {
      newStatus = "completed";
      addToast(`🎉 Completed all ${totalEpisodes} episodes! Status set to Completed.`, "success");
    }
    const updated = setWatchlistStatus(animeId, newStatus, username, { progress });
    setWatchlist({ ...updated });
  };

  const handleNavigateProfile = useCallback((subTab = "overview") => {
    setActiveTab("profile");
    setProfileSubTab(subTab);
  }, []);

  // ── Favorites actions ────────────────────────────────────────────────────
  const handleToggleFavorite = (animeId) => {
    requireAuth(() => {
      const isFav = Boolean(favorites[animeId]);
      const updated = toggleFavorite(animeId, username);
      setFavorites({ ...updated });
      if (isFav) {
        addToast("Removed from your favorites.", "info");
      } else {
        addToast("Added to your favorites! ❤️", "success");
      }
    }, "Sign in to save anime to your favorites.");
  };

  // ── Vote ─────────────────────────────────────────────────────────────────
  const handleVoteReview = (reviewId) => {
    requireAuth(() => {
      const updated = toggleReviewVote(reviewId, "helpful", username);
      setReviewVotes({ ...updated });
    }, "Sign in to vote on reviews.");
  };

  // ── Open rating (gated) ──────────────────────────────────────────────────
  const handleOpenRating = (anime) => {
    requireAuth(
      () => setRatingTargetAnime(anime),
      `Sign in to rate "${anime.title}".`
    );
  };

  // ── Open review form (gated) ─────────────────────────────────────────────
  const handleOpenReviewForm = (anime) => {
    requireAuth(
      () => setReviewTargetAnime(anime),
      `Sign in to write a review for "${anime.title}".`
    );
  };

  // ── Random anime ─────────────────────────────────────────────────────────
  const handleRandomAnime = () => {
    const random = animeList[Math.floor(Math.random() * animeList.length)];
    setSelectedAnimeDetail(random);
    addToast(`Surprise discovery: "${random.title}"!`, "info");
  };

  // ── Share ────────────────────────────────────────────────────────────────
  const handleShare = (anime) => {
    const text = `Check out ${anime.title} on AniLib! Rated ${anime.rating}/10.`;
    if (navigator.share) {
      navigator.share({ title: anime.title, text, url: window.location.href }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      addToast("Copied anime link to clipboard!", "info");
    }
  };

  // ── Filtered catalog ─────────────────────────────────────────────────────
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return animeList
      .filter((anime) => {
        // Live Search filter
        if (q) {
          const titleMatch = anime.title?.toLowerCase().includes(q);
          const japTitleMatch = anime.japaneseTitle?.toLowerCase().includes(q);
          const studioMatch = anime.studio?.toLowerCase().includes(q);
          const genreMatch = anime.genres?.some((g) => g.toLowerCase().includes(q));
          const synopsisMatch = anime.synopsis?.toLowerCase().includes(q);
          const yearMatch = String(anime.year || "").includes(q);
          const typeMatch = anime.type?.toLowerCase().includes(q);

          if (!titleMatch && !japTitleMatch && !studioMatch && !genreMatch && !synopsisMatch && !yearMatch && !typeMatch) {
            return false;
          }
        }
        if (showFavoritesOnly && !favorites[anime.id]) return false;
        if (typeFilter !== "all" && anime.type !== typeFilter) return false;
        if (selectedGenre !== "All" && !anime.genres.includes(selectedGenre)) return false;
        if (minRating > 0 && anime.rating < minRating) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "rating")     return b.rating - a.rating;
        if (sortBy === "popularity") return (b.ratingCount || 0) - (a.ratingCount || 0);
        if (sortBy === "newest")     return (b.year || 0) - (a.year || 0);
        if (sortBy === "title")      return a.title.localeCompare(b.title);
        return 0;
      });
  }, [animeList, searchQuery, typeFilter, selectedGenre, minRating, sortBy, showFavoritesOnly, favorites]);

  const spotlightAnime = useMemo(
    () => animeList.find((a) => a.id === 52991) || animeList[0],
    [animeList]
  );

  return (
    <div className="app-layout">

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectAnime={(anime) => setSelectedAnimeDetail(anime)}
        onRandomAnime={handleRandomAnime}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        watchlistCount={Object.keys(watchlist).length}
        favoritesCount={Object.keys(favorites).length}
        userReviewsCount={userReviews.length}
        userRatingsCount={Object.keys(userRatings).length}
        onOpenAuth={openAuth}
        onNavigateProfile={handleNavigateProfile}
      />

      {/* Main content */}
      <main>

        {/* EXPLORE / MOVIES / SERIES */}
        {(activeTab === "explore" || activeTab === "movies" || activeTab === "series") && (
          <>
            {activeTab === "explore" && (
              <>
                <HeroSpotlight
                  anime={spotlightAnime}
                  userRating={userRatings[spotlightAnime?.id]}
                  inWatchlist={Boolean(watchlist[spotlightAnime?.id])}
                  isFavorite={Boolean(favorites[spotlightAnime?.id])}
                  onOpenDetail={(anime) => setSelectedAnimeDetail(anime)}
                  onOpenTrailer={(anime) => setTrailerTargetAnime(anime)}
                  onOpenRating={handleOpenRating}
                  onToggleWatchlist={handleToggleWatchlist}
                  onToggleFavorite={handleToggleFavorite}
                />
                <PosterGallery
                  animeList={animeList}
                  userRatings={userRatings}
                  watchlist={watchlist}
                  favorites={favorites}
                  onOpenDetail={(anime) => setSelectedAnimeDetail(anime)}
                  onOpenTrailer={(anime) => setTrailerTargetAnime(anime)}
                  onToggleWatchlist={handleToggleWatchlist}
                  onToggleFavorite={handleToggleFavorite}
                />
              </>
            )}

            <div className="container" style={{ paddingTop: activeTab !== "explore" ? "2.5rem" : "0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "2rem", color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {activeTab === "movies" ? (
                      <><Film size={26} color="var(--accent-purple)" /> Top Anime Theatrical Movies</>
                    ) : activeTab === "series" ? (
                      <><Tv size={26} color="var(--accent-purple)" /> Top Anime TV Series</>
                    ) : (
                      <><Flame size={26} color="var(--accent-gold)" /> Browse & Discover Anime</>
                    )}
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                    Explore verified community scores, write reviews, and contribute to the rankings.
                  </p>
                </div>
              </div>

              {/* Search Active Indicator Banner */}
              {searchQuery.trim() && (
                <div
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--accent-purple)",
                    borderRadius: "12px",
                    padding: "1rem 1.25rem",
                    marginBottom: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "1rem",
                    boxShadow: "var(--shadow-purple)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <Search size={20} color="var(--accent-gold)" />
                    <span style={{ fontSize: "1.05rem", color: "#ffffff", fontWeight: 600 }}>
                      Search results for <span style={{ color: "var(--accent-gold)" }}>"{searchQuery}"</span>
                    </span>
                    <span className="badge badge-purple" style={{ padding: "0.2rem 0.6rem" }}>
                      {filteredCatalog.length} {filteredCatalog.length === 1 ? "anime" : "animes"} found
                    </span>
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.82rem" }}
                    onClick={() => setSearchQuery("")}
                  >
                    <X size={14} /> Clear Search
                  </button>
                </div>
              )}

              <FilterBar
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                selectedGenre={selectedGenre}
                setSelectedGenre={setSelectedGenre}
                minRating={minRating}
                setMinRating={setMinRating}
                sortBy={sortBy}
                setSortBy={setSortBy}
                showFavoritesOnly={showFavoritesOnly}
                setShowFavoritesOnly={setShowFavoritesOnly}
                onResetFilters={() => {
                  setTypeFilter(activeTab === "movies" ? "Movie" : activeTab === "series" ? "TV Series" : "all");
                  setSelectedGenre("All");
                  setMinRating(0);
                  setSortBy("rating");
                  setShowFavoritesOnly(false);
                }}
                totalResults={filteredCatalog.length}
              />

              {filteredCatalog.length === 0 ? (
                <div style={{ padding: "4rem 2rem", textAlign: "center", background: "var(--bg-surface)", borderRadius: "16px", border: "1px dashed var(--border-subtle)", margin: "2rem 0" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
                    No anime match your active filter criteria. Try adjusting the score or genre!
                  </p>
                </div>
              ) : (
                <div className="anime-grid">
                  {filteredCatalog.map((anime) => (
                    <AnimeCard
                      key={anime.id}
                      anime={anime}
                      userRating={userRatings[anime.id]}
                      inWatchlist={Boolean(watchlist[anime.id])}
                      isFavorite={Boolean(favorites[anime.id])}
                      onOpenDetail={(item) => setSelectedAnimeDetail(item)}
                      onOpenRating={handleOpenRating}
                      onOpenTrailer={(item) => setTrailerTargetAnime(item)}
                      onToggleWatchlist={handleToggleWatchlist}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* TOP 250 */}
        {activeTab === "top" && (
          <TopChart
            animeList={animeList}
            userRatings={userRatings}
            watchlist={watchlist}
            favorites={favorites}
            onOpenDetail={(anime) => setSelectedAnimeDetail(anime)}
            onOpenRating={handleOpenRating}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {/* PROFILE SECTION (Overview, Watchlist, Reviews, Favorites, Ratings, Settings) */}
        {(activeTab === "profile" || activeTab === "watchlist" || activeTab === "reviews" || activeTab === "favorites") && (
          <UserActivity
            activeSubTab={
              activeTab === "favorites" ? "favorites" :
              activeTab === "watchlist" ? "watchlist" :
              activeTab === "reviews" ? "reviews" :
              profileSubTab
            }
            onSubTabChange={(tab) => setProfileSubTab(tab)}
            userReviews={userReviews}
            userRatings={userRatings}
            watchlist={watchlist}
            favorites={favorites}
            animeList={animeList}
            onOpenDetail={(anime) => setSelectedAnimeDetail(anime)}
            onOpenRating={handleOpenRating}
            onEditReview={(review) => {
              const anime = animeList.find((a) => Number(a.id) === Number(review.animeId));
              if (anime) setReviewTargetAnime(anime);
            }}
            onDeleteReview={handleDeleteReview}
            onUpdateWatchlistStatus={handleUpdateWatchlistStatus}
            onUpdateWatchlistProgress={handleUpdateWatchlistProgress}
            onToggleFavorite={handleToggleFavorite}
            onOpenAuth={openAuth}
            addToast={addToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", background: "rgba(9, 12, 21, 0.95)", padding: "3rem 0 2rem", marginTop: "4rem" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "2rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.5rem" }}>
              <span>⛩️</span>
              <span>Ani<span style={{ color: "var(--accent-gold)" }}>Lib</span></span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "380px", lineHeight: 1.6 }}>
              The premier anime review and rating platform. Discover timeless classics, theatrical movies, and trending series with verified community scores.
            </p>
          </div>

          <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
            <div>
              <h4 style={{ fontSize: "0.9rem", color: "#ffffff", marginBottom: "0.75rem", textTransform: "uppercase" }}>Navigation</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <li><a href="#explore" onClick={(e) => { e.preventDefault(); setActiveTab("explore"); }}>Explore All</a></li>
                <li><a href="#movies"  onClick={(e) => { e.preventDefault(); setActiveTab("movies"); }}>Top Movies</a></li>
                <li><a href="#series"  onClick={(e) => { e.preventDefault(); setActiveTab("series"); }}>TV Series</a></li>
                <li><a href="#top"     onClick={(e) => { e.preventDefault(); setActiveTab("top"); }}>Top 250 Charts</a></li>
                <li><a href="#profile" onClick={(e) => { e.preventDefault(); handleNavigateProfile("overview"); }}>User Profile Hub</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: "0.9rem", color: "#ffffff", marginBottom: "0.75rem", textTransform: "uppercase" }}>Features</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <li>1-10 Star Rating Histogram</li>
                <li>Spoiler Protected Reviews</li>
                <li>YouTube Trailer Embeds</li>
                <li>Jikan (MyAnimeList) API Search</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="container" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "2rem", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap", gap: "1rem" }}>
          <div>© {new Date().getFullYear()} AniLib. All anime imagery and metadata belong to their respective studios and licensors.</div>
          <div>Crafted with precision for anime lovers worldwide.</div>
        </div>
      </footer>

      {/* ── MODALS ── */}

      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal
          defaultTab={authModalTab}
          promptMessage={authPromptMessage}
          onClose={() => {
            setAuthModalOpen(false);
            setAuthPromptMessage(null);
          }}
        />
      )}

      {/* Anime Detail */}
      {selectedAnimeDetail && (
        <AnimeDetailModal
          anime={selectedAnimeDetail}
          userRating={userRatings[selectedAnimeDetail.id]}
          inWatchlist={Boolean(watchlist[selectedAnimeDetail.id])}
          reviewVotes={reviewVotes}
          currentUser={currentUser}
          onClose={() => setSelectedAnimeDetail(null)}
          onOpenRating={handleOpenRating}
          onOpenTrailer={(anime) => setTrailerTargetAnime(anime)}
          onOpenReviewForm={handleOpenReviewForm}
          onToggleWatchlist={handleToggleWatchlist}
          onVoteReview={handleVoteReview}
          onDeleteReview={handleDeleteReview}
          onShare={handleShare}
          username={username}
        />
      )}

      {/* Rating Modal */}
      {ratingTargetAnime && (
        <RatingModal
          anime={ratingTargetAnime}
          initialRating={userRatings[ratingTargetAnime.id]}
          onSaveRating={handleSaveRating}
          onRemoveRating={handleRemoveRating}
          onClose={() => setRatingTargetAnime(null)}
        />
      )}

      {/* Review Modal */}
      {reviewTargetAnime && (
        <ReviewModal
          anime={reviewTargetAnime}
          userInitialRating={userRatings[reviewTargetAnime.id]}
          existingReview={userReviews.find((r) => Number(r.animeId) === Number(reviewTargetAnime.id))}
          currentUser={currentUser}
          onSaveReview={handleSaveReview}
          onClose={() => setReviewTargetAnime(null)}
        />
      )}

      {/* Trailer Modal */}
      {trailerTargetAnime && (
        <TrailerModal
          anime={trailerTargetAnime}
          onClose={() => setTrailerTargetAnime(null)}
        />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

// ── Root export — wraps with AuthProvider ─────────────────────────────────────
export function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
