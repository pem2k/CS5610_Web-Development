const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("Error: MONGODB_URI is not defined in environment variables.");
  process.exit(1);
}

let client;
let db = null;

async function connectDB() {
  if (db) return db;

  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log("Successfully connected to MongoDB.");
    db = client.db(); // Defaults to db name in connection string, e.g., 'natyakosha'
    return db;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

function getDB() {
  if (!db) {
    throw new Error("Database not initialized. Please call connectDB first.");
  }
  return db;
}

module.exports = { connectDB, getDB };
