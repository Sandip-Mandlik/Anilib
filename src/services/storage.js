import { userKey } from "./auth";

// ── Key factory ───────────────────────────────────────────────────────────────
// All keys are namespaced per user so each account has isolated data.
const BASE_KEYS = {
  RATINGS:      "anilib_user_ratings",
  REVIEWS:      "anilib_user_reviews",
  VOTES:        "anilib_review_votes",
  WATCHLIST:    "anilib_watchlist",
  USER_PROFILE: "anilib_user_profile",
  FAVORITES:    "anilib_user_favorites",
};

function keys(username) {
  return {
    RATINGS:      userKey(BASE_KEYS.RATINGS,      username),
    REVIEWS:      userKey(BASE_KEYS.REVIEWS,      username),
    VOTES:        userKey(BASE_KEYS.VOTES,         username),
    WATCHLIST:    userKey(BASE_KEYS.WATCHLIST,     username),
    USER_PROFILE: userKey(BASE_KEYS.USER_PROFILE,  username),
    FAVORITES:    userKey(BASE_KEYS.FAVORITES,     username),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function safeGet(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

// ── User Profile (legacy — kept for compatibility) ────────────────────────────
export const DEFAULT_USER = {
  name:   "OtakuSensei",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  badge:  "Top Reviewer",
  joined: "2023",
};

export const getUserProfile  = (username) => safeGet(keys(username).USER_PROFILE, DEFAULT_USER);
export const setUserProfile  = (profile, username) => safeSet(keys(username).USER_PROFILE, profile);

// ── Ratings (animeId → score 1-10) ───────────────────────────────────────────
export const getAllUserRatings = (username) => safeGet(keys(username).RATINGS, {});

export const getUserRating = (animeId, username) => {
  const ratings = getAllUserRatings(username);
  return ratings[animeId] || null;
};

export const setUserRating = (animeId, rating, username) => {
  const ratings = getAllUserRatings(username);
  ratings[animeId] = Number(rating);
  safeSet(keys(username).RATINGS, ratings);
  return ratings;
};

export const removeUserRating = (animeId, username) => {
  const ratings = getAllUserRatings(username);
  delete ratings[animeId];
  safeSet(keys(username).RATINGS, ratings);
  return ratings;
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const getUserReviews = (username) => safeGet(keys(username).REVIEWS, []);

export const saveUserReview = (reviewData, username) => {
  const reviews = getUserReviews(username);
  const existingIndex = reviews.findIndex(
    (r) => r.id === reviewData.id || (r.animeId === reviewData.animeId && r.isUserSubmission)
  );

  const newReview = {
    ...reviewData,
    id:               reviewData.id || `user-rev-${Date.now()}`,
    author:           reviewData.author || (username || "Guest"),
    avatar:           reviewData.avatar,
    date:             reviewData.date || new Date().toISOString().split("T")[0],
    helpfulCount:     reviewData.helpfulCount || 0,
    isUserSubmission: true,
  };

  if (existingIndex >= 0) {
    reviews[existingIndex] = { ...reviews[existingIndex], ...newReview };
  } else {
    reviews.unshift(newReview);
  }

  safeSet(keys(username).REVIEWS, reviews);
  return newReview;
};

export const deleteUserReview = (reviewId, username) => {
  const reviews = getUserReviews(username).filter((r) => r.id !== reviewId);
  safeSet(keys(username).REVIEWS, reviews);
  return reviews;
};

// Merge seeded + user reviews for a given anime
export const getMergedReviewsForAnime = (animeId, initialReviews = [], username) => {
  const userReviews = getUserReviews(username).filter((r) => Number(r.animeId) === Number(animeId));
  return [
    ...userReviews,
    ...initialReviews.filter((ir) => !userReviews.some((ur) => ur.id === ir.id)),
  ];
};

// ── Review Votes ──────────────────────────────────────────────────────────────
export const getReviewVotes = (username) => safeGet(keys(username).VOTES, {});

export const toggleReviewVote = (reviewId, voteType = "helpful", username) => {
  const votes       = getReviewVotes(username);
  const currentVote = votes[reviewId];

  if (currentVote === voteType) {
    delete votes[reviewId];
  } else {
    votes[reviewId] = voteType;
  }

  safeSet(keys(username).VOTES, votes);
  return votes;
};

// ── Watchlist ─────────────────────────────────────────────────────────────────
export const getWatchlist = (username) => safeGet(keys(username).WATCHLIST, {});

export const getWatchlistStatus = (animeId, username) => {
  const list = getWatchlist(username);
  return list[animeId] ? list[animeId].status : null;
};

export const setWatchlistStatus = (animeId, status, username, extraData = {}) => {
  const list = getWatchlist(username);
  if (!status) {
    delete list[animeId];
  } else {
    const existing = list[animeId] || {};
    list[animeId] = {
      animeId,
      status,   // 'plan' | 'watching' | 'completed' | 'on_hold' | 'dropped'
      progress: extraData.progress !== undefined ? extraData.progress : (existing.progress || 0),
      notes: extraData.notes !== undefined ? extraData.notes : (existing.notes || ""),
      updatedAt: new Date().toISOString(),
    };
  }
  safeSet(keys(username).WATCHLIST, list);
  return list;
};

export const updateWatchlistItem = (animeId, updates, username) => {
  const list = getWatchlist(username);
  if (!list[animeId]) return list;
  list[animeId] = {
    ...list[animeId],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  safeSet(keys(username).WATCHLIST, list);
  return list;
};

// ── Favorites ─────────────────────────────────────────────────────────────────
export const getFavorites = (username) => safeGet(keys(username).FAVORITES, {});

export const isFavorite = (animeId, username) => {
  const favs = getFavorites(username);
  return Boolean(favs[animeId]);
};

export const toggleFavorite = (animeId, username) => {
  const favs = getFavorites(username);
  if (favs[animeId]) {
    delete favs[animeId];
  } else {
    favs[animeId] = {
      animeId,
      addedAt: new Date().toISOString(),
    };
  }
  safeSet(keys(username).FAVORITES, favs);
  return favs;
};

