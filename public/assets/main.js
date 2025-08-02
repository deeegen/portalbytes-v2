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

function go() {
  var input = document.getElementById("input").value.trim();
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
  if (inputField) {
    inputField.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        go();
      }
    });

    inputField.addEventListener("input", (event) => {
      const value = event.target.value.trim();
      if (value && !validateAndProcessUrl(value) && value.length > 3) {
        inputField.style.borderColor = "#ff6b6b";
      } else {
        inputField.style.borderColor = "#fffb00";
      }
    });
  } else {
    console.warn("Input field not found.");
  }
});
