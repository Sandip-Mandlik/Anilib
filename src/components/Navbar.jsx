import React, { useState, useEffect, useRef } from "react";
import {
  Search, Star, Film, Tv, Trophy, Bookmark, MessageSquare,
  Dices, X, Sparkles, LogIn, UserPlus, LogOut, ChevronDown, User, Heart, Settings
} from "lucide-react";
import { useAuth } from "../context/useAuth";

export function Navbar({
  activeTab,
  setActiveTab,
  onSelectAnime,
  onRandomAnime,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  watchlistCount = 0,
  favoritesCount = 0,
  userReviewsCount = 0,
  userRatingsCount = 0,
  onOpenAuth,      // (defaultTab?: 'login' | 'signup') => void
  onNavigateProfile,
}) {
  const { currentUser, logout } = useAuth();
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const searchRef  = useRef(null);
  const profileRef = useRef(null);
  const inputRef   = useRef(null);

  const totalSaved = favoritesCount + watchlistCount + userReviewsCount;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setDropdownOpen(true);
  };

  const handleSelectResult = (anime) => {
    onSelectAnime(anime);
    setDropdownOpen(false);
    if (inputRef.current) inputRef.current.blur();
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
  };

  const handleGoToProfile = (subTab = "overview") => {
    setProfileMenuOpen(false);
    if (onNavigateProfile) {
      onNavigateProfile(subTab);
    } else {
      setActiveTab("profile");
    }
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        {/* Brand Logo */}
        <div
          className="nav-brand"
          style={{ cursor: "pointer" }}
          onClick={() => setActiveTab("explore")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.7rem" }}>⛩️</span>
            <span>Ani<span style={{ color: "var(--accent-gold)" }}>Lib</span></span>
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="search-container" ref={searchRef}>
          <form
            className="search-input-wrapper"
            onSubmit={(e) => {
              e.preventDefault();
              setDropdownOpen(false);
              if (inputRef.current) inputRef.current.blur();
              setActiveTab("explore");
            }}
          >
            <Search className="search-icon" size={18} />
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Search anime, movies, studios, genres..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setDropdownOpen(false);
                  if (inputRef.current) inputRef.current.blur();
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchQuery("");
                  setDropdownOpen(false);
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </form>

          {/* Autocomplete Dropdown */}
          {dropdownOpen && searchQuery.trim().length > 0 && (
            <div className="search-dropdown">
              {isSearching ? (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
                  <Sparkles className="animate-spin" size={20} style={{ margin: "0 auto 0.5rem" }} />
                  Searching AniLib & MAL...
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.slice(0, 6).map((anime) => (
                  <div
                    key={anime.id}
                    className="search-result-item"
                    onClick={() => handleSelectResult(anime)}
                  >
                    <img
                      src={anime.posterImage}
                      alt={anime.title}
                      className="search-thumb"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80";
                      }}
                    />
                    <div className="search-meta">
                      <div className="search-title">{anime.title}</div>
                      <div className="search-sub">
                        <span>{anime.year}</span>
                        <span>•</span>
                        <span>{anime.type}</span>
                        <span>•</span>
                        <span style={{ color: "var(--accent-gold)", display: "flex", alignItems: "center", gap: "2px" }}>
                          <Star size={12} fill="#f59e0b" color="#f59e0b" /> {anime.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
                  No anime found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Links — Clean content browsing */}
        <nav>
          <ul className="nav-links">
            <li>
              <button className={`nav-link ${activeTab === "explore" ? "active" : ""}`} onClick={() => setActiveTab("explore")}>
                Explore
              </button>
            </li>
            <li>
              <button className={`nav-link ${activeTab === "movies" ? "active" : ""}`} onClick={() => setActiveTab("movies")}>
                <Film size={16} /> Movies
              </button>
            </li>
            <li>
              <button className={`nav-link ${activeTab === "series" ? "active" : ""}`} onClick={() => setActiveTab("series")}>
                <Tv size={16} /> Series
              </button>
            </li>
            <li>
              <button className={`nav-link ${activeTab === "top" ? "active" : ""}`} onClick={() => setActiveTab("top")}>
                <Trophy size={16} /> Top 250
              </button>
            </li>
          </ul>
        </nav>

        {/* Right Side: Random + Profile & Auth */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <button
            className="btn btn-secondary"
            style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
            onClick={onRandomAnime}
            title="Discover a random masterpiece"
          >
            <Dices size={16} color="var(--accent-purple)" />
            <span>Random</span>
          </button>

          {/* ── Logged-in user avatar + enriched dropdown ── */}
          {currentUser ? (
            <div className="nav-profile-wrap" ref={profileRef}>
              <button
                className={`nav-profile-btn ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => setProfileMenuOpen((p) => !p)}
                aria-label="User menu"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.username}
                  className="nav-avatar"
                  onError={(e) => { e.target.src = "/avatars/tanjiro.jpg"; }}
                />
                <span className="nav-username">{currentUser.displayName || currentUser.username}</span>
                {totalSaved > 0 && (
                  <span className="nav-profile-count-pill" title={`${totalSaved} saved items`}>
                    {totalSaved}
                  </span>
                )}
                <ChevronDown size={14} className={`nav-chevron ${profileMenuOpen ? "open" : ""}`} />
              </button>

              {profileMenuOpen && (
                <div className="nav-profile-dropdown">
                  {/* User info header banner */}
                  <div
                    className="nav-dropdown-header"
                    onClick={() => handleGoToProfile("overview")}
                    title="View Full Profile"
                    role="button"
                    tabIndex={0}
                  >
                    <img
                      src={currentUser.avatar}
                      alt=""
                      className="nav-dropdown-avatar"
                      onError={(e) => { e.target.src = "/avatars/tanjiro.jpg"; }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="nav-dropdown-name">{currentUser.displayName || currentUser.username}</div>
                      <div className="nav-dropdown-email">@{currentUser.username}</div>
                      <span className="badge badge-purple" style={{ fontSize: "0.62rem", marginTop: "0.25rem", display: "inline-block" }}>
                        {currentUser.badge || "Member"}
                      </span>
                    </div>
                  </div>

                  {/* Quick stats mini-row */}
                  <div className="nav-dropdown-stats">
                    <button
                      className="nav-stat-chip"
                      onClick={() => handleGoToProfile("favorites")}
                      title="View Favorites"
                    >
                      <Heart size={12} color="#ef4444" fill={favoritesCount > 0 ? "#ef4444" : "none"} />
                      <span>{favoritesCount} Favs</span>
                    </button>
                    <button
                      className="nav-stat-chip"
                      onClick={() => handleGoToProfile("watchlist")}
                      title="View Watchlist"
                    >
                      <Bookmark size={12} color="var(--accent-purple)" />
                      <span>{watchlistCount} List</span>
                    </button>
                    <button
                      className="nav-stat-chip"
                      onClick={() => handleGoToProfile("reviews")}
                      title="View Reviews"
                    >
                      <MessageSquare size={12} color="var(--accent-gold)" />
                      <span>{userReviewsCount} Reviews</span>
                    </button>
                  </div>

                  <div className="nav-dropdown-divider" />

                  {/* Navigation Links inside Profile */}
                  <button className="nav-dropdown-item" onClick={() => handleGoToProfile("overview")}>
                    <User size={15} color="var(--accent-purple)" />
                    <span>Profile Dashboard</span>
                  </button>

                  <button className="nav-dropdown-item" onClick={() => handleGoToProfile("favorites")}>
                    <Heart size={15} color="#ef4444" fill={favoritesCount > 0 ? "#ef4444" : "none"} />
                    <span style={{ flex: 1 }}>Favorites</span>
                    {favoritesCount > 0 && (
                      <span className="badge" style={{ background: "#ef4444", color: "#fff", fontSize: "0.68rem", padding: "0.1rem 0.45rem" }}>
                        {favoritesCount}
                      </span>
                    )}
                  </button>

                  <button className="nav-dropdown-item" onClick={() => handleGoToProfile("watchlist")}>
                    <Bookmark size={15} color="var(--accent-purple)" />
                    <span style={{ flex: 1 }}>Watchlist</span>
                    {watchlistCount > 0 && (
                      <span className="badge badge-purple" style={{ fontSize: "0.68rem", padding: "0.1rem 0.45rem" }}>
                        {watchlistCount}
                      </span>
                    )}
                  </button>

                  <button className="nav-dropdown-item" onClick={() => handleGoToProfile("reviews")}>
                    <MessageSquare size={15} color="var(--accent-gold)" />
                    <span style={{ flex: 1 }}>My Reviews</span>
                    {userReviewsCount > 0 && (
                      <span className="badge badge-gold" style={{ fontSize: "0.68rem", padding: "0.1rem 0.45rem" }}>
                        {userReviewsCount}
                      </span>
                    )}
                  </button>

                  <button className="nav-dropdown-item" onClick={() => handleGoToProfile("ratings")}>
                    <Star size={15} color="#38bdf8" />
                    <span style={{ flex: 1 }}>My Ratings</span>
                    {userRatingsCount > 0 && (
                      <span className="badge" style={{ background: "#0284c7", color: "#fff", fontSize: "0.68rem", padding: "0.1rem 0.45rem" }}>
                        {userRatingsCount}
                      </span>
                    )}
                  </button>

                  <button className="nav-dropdown-item" onClick={() => handleGoToProfile("settings")}>
                    <Settings size={15} color="var(--text-muted)" />
                    <span>Account Settings</span>
                  </button>

                  <div className="nav-dropdown-divider" />

                  <button className="nav-dropdown-item nav-dropdown-logout" onClick={handleLogout}>
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Guest: Profile hub shortcut + Sign In / Join Free ── */
            <div className="nav-auth-btns">
              <button
                className={`btn btn-secondary nav-guest-profile-btn ${activeTab === "profile" ? "active" : ""}`}
                style={{ padding: "0.5rem 0.75rem", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
                onClick={() => handleGoToProfile("overview")}
                title="View Profile & Saved Items"
              >
                <User size={15} color="var(--accent-gold)" />
                <span>Profile</span>
                {totalSaved > 0 && (
                  <span className="badge badge-purple" style={{ padding: "0.1rem 0.35rem", fontSize: "0.65rem" }}>
                    {totalSaved}
                  </span>
                )}
              </button>

              <button
                className="btn btn-ghost"
                style={{ padding: "0.5rem 0.8rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}
                onClick={() => onOpenAuth("login")}
              >
                <LogIn size={15} /> Sign In
              </button>
              <button
                className="btn btn-primary"
                style={{ padding: "0.5rem 0.85rem", fontSize: "0.82rem" }}
                onClick={() => onOpenAuth("signup")}
              >
                <UserPlus size={15} /> Join Free
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
