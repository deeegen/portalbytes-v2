// apps.js (Main Entry Point)

import {
  loadApplications,
  saveApplications,
  getApplications,
} from "./apps/storage.js";

import {
  getCategories,
  populateCategoryFilter,
  renderCards,
  createCard,
  setIframePreference,
} from "./apps/ui.js";

import {
  openJsonModal,
  closeJsonModal,
  saveJsonEdit,
} from "./apps/jsonModal.js";

import {
  createEditModal,
  openEditModal,
  closeEditModal,
  saveEditModal,
} from "./apps/editModal.js";

import { bindEvents } from "./apps/events.js";

// Initialize
loadApplications();
populateCategoryFilter();
renderCards();
createEditModal();
bindEvents();

// Iframe toggle listener
const iframeToggle = document.getElementById("iframeToggle");
if (iframeToggle) {
  iframeToggle.addEventListener("change", (e) => {
    const value = e.target.checked;
    setIframePreference(value);
  });
}
