import { getApplications, setApplications } from "./storage.js";
import { populateCategoryFilter, renderCards } from "./ui.js";

const jsonEditBtn = document.getElementById("jsonEditBtn");
const jsonModal = document.getElementById("jsonModal");
const jsonTextarea = document.getElementById("jsonTextarea");
const jsonSaveBtn = document.getElementById("jsonSaveBtn");
const jsonCancelBtn = document.getElementById("jsonCancelBtn");
const appFrame = document.getElementById("appFrame");

function openJsonModal() {
  jsonTextarea.value = JSON.stringify(getApplications(), null, 2);
  jsonModal.style.display = "flex";
  jsonTextarea.focus();
}

function closeJsonModal() {
  jsonModal.style.display = "none";
}

function saveJsonEdit() {
  try {
    const parsed = JSON.parse(jsonTextarea.value);
    if (!Array.isArray(parsed)) {
      alert("JSON must be an array of applications.");
      return;
    }

    for (const app of parsed) {
      if (
        typeof app.name !== "string" ||
        typeof app.url !== "string" ||
        typeof app.category !== "string"
      ) {
        alert(
          'Each application must have "name", "url", and "category" string fields.'
        );
        return;
      }
      if (typeof app.description !== "string") app.description = "";
    }

    setApplications(parsed);
    populateCategoryFilter();
    renderCards();
    closeJsonModal();
    appFrame.style.display = "none";
  } catch (e) {
    alert("Invalid JSON: " + e.message);
  }
}

export { openJsonModal, closeJsonModal, saveJsonEdit };
