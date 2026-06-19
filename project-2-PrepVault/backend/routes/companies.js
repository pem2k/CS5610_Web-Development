import express from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

const router = express.Router();

// get companies list
router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const companiesCollection = db.collection("companies");

    const companies = await companiesCollection
      .find({ userId: req.user._id })
      .sort({ name: 1 })
      .toArray();

    res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// add new company
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Company name is required" });
    }

    const db = getDb();
    const companiesCollection = db.collection("companies");

    // check duplicate names (case insensitive)
    const existing = await companiesCollection.findOne(
      {
        userId: req.user._id,
        name: name.trim(),
      },
      { collation: { locale: "en", strength: 2 } }
    );

    if (existing) {
      return res.status(400).json({ error: "Company already exists" });
    }

    const newCompany = {
      userId: req.user._id, // tie to user
      name: name.trim(),
    };

    const result = await companiesCollection.insertOne(newCompany);
    res.status(201).json({ _id: result.insertedId, ...newCompany });
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// rename company
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Company name is required" });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid company ID format" });
    }

    const db = getDb();
    const companiesCollection = db.collection("companies");

    // check name collision excluding this company
    const existing = await companiesCollection.findOne(
      {
        userId: req.user._id,
        _id: { $ne: new ObjectId(id) },
        name: name.trim(),
      },
      { collation: { locale: "en", strength: 2 } }
    );

    if (existing) {
      return res.status(400).json({ error: "Another company with this name already exists" });
    }

    const result = await companiesCollection.updateOne(
      { _id: new ObjectId(id), userId: req.user._id },
      { $set: { name: name.trim() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json({ _id: id, name: name.trim() });
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// remove company
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid company ID format" });
    }

    const db = getDb();
    const companiesCollection = db.collection("companies");
    const questionsCollection = db.collection("questions");

    const result = await companiesCollection.deleteOne({
      _id: new ObjectId(id),
      userId: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    // pull deleted company from all question records
    await questionsCollection.updateMany(
      { userId: req.user._id },
      { $pull: { companyAppearances: { companyId: new ObjectId(id) } } }
    );

    res.json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
