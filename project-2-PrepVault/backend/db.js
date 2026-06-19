import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/prepvault";
const dbName = url.split("/").pop().split("?")[0] || "prepvault";

let client = null;
let db = null;

export async function connectDB() {
  if (db) return db;
  try {
    client = new MongoClient(url);
    await client.connect();
    db = client.db(dbName);
    console.log(`Connected successfully to MongoDB database: ${dbName}`);
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return db;
}

export async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("MongoDB connection closed.");
  }
}
