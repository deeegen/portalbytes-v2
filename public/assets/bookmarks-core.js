// --- Bookmarks Core Logic ---
const LOCAL_KEY = "portalBytesBookmarksV1";
const EXAMPLES = [{ url: "https://duckduckgo.com", title: "" }];

function normalizeInputUrl(rawInput) {
  let normalizedUrl;
  try {
    if (rawInput.startsWith("//")) normalizedUrl = new URL("https:" + rawInput);
    else if (!/^https?:\/\//i.test(rawInput)) {
      if (rawInput.includes("/") || rawInput.includes("."))
        normalizedUrl = new URL("https://" + rawInput);
      else normalizedUrl = new URL("https://" + rawInput + ".com");
    } else {
      normalizedUrl = new URL(rawInput);
    }
    if (!normalizedUrl.hostname || normalizedUrl.hostname.length < 2)
      throw new Error("Invalid hostname");
  } catch (e) {
    return null;
  }
  return normalizedUrl.href;
}

function fetchBookmarkTitle(url) {
  // REPLACE WITH YOUR OWN LAZY
  const apiKey = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
  return fetch(
    "https://api.linkpreview.net/?key=" +
      encodeURIComponent(apiKey) +
      "&q=" +
      encodeURIComponent(url)
  )
    .then((res) => {
      if (!res.ok) throw new Error("No response");
      return res.json();
    })
    .then((data) => data.title || "")
    .catch(() => "");
}

function saveBookmarks(list) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
}

function loadBookmarks() {
  try {
    let bms = JSON.parse(localStorage.getItem(LOCAL_KEY));
    if (!Array.isArray(bms)) throw new Error("Bookmarks not an array");
    return bms;
  } catch {
    return null;
  }
}

function goToUrlProxy(rawInput) {
  const url = normalizeInputUrl(rawInput);
  if (!url) {
    alert("Invalid URL.");
    return;
  }
  const encodedFullUrl = btoa(url);
  const proxyUrl = `/web/_${encodedFullUrl}_/`;
  window.location.href = proxyUrl;
}
