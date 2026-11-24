// server.js

// ------------------ Module Imports ------------------
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const env = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${env}` });
if(process.env.NODE_ENV==='development'){
 const runtime=require('node:path').resolve(__dirname,'../tools/local-runtime.cjs');
 if(require('node:fs').existsSync(runtime))require(runtime)('storage');
}
console.log(`Running in ${env} mode`);
require('./config/customer-deployment')();

// Custom Modules
const routes = require("./routes");

const config = require("./config"); // Define constants like PORT in config.js

const authMiddleware = require("./middleware/authMiddleware");

// ------------------ Server Setup ------------------
const app = express();

// ------------------ Middleware ------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Application-Name"],
  }),
);

// ------------------ Routes ------------------
app.get("/health", (req, res) =>
  res.json({ service: "storage-service", status: "ok" }),
);
app.use("/api/ss", routes);

// Serve uploaded files statically
// MMMS files are available only through the scoped, authenticated download route.
const protectPrivateMmmsFiles = (req, res, next) => {
  let relative;
  try {
    relative = require("node:path")
      .posix.normalize(decodeURIComponent(req.path).replaceAll("\\", "/"))
      .replace(/^\/+/, "");
  } catch {
    return res.status(400).end();
  }
  if (relative.split("/")[0].toLowerCase() === "mmms")
    return res.status(404).end();
  next();
};
app.use("/api/ss/uploads", protectPrivateMmmsFiles);
if (process.env.STORAGE_MMMS_ONLY !== "true") {
  app.use("/api/ss/uploads", express.static("uploads"));
  // Preserve the existing CF storage routes while keeping private MMMS files protected.
  app.use("/api/cfss", routes);
  app.use(
    "/api/cfss/U2FsdGVkX1968EpP4fSsYPWixZ9DT%2FeO0Gs9v4ppYsU%3D",
    protectPrivateMmmsFiles,
    express.static("uploads"),
  );
}

// ------------------ Error Handling ------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
});

// ------------------ Server Start ------------------
const PORT = config.PORT || 8080;
if (require.main === module)
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
    // logger.info(`Server is running on port ${PORT}`);
  });
module.exports = app;
