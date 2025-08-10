const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");

settingsBtn.addEventListener("click", () => {
  settingsModal.style.display = "flex";
  settingsModal.setAttribute("aria-hidden", "false");
});

closeSettingsBtn.addEventListener("click", () => {
  settingsModal.style.display = "none";
  settingsModal.setAttribute("aria-hidden", "true");
});

settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) {
    settingsModal.style.display = "none";
    settingsModal.setAttribute("aria-hidden", "true");
  }
});
