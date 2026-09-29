import { CURATED_ANIME } from "../data/curatedAnime";

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

// Alias dictionary for instant abbreviation matching
const ALIASES = {
  aot: "Attack on Titan",
  jjk: "Jujutsu Kaisen",
  fmab: "Fullmetal Alchemist",
  fma: "Fullmetal Alchemist",
  hxh: "Hunter x Hunter",
  csm: "Chainsaw Man",
  nge: "Neon Genesis Evangelion",
  evangelion: "Neon Genesis Evangelion",
  mob: "Mob Psycho 100",
  "your name": "Your Name.",
  "demon slayer": "Demon Slayer",
  "koe no katachi": "A Silent Voice",
  "silent voice": "A Silent Voice",
  suzume: "Suzume",
};

// Helper to generate realistic score distribution percentages from an overall score
function generateDistribution(score = 8.5) {
  const s = Math.min(10, Math.max(1, score));
  const dist = {};
  let total = 0;
  for (let i = 1; i <= 10; i++) {
    const diff = Math.abs(i - s);
    const weight = Math.max(0.5, Math.exp(-0.8 * diff * diff) * 100);
    dist[i] = weight;
    total += weight;
  }
  const normalized = {};
  for (let i = 1; i <= 10; i++) {
    normalized[i] = Number(((dist[i] / total) * 100).toFixed(1));
  }
  return normalized;
}

// Convert Jikan MAL item to our AniLib format
export function transformJikanAnime(item) {
  const isMovie = item.type === "Movie";
  const releaseYear = item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : 2023);
  const score = item.score ? Number(item.score.toFixed(1)) : 8.2;

  return {
    id: item.mal_id,
    title: item.title_english || item.title || "Untitled Anime",
    japaneseTitle: item.title_japanese || item.title,
    type: isMovie ? "Movie" : (item.type || "TV Series"),
    year: releaseYear,
    season: item.season ? `${item.season.charAt(0).toUpperCase() + item.season.slice(1)} ${releaseYear || ""}`.trim() : (isMovie ? "Theatrical" : "TV"),
    episodes: isMovie ? `1 Film (${item.duration || "120 min"})` : (item.episodes ? `${item.episodes} Episodes` : "Ongoing"),
    duration: item.duration || "24 min per ep",
    status: item.status || "Finished Airing",
    rating: score,
    ratingCount: item.scored_by || 125000,
    scoreDistribution: generateDistribution(score),
    ageRating: item.rating ? item.rating.split(" ")[0] : "PG-13",
    studio: item.studios?.[0]?.name || "Animation Studio",
    genres: (item.genres && item.genres.length > 0) ? item.genres.map(g => g.name) : ["Action", "Fantasy"],
    synopsis: item.synopsis || "No synopsis currently available for this anime.",
    posterImage: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
    backdropImage: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
    trailerYoutubeId: item.trailer?.youtube_id || null,
    characters: [
      { name: "Main Protagonist", role: "Main", voiceActor: "Cast" },
      { name: "Supporting Character", role: "Supporting", voiceActor: "Cast" }
    ],
    reviews: []
  };
}

// In-memory cache for API requests
const apiCache = new Map();

export async function searchAnimeOnline(query) {
  if (!query || query.trim() === "") {
    return CURATED_ANIME;
  }

  const qRaw = query.trim().toLowerCase();
  const expandedTerm = ALIASES[qRaw] || qRaw;

  // First match against curated list (broad match across fields + aliases)
  const curatedMatches = CURATED_ANIME.filter(anime => {
    const t = anime.title.toLowerCase();
    const jt = (anime.japaneseTitle || "").toLowerCase();
    const st = (anime.studio || "").toLowerCase();
    const syn = (anime.synopsis || "").toLowerCase();
    const yr = String(anime.year || "");
    const tp = (anime.type || "").toLowerCase();

    return t.includes(qRaw) ||
           t.includes(expandedTerm.toLowerCase()) ||
           jt.includes(qRaw) ||
           st.includes(qRaw) ||
           syn.includes(qRaw) ||
           yr.includes(qRaw) ||
           tp.includes(qRaw) ||
           anime.genres.some(g => g.toLowerCase().includes(qRaw));
  });

  // If cached from previous online search, return merged
  if (apiCache.has(`search_${qRaw}`)) {
    const cached = apiCache.get(`search_${qRaw}`);
    return mergeUniqueAnime(curatedMatches, cached);
  }

  try {
    const searchTarget = expandedTerm || qRaw;
    const response = await fetch(`${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(searchTarget)}&limit=10&sfw=true`);
    if (!response.ok) {
      return curatedMatches;
    }

    const data = await response.json();
    if (data && data.data) {
      const transformed = data.data.map(transformJikanAnime);
      apiCache.set(`search_${qRaw}`, transformed);
      return mergeUniqueAnime(curatedMatches, transformed);
    }
  } catch (error) {
    console.warn("Jikan API search failed, using curated data:", error);
  }

  return curatedMatches;
}

export async function getAnimeDetails(id) {
  const existing = CURATED_ANIME.find(a => Number(a.id) === Number(id));
  if (existing) {
    return existing;
  }

  if (apiCache.has(`anime_${id}`)) {
    return apiCache.get(`anime_${id}`);
  }

  try {
    const response = await fetch(`${JIKAN_BASE_URL}/anime/${id}/full`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.data) {
        const transformed = transformJikanAnime(data.data);
        apiCache.set(`anime_${id}`, transformed);
        return transformed;
      }
    }
  } catch (error) {
    console.warn(`Failed to fetch anime ID ${id}:`, error);
  }

  return null;
}

function mergeUniqueAnime(curated, fetched) {
  const map = new Map();
  curated.forEach(item => map.set(item.id, item));
  fetched.forEach(item => {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}
