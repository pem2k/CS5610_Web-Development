const express = require("express");
const session = require("express-session");
const passport = require("./config/passport");
const authRoutes = require("./routes/auth");
const curriculumRoutes = require("./routes/curriculum");
const batchRoutes = require("./routes/batches");
const attendanceRoutes = require("./routes/attendance");
const feeRoutes = require("./routes/fees");
const { connectDB } = require("./config/db");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "natyakosha_fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/curriculum", curriculumRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fees", feeRoutes);

// Core API Status Check Route
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    message: "Natyakosha backend API is running successfully.",
    timestamp: new Date(),
  });
});

// Serve React build in production
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// Start Database connection then listen on port
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(
      "Critical: Failed to start server due to database connection issue",
      err,
    );
  });const express = require("express");
const session = require("express-session");
const passport = require("./config/passport");
const authRoutes = require("./routes/auth");
const curriculumRoutes = require("./routes/curriculum");
const batchRoutes = require("./routes/batches");
const attendanceRoutes = require("./routes/attendance");
const feeRoutes = require("./routes/fees");
const { connectDB } = require("./config/db");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "natyakosha_fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/curriculum", curriculumRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fees", feeRoutes);

// Core API Status Check Route
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    message: "Natyakosha backend API is running successfully.",
    timestamp: new Date(),
  });
});

// Serve React build in production
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// Start Database connection then listen on port
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(
      "Critical: Failed to start server due to database connection issue",
      err,
    );
  });
