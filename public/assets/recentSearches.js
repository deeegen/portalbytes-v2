const RECENT_KEY = "pb_recent_searches";
const MAX_RECENT = 5;

function loadRecentSearches() {
  const raw = localStorage.getItem(RECENT_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(arr) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
}

function addRecentSearch(val) {
  if (!val || typeof val !== "string" || !val.trim()) return;
  let recent = loadRecentSearches();
  recent = recent.filter((v) => v !== val);
  recent.unshift(val);
  if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
  saveRecentSearches(recent);
}
