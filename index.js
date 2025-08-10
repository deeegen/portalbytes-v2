const port = "8080";
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const { router: chatRouter, setupSocket } = require("./2chat");

// Dynamic proxy configuration
let currentProxy = null;
let currentProxyType = null;

function initializeProxy(proxyType) {
  if (proxyType === "corrosion") {
    const Corrosion = require("./lib/server");
    return new Corrosion({
      prefix: "/service/",
      codec: "xor",
      title: "PBsV3",
      forceHttps: true,
      requestMiddleware: [
        Corrosion.middleware.blacklist(
          ["accounts.google.com"],
          "Page is blocked"
        ),
      ],
    });
  } else if (proxyType === "alloy") {
    const AlloyProxy = require("./alloy/index.js");
    const proxy = new AlloyProxy({
      prefix: "/web",
      localAddress: [],
      blacklist: ["https://sevenworks.eu.org/bad-site"],
      ssl: false,
      indexFile: "index.html",
    });

    // Hook up WebSocket support if available
    if (typeof proxy.ws === "function") {
      proxy.ws(server);
    }
    return proxy;
  } else {
    throw new Error(`Unknown proxy type: ${proxyType}`);
  }
}

// Initialize with default proxy type from environment
const defaultProxyType = process.env.PROXY_TYPE || "corrosion";
currentProxy = initializeProxy(defaultProxyType);
currentProxyType = defaultProxyType;

// Serve static files from /public
app.use("/", express.static(path.join(__dirname, "public")));

// Add JSON body parsing middleware
app.use(express.json());

// Serve index.html on root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve 2chat.html on /2chat
app.get("/2chat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "2chat.html"));
});

// API endpoint to get current proxy mode
app.get("/api/proxy-mode", (req, res) => {
  res.json({ mode: currentProxyType });
});

// API endpoint to change proxy backend dynamically
app.post("/api/set-proxy-backend", (req, res) => {
  const { backend } = req.body;

  if (!backend || !["corrosion", "alloy"].includes(backend)) {
    return res.status(400).json({ error: "Invalid backend type" });
  }

  try {
    // Initialize new proxy
    const newProxy = initializeProxy(backend);

    // Replace current proxy
    currentProxy = newProxy;
    currentProxyType = backend;

    // Re-hook WebSocket support for alloy if needed
    if (backend === "alloy" && typeof currentProxy.ws === "function") {
      currentProxy.ws(server);
    }

    console.log(`Proxy backend switched to: ${backend}`);
    res.json({ success: true, mode: backend });
  } catch (error) {
    console.error(`Failed to switch proxy backend: ${error.message}`);
    res.status(500).json({ error: "Failed to switch proxy backend" });
  }
});

// Mount chat router for uploads and avatars
app.use("/", chatRouter);

// Dynamic proxy fallback
app.use("/", (req, res) => {
  if (currentProxy && typeof currentProxy.request === "function") {
    currentProxy.request(req, res);
  } else {
    res.status(503).send("Proxy service unavailable");
  }
});

// Setup Socket.IO events
setupSocket(io);

// Start server
server.listen(process.env.PORT || port, () => {
  console.log(
    `A portal has opened at http://localhost:${process.env.PORT || port}`
  );
  console.log(`Default backend: ${currentProxyType}`);
});
