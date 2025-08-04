const socket = io();
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Set canvas size for larger map
canvas.width = 600;
canvas.height = 600;
ctx.imageSmoothingEnabled = true;

const players = {};
const avatars = {};
let joined = false;

// Load map image with state handling
const mapImage = new Image();
let mapReady = false;

mapImage.onload = () => {
  mapReady = true;
};
mapImage.onerror = () => {
  showError("Map Image Load Failed", "Could not load /assets/media/map.png");
};

mapImage.src = "/assets/media/map.png"; // Ensure this path is valid

const usernamePrompt = document.getElementById("usernamePrompt");
const usernameInput = document.getElementById("usernameInput");
const avatarInput = document.getElementById("avatarInput");
const usernameSubmit = document.getElementById("usernameSubmit");
const chatInput = document.getElementById("chatInput");

function showError(context, err) {
  alert(`${context}:\n${err.message || err}`);
}

usernameSubmit.addEventListener("click", async () => {
  const username = usernameInput.value.trim() || "Anonymous";

  if (/[^a-zA-Z0-9_ -]/.test(username)) {
    alert("Username contains invalid characters.");
    return;
  }

  const avatarFile = avatarInput.files[0];
  if (avatarFile && avatarFile.size > 1024 * 1024) {
    alert("Avatar must be under 1MB.");
    return;
  }

  let avatar = null;
  if (avatarFile) {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("avatar", avatarFile);

    try {
      const res = await fetch("/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        alert("Avatar upload failed: " + errorText);
        return;
      }

      const data = await res.json();
      if (!data.avatar) {
        alert("No avatar returned from server.");
        return;
      }

      avatar = data.avatar;
    } catch (err) {
      showError("Error uploading avatar", err);
      return;
    }
  }

  try {
    socket.emit("setUsername", { username, avatar });
  } catch (err) {
    showError("Socket emit error", err);
    return;
  }

  usernamePrompt.style.display = "none";
  canvas.style.display = "block";
  chatInput.style.display = "block";
  chatInput.focus();
  joined = true;
});

chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const msg = chatInput.value.trim();
    if (msg) {
      try {
        socket.emit("chat", msg);
      } catch (err) {
        showError("Failed to send chat", err);
      }
      chatInput.value = "";
    }
  }
});

socket.on("currentPlayers", (data) => {
  try {
    for (const id in data) {
      players[id] = data[id];
      if (players[id].avatar && !avatars[id]) {
        const img = new Image();
        img.onerror = () =>
          alert("Failed to load avatar: " + players[id].avatar);
        img.src = "/uploads/" + players[id].avatar;
        avatars[id] = img;
      }
    }
  } catch (err) {
    showError("Error processing current players", err);
  }
});

socket.on("newPlayer", ({ id, pos }) => {
  try {
    players[id] = pos;
    if (pos.avatar) {
      const img = new Image();
      img.onerror = () =>
        alert("Failed to load new player avatar: " + pos.avatar);
      img.src = "/uploads/" + pos.avatar;
      avatars[id] = img;
    }
  } catch (err) {
    showError("Error adding new player", err);
  }
});

socket.on("playerDisconnected", (id) => {
  try {
    delete players[id];
    delete avatars[id];
  } catch (err) {
    showError("Error on player disconnect", err);
  }
});

socket.on("chat", ({ id, msg }) => {
  if (players[id]) {
    try {
      players[id].chat = msg;
      setTimeout(() => {
        if (players[id]) players[id].chat = "";
      }, 4000);
    } catch (err) {
      showError("Error updating chat message", err);
    }
  }
});

document.addEventListener("keydown", (e) => {
  if (!joined || !players[socket.id]) return;

  const speed = 5;
  const p = players[socket.id];
  let dx = 0,
    dy = 0;

  if (e.key === "ArrowUp") dy = -speed;
  if (e.key === "ArrowDown") dy = speed;
  if (e.key === "ArrowLeft") dx = -speed;
  if (e.key === "ArrowRight") dx = speed;

  const newX = p.x + dx;
  const newY = p.y + dy;

  if (newX < 0 || newX > canvas.width - 64) dx = 0;
  if (newY < 0 || newY > canvas.height - 64) dy = 0;

  if (dx || dy) {
    try {
      socket.emit("move", { x: dx, y: dy });
    } catch (err) {
      showError("Movement emit failed", err);
    }
  }
});

socket.on("move", ({ id, data }) => {
  try {
    if (!players[id]) {
      players[id] = { x: 300, y: 200, chat: "", username: "Anonymous" };
    }

    const player = players[id];
    player.x += data.x;
    player.y += data.y;

    // Clamp to map bounds
    player.x = Math.max(0, Math.min(canvas.width - 64, player.x));
    player.y = Math.max(0, Math.min(canvas.height - 64, player.y));
  } catch (err) {
    showError("Error updating player movement", err);
  }
});

function draw() {
  try {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mapReady) {
      ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
    }

    for (const id in players) {
      const p = players[id];

      if (avatars[id]) {
        ctx.drawImage(avatars[id], p.x, p.y, 64, 64);
      } else {
        ctx.fillStyle = id === socket.id ? "blue" : "red";
        ctx.fillRect(p.x, p.y, 20, 20);
      }

      // Username
      if (p.username) {
        ctx.fillStyle = "black";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(p.username, p.x + 32, p.y - 10);
      }

      // Chat bubble
      if (p.chat) {
        const padding = 4;
        const textWidth = ctx.measureText(p.chat).width;
        const bubbleWidth = textWidth + padding * 2;
        const bubbleHeight = 20;
        const bx = p.x + 32 - bubbleWidth / 2;
        const by = p.y - bubbleHeight - 25;

        ctx.fillStyle = id === socket.id ? "#cceeff" : "#ffffff";
        ctx.fillRect(bx, by, bubbleWidth, bubbleHeight);
        ctx.strokeStyle = "#000000";
        ctx.strokeRect(bx, by, bubbleWidth, bubbleHeight);
        ctx.fillStyle = "#000000";
        ctx.fillText(p.chat, p.x + 32, by + 15);
      }
    }
  } catch (err) {
    showError("Drawing error", err);
  }

  requestAnimationFrame(draw);
}
draw();
