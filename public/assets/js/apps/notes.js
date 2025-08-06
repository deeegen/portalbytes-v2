// Notepad.html logic
const STORAGE_KEY = "notepad-tabs";
const ACTIVE_KEY = "notepad-activeTab";
let tabs = [],
  activeTab = 0;
const tabsContainer = document.getElementById("tabs");
const editor = document.getElementById("editor");
const lineNumbers = document.getElementById("line-numbers");
const exportBtn = document.getElementById("export-btn");
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  localStorage.setItem(ACTIVE_KEY, activeTab);
}
function load() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  const act = parseInt(localStorage.getItem(ACTIVE_KEY), 10);
  if (saved && saved.length) {
    tabs = saved;
    activeTab = isNaN(act) ? 0 : act;
  } else {
    tabs = [{ name: "Untitled", content: "" }];
    activeTab = 0;
  }
}
function renderTabs() {
  tabsContainer.innerHTML = "";
  tabs.forEach((tab, idx) => {
    const el = document.createElement("div");
    el.className = "tab" + (idx === activeTab ? " active" : "");
    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = tab.name;
    el.appendChild(title);
    const editBtn = document.createElement("span");
    editBtn.className = "edit-btn";
    editBtn.textContent = "✎";
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      title.contentEditable = true;
      title.focus();
    });
    el.appendChild(editBtn);
    title.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        title.blur();
      }
    });
    title.addEventListener("blur", () => {
      title.contentEditable = false;
      tabs[idx].name = title.textContent.trim() || "Untitled";
      save();
      renderTabs();
    });
    const closeBtn = document.createElement("span");
    closeBtn.className = "close-btn";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (tabs.length > 1) {
        tabs.splice(idx, 1);
        if (activeTab >= tabs.length) activeTab = tabs.length - 1;
        save();
        renderTabs();
        renderEditor();
      }
    });
    el.appendChild(closeBtn);
    el.addEventListener("click", () => {
      activeTab = idx;
      save();
      renderTabs();
      renderEditor();
    });
    tabsContainer.appendChild(el);
  });
  const add = document.createElement("div");
  add.id = "add-tab";
  add.textContent = "+";
  add.addEventListener("click", () => {
    tabs.push({ name: "Untitled", content: "" });
    activeTab = tabs.length - 1;
    save();
    renderTabs();
    renderEditor();
  });
  tabsContainer.appendChild(add);
}
function updateLineNumbers() {
  const count = editor.value.split("\n").length;
  lineNumbers.textContent = Array.from({ length: count }, (_, i) => i + 1).join(
    "\n"
  );
}
function renderEditor() {
  editor.value = tabs[activeTab].content;
  updateLineNumbers();
  editor.focus();
}
editor.addEventListener("input", () => {
  tabs[activeTab].content = editor.value;
  updateLineNumbers();
  save();
});
editor.addEventListener("scroll", () => {
  lineNumbers.scrollTop = editor.scrollTop;
});
exportBtn.addEventListener("click", () => {
  const blob = new Blob([tabs[activeTab].content], { type: "text/plain" });
  const a = document.createElement("a");
  a.download = tabs[activeTab].name.replace(/[^a-z0-9]/gi, "_") + ".txt";
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
});
load();
renderTabs();
renderEditor();

// Starfield logic
const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");
let stars = [];
const starCount = 300;
const interactiveFraction = 0.25;
let mouse = { x: null, y: null };
const gravityRadius = 200;
const orbitRadius = 60;
const ambientSpeedLimit = 0.05;
const maxSpeed = 1.5;
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
function createStars() {
  stars = [];
  for (let i = 0; i < starCount; i++) {
    const interactive = i < starCount * interactiveFraction;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    stars.push({
      x,
      y,
      vx: (Math.random() - 0.5) * ambientSpeedLimit,
      vy: (Math.random() - 0.5) * ambientSpeedLimit,
      radius: Math.random() * 1.5 + 0.5,
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random(),
      opacitySpeed: Math.random() * 0.02 + 0.005,
      orbiting: false,
      interactive,
    });
  }
}
function clampVelocity(vx, vy, max) {
  const speed = Math.sqrt(vx * vx + vy * vy);
  if (speed > max) {
    const scale = max / speed;
    return { vx: vx * scale, vy: vy * scale };
  }
  return { vx, vy };
}
function animateStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let star of stars) {
    const dx = mouse.x - star.x;
    const dy = mouse.y - star.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (star.interactive) {
      if (mouse.x !== null && distance < orbitRadius) star.orbiting = true;
      else star.orbiting = false;
      if (star.orbiting) {
        star.angle += 0.05;
        star.x = mouse.x + Math.cos(star.angle) * orbitRadius;
        star.y = mouse.y + Math.sin(star.angle) * orbitRadius;
        star.vx = 0;
        star.vy = 0;
      } else if (mouse.x !== null && distance < gravityRadius) {
        const force = 1 / (distance * 0.05);
        const ax = (dx / distance) * force;
        const ay = (dy / distance) * force;
        star.vx += ax;
        star.vy += ay;
        const clamped = clampVelocity(star.vx, star.vy, maxSpeed);
        star.vx = clamped.vx;
        star.vy = clamped.vy;
      }
    }
    if (!star.orbiting) {
      star.vx *= 0.98;
      star.vy *= 0.98;
      star.x += star.vx;
      star.y += star.vy;
    }
    if (star.x < 0 || star.x > canvas.width) star.vx *= -1;
    if (star.y < 0 || star.y > canvas.height) star.vy *= -1;
    star.opacity += star.opacitySpeed;
    if (star.opacity >= 1 || star.opacity <= 0) star.opacitySpeed *= -1;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${star.opacity})`;
    ctx.fill();
  }
  requestAnimationFrame(animateStars);
}
window.addEventListener("resize", () => {
  resizeCanvas();
  createStars();
});
window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
window.addEventListener("mouseout", () => {
  mouse.x = null;
  mouse.y = null;
});
resizeCanvas();
createStars();
animateStars();
