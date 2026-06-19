import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import authRouter from "./routes/auth.js";
import questionsRouter from "./routes/questions.js";
import topicsRouter from "./routes/topics.js";
import companiesRouter from "./routes/companies.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// standard middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// manual cookie parser and setter
app.use((req, res, next) => {
  req.cookies = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      const name = parts.shift().trim();
      const value = decodeURIComponent(parts.join("="));
      req.cookies[name] = value;
    });
  }
  next();
});

app.use((req, res, next) => {
  res.cookie = (name, val, options = {}) => {
    let str = `${name}=${encodeURIComponent(val)}`;
    if (options.maxAge) str += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
    if (options.path) {
      str += `; Path=${options.path}`;
    } else {
      str += "; Path=/";
    }
    if (options.domain) str += `; Domain=${options.domain}`;
    if (options.secure) str += "; Secure";
    if (options.httpOnly) str += "; HttpOnly";
    if (options.sameSite) str += `; SameSite=${options.sameSite}`;

    // if there are already other cookies, append this one to the array
    const existing = res.getHeader("Set-Cookie");
    if (existing) {
      const existingArray = Array.isArray(existing) ? existing : [existing];
      res.setHeader("Set-Cookie", [...existingArray, str]);
    } else {
      res.setHeader("Set-Cookie", str);
    }
  };
  res.clearCookie = (name, options = {}) => {
    res.cookie(name, "", { ...options, maxAge: 0 });
  };
  next();
});

// serve static assets
app.use(express.static(path.join(__dirname, "..", "frontend", "public")));

// api endpoints
app.use("/api/auth", authRouter);
app.use("/api/questions", requireAuth, questionsRouter);
app.use("/api/topics", requireAuth, topicsRouter);
app.use("/api/companies", requireAuth, companiesRouter);

// redirect all other routes to frontend SPA router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "public", "index.html"));
});

// connect db and start listening
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`PrepVault backend server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed. Server not started.", error);
    process.exit(1);
  }
}

startServer();
