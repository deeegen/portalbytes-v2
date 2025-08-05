import { renderCards } from "./ui.js";
import { openJsonModal, closeJsonModal, saveJsonEdit } from "./jsonModal.js";

function bindEvents() {
  document.getElementById("searchInput").addEventListener("input", renderCards);
  document
    .getElementById("categoryFilter")
    .addEventListener("change", renderCards);
  document
    .getElementById("jsonEditBtn")
    .addEventListener("click", openJsonModal);
  document
    .getElementById("jsonCancelBtn")
    .addEventListener("click", closeJsonModal);
  document
    .getElementById("jsonSaveBtn")
    .addEventListener("click", saveJsonEdit);

  document.getElementById("jsonModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("jsonModal")) closeJsonModal();
  });

  window.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      document.getElementById("jsonModal").style.display === "flex"
    ) {
      closeJsonModal();
    }
  });
}

export { bindEvents };
