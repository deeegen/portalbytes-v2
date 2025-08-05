const STORAGE_KEY = "applicationsData";

const defaultApplications = [
  {
    name: "Notepad",
    url: "./apps/notepad.html",
    category: "Tool",
    description: "Write to your hearts content.",
  },
  {
    name: "YT Viewer",
    url: "https://projects.example.com",
    category: "Tool",
    description: "Use embeds to watch youtube. (custom youtube coming soon)",
  },
  {
    name: "2d Chat World",
    url: "2chat.html",
    category: "Creative",
    description: "Hang out in a cute 2d world, talk to people too.",
  },
];

let applications = [];

function loadApplications() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      applications = JSON.parse(stored);
      if (!Array.isArray(applications)) throw new Error("Data is not an array");
    } else {
      applications = defaultApplications;
      saveApplications();
    }
  } catch (e) {
    console.error(
      "Failed to load applications from storage, using default.",
      e
    );
    applications = defaultApplications;
    saveApplications();
  }
}

function saveApplications() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

function getApplications() {
  return applications;
}

function setApplications(newApps) {
  applications = newApps;
  saveApplications();
}

export { loadApplications, saveApplications, getApplications, setApplications };
