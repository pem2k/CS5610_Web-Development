import express from "express";
import crypto from "crypto";
import { getDb } from "../db.js";
import { seedUserLeetcode } from "./questions.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// standard scrypt hash for password storage
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

// compare plain text password against stored hash
function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, hash] = storedHash.split(":");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return derivedKey.toString("hex") === hash;
}

// signup handler
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (trimmedUsername.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters long" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(password)) {
      return res.status(400).json({
        error: "Password must contain at least one special character",
      });
    }

    const db = getDb();
    const usersCollection = db.collection("users");

    // check if email is already taken
    const existingEmail = await usersCollection.findOne(
      { email: trimmedEmail },
      { collation: { locale: "en", strength: 2 } }
    );

    if (existingEmail) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // make sure username is unique
    const existingUser = await usersCollection.findOne(
      { username: trimmedUsername },
      { collation: { locale: "en", strength: 2 } }
    );

    if (existingUser) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const newUser = {
      username: trimmedUsername,
      email: trimmedEmail.toLowerCase(),
      passwordHash: hashPassword(password),
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    // log them in immediately by building a session
    const token = crypto.randomUUID();
    const sessionsCollection = db.collection("sessions");
    const session = {
      token,
      userId: result.insertedId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
    await sessionsCollection.insertOne(session);

    // store session token in cookie
    res.cookie("sessionToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // kick off initial questions seeding
    try {
      await seedUserLeetcode(db, result.insertedId);
    } catch (seedErr) {
      console.error("Auto-seeding during signup failed:", seedErr);
    }

    res.status(201).json({
      message: "User registered successfully",
      user: { id: result.insertedId, username: trimmedUsername, email: trimmedEmail.toLowerCase() },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// login handler
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const db = getDb();
    const usersCollection = db.collection("users");

    // search by email (case-insensitive)
    const user = await usersCollection.findOne(
      { email: email.trim() },
      { collation: { locale: "en", strength: 2 } }
    );

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // start new session
    const token = crypto.randomUUID();
    const sessionsCollection = db.collection("sessions");
    const session = {
      token,
      userId: user._id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
    await sessionsCollection.insertOne(session);

    // save session in cookie
    res.cookie("sessionToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // seed leetcode set if they haven't done it yet
    try {
      await seedUserLeetcode(db, user._id);
    } catch (seedErr) {
      console.error("Auto-seeding during login failed:", seedErr);
    }

    res.json({
      message: "Logged in successfully",
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// logout handler
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies?.sessionToken;
    if (token) {
      const db = getDb();
      await db.collection("sessions").deleteOne({ token });
    }

    // drop session cookie
    res.clearCookie("sessionToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// check current session
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.sessionToken;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const db = getDb();
    const session = await db.collection("sessions").findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      res.clearCookie("sessionToken");
      return res.status(401).json({ error: "Session expired or invalid" });
    }

    const user = await db.collection("users").findOne({ _id: session.userId });
    if (!user) {
      res.clearCookie("sessionToken");
      return res.status(401).json({ error: "User not found" });
    }

    res.json({ id: user._id, username: user.username, email: user.email });
  } catch (error) {
    console.error("Auth me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// cascading account delete
router.delete("/delete-account", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user._id;

    // delete all user data across collections
    await db.collection("questions").deleteMany({ userId });
    await db.collection("topics").deleteMany({ userId });
    await db.collection("companies").deleteMany({ userId });
    await db.collection("sessions").deleteMany({ userId });
    await db.collection("users").deleteOne({ _id: userId });

    // clean up cookie
    res.clearCookie("sessionToken");

    res.json({ message: "Account and all associated data deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
