import { getApplications, saveApplications } from "./storage.js";
import { populateCategoryFilter, renderCards } from "./ui.js";

let editModal,
  editName,
  editUrl,
  editCategory,
  editDesc,
  editSaveBtn,
  editCancelBtn,
  editIndex;

function createEditModal() {
  editModal = document.createElement("div");
  editModal.className = "modal-bg";
  editModal.style.display = "none";
  editModal.setAttribute("role", "dialog");
  editModal.setAttribute("aria-modal", "true");
  editModal.setAttribute("aria-labelledby", "editModalTitle");

  const modalContent = document.createElement("div");
  modalContent.className = "modal";

  modalContent.innerHTML = `
    <h3 id="editModalTitle">Edit Application</h3>
    <label for="editName">Name</label>
    <input type="text" id="editName" required />
    <label for="editUrl">URL</label>
    <input type="url" id="editUrl" required />
    <label for="editCategory">Category</label>
    <input type="text" id="editCategory" required />
    <label for="editDesc">Description</label>
    <textarea id="editDesc"></textarea>
    <div class="modal-buttons">
      <button id="editSaveBtn">Save</button>
      <button id="editCancelBtn">Cancel</button>
    </div>`;

  editModal.appendChild(modalContent);
  document.body.appendChild(editModal);

  editName = modalContent.querySelector("#editName");
  editUrl = modalContent.querySelector("#editUrl");
  editCategory = modalContent.querySelector("#editCategory");
  editDesc = modalContent.querySelector("#editDesc");
  editSaveBtn = modalContent.querySelector("#editSaveBtn");
  editCancelBtn = modalContent.querySelector("#editCancelBtn");

  editCancelBtn.addEventListener("click", closeEditModal);
  editSaveBtn.addEventListener("click", saveEditModal);
  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) closeEditModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && editModal.style.display === "flex") {
      closeEditModal();
    }
  });
}

function openEditModal(index) {
  const app = getApplications()[index];
  editIndex = index;
  editName.value = app.name;
  editUrl.value = app.url;
  editCategory.value = app.category;
  editDesc.value = app.description;
  editModal.style.display = "flex";
  editName.focus();
}

function closeEditModal() {
  editModal.style.display = "none";
}

function saveEditModal() {
  const name = editName.value.trim();
  const url = editUrl.value.trim();
  const category = editCategory.value.trim();
  const description = editDesc.value.trim();

  if (!name || !url || !category) {
    alert("Name, URL, and Category are required.");
    return;
  }

  try {
    new URL(url);
  } catch {
    alert("Please enter a valid URL.");
    return;
  }

  const apps = getApplications();
  apps[editIndex] = { name, url, category, description };
  saveApplications();
  populateCategoryFilter();
  renderCards();
  closeEditModal();
  document.getElementById("appFrame").style.display = "none";
}

export { createEditModal, openEditModal, closeEditModal, saveEditModal };
