const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const atob = (str) => Buffer.from(str, "base64").toString("utf-8");

class AlloyProxy {
  constructor(options = {}) {
    // Configuration from options or fallback
    this.prefix = options.prefix || "/web";
    this.localAddresses = options.localAddress || [];
    this.blockedHostnames = options.blacklist || [];
    this.indexFile = options.indexFile || "index.html";
    this.ssl = options.ssl || false;

    // Load internal proxy logic
    this.proxy = new (require("./lib/index"))(this.prefix, {
      localAddress: this.localAddresses,
      blacklist: this.blockedHostnames,
    });
  }

  request(req, res) {
    if (req.url.startsWith(this.prefix)) {
      this.proxy.http(req, res);
      return;
    }

    // Parse pathname and query params
    req.pathname = req.url.split("#")[0].split("?")[0];
    req.query = {};
    req.url
      .split("#")[0]
      .split("?")
      .slice(1)
      .join("?")
      .split("&")
      .forEach((query) => {
        const [key, ...value] = query.split("=");
        if (key) req.query[key] = value.join("=");
      });

    // Handle redirect requests with base64 encoded URLs
    if (
      req.query.url &&
      ["/prox", "/prox/", "/session", "/session/"].includes(req.pathname)
    ) {
      let url = atob(req.query.url);
      if (url.startsWith("https://") || url.startsWith("http://")) {
        // leave as is
      } else if (url.startsWith("//")) {
        url = "http:" + url;
      } else {
        url = "http://" + url;
      }

      res.writeHead(301, {
        location: this.prefix + this.proxy.proxifyRequestURL(url),
      });
      res.end("");
      return;
    }

    // Serve static files from project-root/public (one level up)
    const publicPath = path.join(__dirname, "..", "public", req.pathname);

    const sendError = () => {
      res.statusCode = 404;
      // Cache error page in memory for efficiency (optional)
      if (!this.errorPage) {
        this.errorPage = fs.readFileSync(
          path.join(__dirname, "lib", "error.html"),
          "utf-8"
        );
      }
      res.end(
        this.errorPage.replace("%ERR%", `Cannot ${req.method} ${req.pathname}`)
      );
    };

    fs.lstat(publicPath, (err, stats) => {
      if (err) return sendError();

      if (stats.isDirectory()) {
        const indexPath = path.join(publicPath, this.indexFile);
        fs.access(indexPath, fs.constants.R_OK, (err) => {
          if (err) return sendError();
          fs.createReadStream(indexPath).pipe(res);
        });
      } else if (stats.isFile()) {
        fs.createReadStream(publicPath).pipe(res);
      } else {
        sendError();
      }
    });
  }

  ws(server) {
    this.proxy.ws(server);
  }
}

module.exports = AlloyProxy;
