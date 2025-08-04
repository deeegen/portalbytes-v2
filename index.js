const port = "8080";
const Corrosion = require("./lib/server");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const { router: chatRouter, setupSocket } = require("./2chat");

// Proxy setup
const proxy = new Corrosion({
  prefix: "/service/",
  codec: "xor",
  title: "PortalBytes",
  forceHttps: true,
  requestMiddleware: [
    Corrosion.middleware.blacklist(["accounts.google.com"], "Page is blocked"),
  ],
});

// Serve static files in /public
app.use("/", express.static(__dirname + "/public"));

// Serve index.html on root
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Serve 2chat.html on /2chat
app.get("/2chat", (req, res) => {
  res.sendFile(__dirname + "/public/2chat.html");
});

// Mount chat router at root so upload path is /upload-avatar and static avatars at /uploads
app.use("/", chatRouter);

// Proxy fallback for other requests (after above)
app.use("/", (req, res) => {
  proxy.request(req, res);
});

// Setup Socket.IO event handling (works for all connected clients)
setupSocket(io);

// Start server
server.listen(process.env.PORT || port, () => {
  console.log(`A portal has opened at http://localhost:${port}`);
});
