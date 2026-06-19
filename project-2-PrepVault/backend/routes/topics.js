import express from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

const router = express.Router();

// fetch topics with stats
router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const topicsCollection = db.collection("topics");
    const questionsCollection = db.collection("questions");

    const topics = await topicsCollection
      .find({ userId: req.user._id })
      .sort({ name: 1 })
      .toArray();

    // count practiced vs total questions per topic
    const pipeline = [
      {
        $match: { userId: req.user._id },
      },
      {
        $group: {
          _id: "$topicId",
          total: { $sum: 1 },
          practiced: {
            $sum: { $cond: [{ $eq: ["$practiced", true] }, 1, 0] },
          },
        },
      },
    ];

    const counts = await questionsCollection.aggregate(pipeline).toArray();
    const countMap = {};
    counts.forEach((c) => {
      if (c._id) {
        countMap[c._id.toString()] = {
          total: c.total,
          practiced: c.practiced,
        };
      }
    });

    const topicsWithCounts = topics.map((topic) => {
      const idStr = topic._id.toString();
      return {
        ...topic,
        totalQuestions: countMap[idStr] ? countMap[idStr].total : 0,
        practicedQuestions: countMap[idStr] ? countMap[idStr].practiced : 0,
      };
    });

    res.json(topicsWithCounts);
  } catch (error) {
    console.error("Error fetching topics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// create new topic
router.post("/", async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Topic name is required" });
    }

    const db = getDb();
    const topicsCollection = db.collection("topics");

    // check name collision (case-insensitive)
    const existing = await topicsCollection.findOne(
      {
        userId: req.user._id,
        name: name.trim(),
      },
      { collation: { locale: "en", strength: 2 } }
    );

    if (existing) {
      return res.status(400).json({ error: "Topic already exists" });
    }

    const newTopic = {
      userId: req.user._id, // tie to user
      name: name.trim(),
      description: (description || "").trim(),
      color: color || "#6366f1", // fallback to indigo
    };

    const result = await topicsCollection.insertOne(newTopic);
    res.status(201).json({ _id: result.insertedId, ...newTopic });
  } catch (error) {
    console.error("Error creating topic:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// edit topic details
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Topic name is required" });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid topic ID format" });
    }

    const db = getDb();
    const topicsCollection = db.collection("topics");

    // name collision check excluding current topic
    const existing = await topicsCollection.findOne(
      {
        userId: req.user._id,
        _id: { $ne: new ObjectId(id) },
        name: name.trim(),
      },
      { collation: { locale: "en", strength: 2 } }
    );

    if (existing) {
      return res.status(400).json({ error: "Another topic with this name already exists" });
    }

    const updateDoc = {
      $set: {
        name: name.trim(),
        description: (description || "").trim(),
        color: color || "#6366f1",
      },
    };

    const result = await topicsCollection.updateOne(
      { _id: new ObjectId(id), userId: req.user._id },
      updateDoc
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Topic not found" });
    }

    res.json({ _id: id, name: name.trim(), description: (description || "").trim(), color });
  } catch (error) {
    console.error("Error updating topic:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// delete topic
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid topic ID format" });
    }

    const db = getDb();
    const topicsCollection = db.collection("topics");
    const questionsCollection = db.collection("questions");

    const result = await topicsCollection.deleteOne({
      _id: new ObjectId(id),
      userId: req.user._id,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Topic not found" });
    }

    // orphan questions that were in this topic
    await questionsCollection.updateMany(
      { userId: req.user._id, topicId: new ObjectId(id) },
      { $set: { topicId: null } }
    );

    res.json({ message: "Topic deleted successfully" });
  } catch (error) {
    console.error("Error deleting topic:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
