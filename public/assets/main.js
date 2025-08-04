// --- Bookmarks UI + Behavior Logic ---
function renderBookmarks() {
  const list = document.getElementById("bookmarks-list");
  let bms = loadBookmarks();
  if (!Array.isArray(bms)) bms = [];
  if (bms.length > 6) {
    list.style.maxHeight = "144px";
  } else {
    list.style.maxHeight = "";
  }
  list.innerHTML = "";
  bms.forEach((bm, idx) => {
    const el = document.createElement("span");
    el.className = "bookmark";
    el.title = (bm.title?.length > 0 ? bm.title + " · " : "") + bm.url;
    el.onclick = (e) => {
      if (e.target.classList.contains("del-btn")) return;
      goToUrlProxy(bm.url);
    };
    const tDiv = document.createElement("span");
    tDiv.className = "bookmark-title";
    tDiv.textContent =
      bm.title && bm.title.length > 0
        ? bm.title.length > 35
          ? bm.title.slice(0, 32) + "…"
          : bm.title
        : "(no title)";
    el.appendChild(tDiv);

    const delBtn = document.createElement("button");
    delBtn.className = "del-btn";
    delBtn.title = "Delete";
    delBtn.innerHTML = "&times;";
    delBtn.onclick = function (ev) {
      ev.stopPropagation();
      deleteBookmark(idx);
    };
    el.appendChild(delBtn);
    list.appendChild(el);
  });
}

async function addBookmarkFromInput() {
  const input = document.querySelector(".search input");
  const url = normalizeInputUrl(input.value.trim());
  if (!url) {
    alert("Please enter a valid URL.");
    return;
  }
  let bookmarks = loadBookmarks() || [];
  if (bookmarks.find((b) => b.url === url)) {
    alert("Already bookmarked.");
    return;
  }
  let title = "";
  try {
    title = await fetchBookmarkTitle(url);
  } catch (e) {
    title = "";
  }
  bookmarks.push({ url: url, title: title || "" });
  saveBookmarks(bookmarks);
  renderBookmarks();
}

function deleteBookmark(idx) {
  let bms = loadBookmarks() || [];
  bms.splice(idx, 1);
  saveBookmarks(bms);
  renderBookmarks();
}

// === Recent Search Helpers ===
const RECENT_KEY = "pb_recent_searches";
const MAX_RECENT = 10;

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

function go() {
  var inputEl = document.getElementById("input");
  var input = inputEl.value.trim();

  if (!input) return;

  // Add to recent
  addRecentSearch(input);

  const isUrl = validateAndProcessUrl(input);
  const iframeMode = localStorage.getItem("settings_iframeMode") === "true";
  let targetUrl;

  if (isUrl) {
    targetUrl = input.startsWith("http") ? input : "http://" + input;
  } else {
    targetUrl = "https://www.qwant.com/?q=" + encodeURIComponent(input);
  }

  if (iframeMode) {
    sessionStorage.setItem("proxyUrl", targetUrl);
    window.location.href = "/proxy.html";
  } else {
    sessionStorage.setItem("gatewayUrl", targetUrl);
    window.location.href =
      "/service/gateway?url=" + encodeURIComponent(targetUrl);
  }
}

function validateAndProcessUrl(input) {
  const patterns = [
    /^https?:\/\/.+/i,
    /^\/\/.+/,
    /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/,
    /^(?:\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/,
    /^localhost(:\d+)?(\/.*)?$/i,
  ];
  return patterns.some((pattern) => pattern.test(input));
}

document.addEventListener("DOMContentLoaded", async () => {
  let bookmarks = loadBookmarks();
  if (!bookmarks) {
    let newBms = [];
    for (let e of EXAMPLES) {
      let title = "";
      try {
        title = await fetchBookmarkTitle(e.url);
      } catch {}
      newBms.push({ url: e.url, title });
    }
    saveBookmarks(newBms);
  }
  renderBookmarks();

  const inputField = document.getElementById("input");
  const popup = document.getElementById("recent-searches-popup");

  if (inputField && popup) {
    inputField.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        go();
      } else if (event.key === "Escape") {
        popup.style.display = "none";
      }
    });

    inputField.addEventListener("focus", () => {
      const list = loadRecentSearches();
      if (list.length === 0) {
        popup.style.display = "none";
        return;
      }

      popup.innerHTML = "";
      for (const item of list) {
        const div = document.createElement("div");
        div.textContent = item;
        div.tabIndex = 0;
        div.addEventListener("mousedown", (e) => {
          e.preventDefault();
          inputField.value = item;
          popup.style.display = "none";
          inputField.focus();
        });
        popup.appendChild(div);
      }

      const rect = inputField.getBoundingClientRect();
      popup.style.width = rect.width + "px";
      popup.style.display = "block";
    });

    inputField.addEventListener("input", () => {
      const value = inputField.value.trim().toLowerCase();
      const children = Array.from(popup.children);
      children.forEach((child) => {
        child.style.display = child.textContent.toLowerCase().includes(value)
          ? "block"
          : "none";
      });
      const anyVisible = children.some((el) => el.style.display !== "none");
      popup.style.display = anyVisible ? "block" : "none";
    });

    document.addEventListener("mousedown", (e) => {
      if (e.target !== inputField && !popup.contains(e.target)) {
        popup.style.display = "none";
      }
    });

    window.addEventListener("resize", () => {
      const rect = inputField.getBoundingClientRect();
      popup.style.width = rect.width + "px";
    });
  } else {
    console.warn("Input field or popup not found.");
  }
});

// ===== Keybind Redirect Logic - Runs only on top-level index.html =====
(function () {
  const DEFAULT_KEYBIND = "ctrl+shift+r";

  function parseKeybind(str) {
    return str.toLowerCase().replace(/\s+/g, "").split("+").sort().join("+");
  }

  document.addEventListener("keydown", (e) => {
    if (
      !window.top.location.pathname.endsWith("index.html") &&
      window.top.location.pathname !== "/"
    ) {
      return;
    }

    const parts = [];
    if (e.ctrlKey) parts.push("ctrl");
    if (e.shiftKey) parts.push("shift");
    if (e.altKey) parts.push("alt");
    if (e.metaKey) parts.push("meta");

    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
    if (!["control", "shift", "alt", "meta"].includes(key)) {
      parts.push(key);
    }

    const pressed = parts.sort().join("+");

    const customEnabled =
      localStorage.getItem("custom_keybind_enabled") === "true";
    const savedBind =
      localStorage.getItem("redirect_keybind") || DEFAULT_KEYBIND;
    const targetBind = parseKeybind(
      customEnabled ? savedBind : DEFAULT_KEYBIND
    );
    const targetURL = localStorage.getItem("redirect_url") || "";

    if (pressed === targetBind && targetURL) {
      window.top.location.href = targetURL;
    }
  });
})();

(function () {
  const DEFAULT_KEYBIND = "ctrl+shift+r";

  function parseKeybind(str) {
    return str.toLowerCase().replace(/\s+/g, "").split("+").sort().join("+");
  }

  function tryRedirect(pressed) {
    const customEnabled =
      localStorage.getItem("custom_keybind_enabled") === "true";
    const savedBind =
      localStorage.getItem("redirect_keybind") || DEFAULT_KEYBIND;
    const targetBind = parseKeybind(
      customEnabled ? savedBind : DEFAULT_KEYBIND
    );
    const targetURL = localStorage.getItem("redirect_url") || "";

    if (pressed === targetBind && targetURL) {
      window.location.href = targetURL;
    }
  }

  window.addEventListener("message", (event) => {
    if (
      event.data &&
      event.data.type === "keybind-pressed" &&
      typeof event.data.keybind === "string"
    ) {
      tryRedirect(event.data.keybind);
    }
  });

  document.addEventListener("keydown", (e) => {
    const parts = [];
    if (e.ctrlKey) parts.push("ctrl");
    if (e.shiftKey) parts.push("shift");
    if (e.altKey) parts.push("alt");
    if (e.metaKey) parts.push("meta");

    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
    if (!["control", "shift", "alt", "meta"].includes(key)) {
      parts.push(key);
    }

    const pressed = parts.sort().join("+");
    tryRedirect(pressed);
  });
})();
