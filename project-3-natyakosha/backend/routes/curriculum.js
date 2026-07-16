const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const { isAuthenticated, isTeacher } = require("../middleware/auth");

// GET /api/curriculum (Available to both Teachers and Students)
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const db = getDB();
    const items = await db.collection("content").find().toArray();
    res.json(items);
  } catch (error) {
    console.error("Error fetching curriculum:", error);
    res.status(500).json({ error: "Failed to retrieve curriculum items." });
  }
});

// POST /api/curriculum (Teacher only)
router.post("/", isTeacher, async (req, res) => {
  const { name, title, description, type, imageLink, videoLink } = req.body;
  const itemTitle = name || title;

  if (!itemTitle || !description || !type) {
    return res
      .status(400)
      .json({ error: "Title, description, and type are required." });
  }

  try {
    const db = getDB();
    const newItem = {
      title: itemTitle,
      name: itemTitle,
      description,
      type, // 'theory', 'mudra', 'adavu'
      imageLink: imageLink || "",
      videoLink: videoLink || "",
      createdAt: new Date(),
    };

    const result = await db.collection("content").insertOne(newItem);
    res.status(201).json({ _id: result.insertedId, ...newItem });
  } catch (error) {
    console.error("Error creating curriculum item:", error);
    res.status(500).json({ error: "Failed to create curriculum item." });
  }
});

// PUT /api/curriculum/:id (Teacher only)
router.put("/:id", isTeacher, async (req, res) => {
  const { id } = req.params;
  const { name, title, description, type, imageLink, videoLink } = req.body;
  const itemTitle = name || title;

  try {
    const db = getDB();
    const updateData = {};
    if (itemTitle) {
      updateData.title = itemTitle;
      updateData.name = itemTitle;
    }
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (imageLink !== undefined) updateData.imageLink = imageLink;
    if (videoLink !== undefined) updateData.videoLink = videoLink;

    const result = await db
      .collection("content")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" },
      );

    if (!result) {
      return res.status(404).json({ error: "Curriculum item not found." });
    }

    res.json(result);
  } catch (error) {
    console.error("Error updating curriculum item:", error);
    res.status(500).json({ error: "Failed to update curriculum item." });
  }
});

// DELETE /api/curriculum/:id (Teacher only)
router.delete("/:id", isTeacher, async (req, res) => {
  const { id } = req.params;

  try {
    const db = getDB();
    const result = await db
      .collection("content")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Curriculum item not found." });
    }

    res.json({ message: "Curriculum item deleted successfully." });
  } catch (error) {
    console.error("Error deleting curriculum item:", error);
    res.status(500).json({ error: "Failed to delete curriculum item." });
  }
});

module.exports = router;
