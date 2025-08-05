import { getApplications, saveApplications } from "./storage.js";
import { openEditModal } from "./editModal.js";

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const cardsContainer = document.getElementById("cardsContainer");
const appFrame = document.getElementById("appFrame");

let useIframe = true;

function setIframePreference(value) {
  useIframe = value;
}

function getIframePreference() {
  return useIframe;
}

function getCategories() {
  const apps = getApplications();
  const cats = new Set(apps.map((app) => app.category));
  return Array.from(cats).sort();
}

function populateCategoryFilter() {
  while (categoryFilter.options.length > 1) {
    categoryFilter.remove(1);
  }
  const cats = getCategories();
  cats.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
}

function createCard(app, index) {
  const card = document.createElement("div");
  card.className = "card";
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");
  card.setAttribute(
    "aria-label",
    `${app.name}, category: ${app.category}. Click to open.`
  );

  const title = document.createElement("h2");
  title.textContent = app.name;
  card.appendChild(title);

  const desc = document.createElement("p");
  desc.textContent = app.description;
  card.appendChild(desc);

  const editBtn = document.createElement("button");
  editBtn.className = "edit-btn";
  editBtn.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i>';
  editBtn.setAttribute("aria-label", `Edit ${app.name}`);
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openEditModal(index);
  });
  card.appendChild(editBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
  deleteBtn.setAttribute("aria-label", `Delete ${app.name}`);
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${app.name}"?`)) {
      const apps = getApplications();
      apps.splice(index, 1);
      saveApplications();
      renderCards();
      populateCategoryFilter();
      appFrame.style.display = "none";
    }
  });
  card.appendChild(deleteBtn);

  card.addEventListener("click", () => {
    if (getIframePreference()) {
      appFrame.src = app.url;
      appFrame.style.display = "block";
      appFrame.focus();
    } else {
      window.open(app.url, "_blank");
    }
  });

  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      card.click();
    }
  });

  return card;
}

function renderCards() {
  const apps = getApplications();
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;
  cardsContainer.innerHTML = "";

  let filtered = apps.filter((app) => {
    const matchesCategory =
      selectedCategory === "all" || app.category === selectedCategory;
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm) ||
      app.description.toLowerCase().includes(searchTerm) ||
      app.category.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    const noResult = document.createElement("p");
    noResult.textContent = "No applications found matching your criteria.";
    noResult.style.color = "var(--accent)";
    noResult.style.textAlign = "center";
    cardsContainer.appendChild(noResult);
    appFrame.style.display = "none";
    return;
  }

  filtered.forEach((app, idx) => {
    const originalIndex = getApplications().indexOf(app);
    const card = createCard(app, originalIndex);
    cardsContainer.appendChild(card);
  });
}

export {
  getCategories,
  populateCategoryFilter,
  createCard,
  renderCards,
  setIframePreference,
  getIframePreference,
};
