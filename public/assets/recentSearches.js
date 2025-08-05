const RECENT_KEY = "pb_recent_searches";
const MAX_RECENT = 5;

/**
 * @typedef {Object} SearchEntry
 * @property {string} value // The actual search term
 * @property {number} count // Number of times this term was searched
 * @property {number} lastSearched // Timestamp of last search
 */

/** Load recent searches from localStorage */
function loadRecentSearches() {
  const raw = localStorage.getItem(RECENT_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(isValidEntry) : [];
  } catch {
    return [];
  }
}

/** Validate search entry shape */
function isValidEntry(entry) {
  return (
    typeof entry === "object" &&
    typeof entry.value === "string" &&
    typeof entry.count === "number" &&
    typeof entry.lastSearched === "number"
  );
}

/** Save recent searches to localStorage */
function saveRecentSearches(arr) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
}

/** Normalize search term for comparison */
function normalize(val) {
  return val.trim().toLowerCase();
}

/** Add a new search term to recent history */
function addRecentSearch(val) {
  if (!val || typeof val !== "string" || !val.trim()) return;

  const normalized = normalize(val);
  const now = Date.now();
  let recent = loadRecentSearches();

  // Check if the term already exists (fuzzy match)
  let existing = recent.find((entry) => normalize(entry.value) === normalized);

  if (existing) {
    existing.count += 1;
    existing.lastSearched = now;
    existing.value = val.trim(); // Keep original casing if changed
  } else {
    recent.push({
      value: val.trim(),
      count: 1,
      lastSearched: now,
    });
  }

  // Rank by weighted relevance (recency + frequency)
  recent.sort(
    (a, b) => b.count * 2 + b.lastSearched - (a.count * 2 + a.lastSearched)
  );

  // Limit to MAX_RECENT
  if (recent.length > MAX_RECENT) {
    recent = recent.slice(0, MAX_RECENT);
  }

  saveRecentSearches(recent);
}
