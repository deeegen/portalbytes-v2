const port = "8080";
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const { router: chatRouter, setupSocket } = require("./2chat");

// Choose proxy backend based on environment variable
const proxyType = process.env.PROXY_TYPE || "corrosion";

let proxy;

if (proxyType === "corrosion") {
  const Corrosion = require("./lib/server");
  proxy = new Corrosion({
    prefix: "/service/",
    codec: "xor",
    title: "PortalBytes",
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
  proxy = new AlloyProxy({
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
} else {
  throw new Error(`Unknown proxy type: ${proxyType}`);
}

// Serve static files from /public
app.use("/", express.static(path.join(__dirname, "public")));

// Serve index.html on root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve 2chat.html on /2chat
app.get("/2chat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "2chat.html"));
});

app.get("/api/proxy-mode", (req, res) => {
  res.json({ mode: proxyType });
});

// Mount chat router for uploads and avatars
app.use("/", chatRouter);

// Proxy fallback (placed last)
app.use("/", (req, res) => {
  proxy.request(req, res);
});

// Setup Socket.IO events
setupSocket(io);

// Start server
server.listen(process.env.PORT || port, () => {
  console.log(
    `A portal has opened at http://localhost:${process.env.PORT || port}`
  );
  console.log(`Using proxy backend: ${proxyType}`);
});
