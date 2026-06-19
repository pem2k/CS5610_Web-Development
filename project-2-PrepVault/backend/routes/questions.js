import express from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

const router = express.Router();

// joins topic and company info onto list of questions
async function populateQuestions(questions, db, userId) {
  if (questions.length === 0) return [];

  // grab user's topics and companies for the join
  const topics = await db.collection("topics").find({ userId }).toArray();
  const companies = await db.collection("companies").find({ userId }).toArray();

  const topicMap = {};
  topics.forEach((t) => {
    topicMap[t._id.toString()] = t;
  });

  const companyMap = {};
  companies.forEach((c) => {
    companyMap[c._id.toString()] = c;
  });

  return questions.map((q) => {
    const populatedTopic = q.topicId ? topicMap[q.topicId.toString()] || null : null;
    const populatedAppearances = (q.companyAppearances || []).map((app) => ({
      ...app,
      company: app.companyId
        ? companyMap[app.companyId.toString()] || { name: "Unknown" }
        : { name: "Unknown" },
    }));

    return {
      ...q,
      topic: populatedTopic,
      companyAppearances: populatedAppearances,
    };
  });
}

// get questions with filters/search
router.get("/", async (req, res) => {
  try {
    const { topicId, companyId, difficulty, practiced, q } = req.query;
    const db = getDb();
    const questionsCollection = db.collection("questions");

    const query = { userId: req.user._id };

    // topic filter
    if (topicId && ObjectId.isValid(topicId)) {
      query.topicId = new ObjectId(topicId);
    } else if (topicId === "null" || topicId === "none") {
      query.topicId = null;
    }

    // company filter
    if (companyId && ObjectId.isValid(companyId)) {
      query["companyAppearances.companyId"] = new ObjectId(companyId);
    }

    // difficulty filter
    if (difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)) {
      query.difficulty = difficulty;
    }

    // seeded vs personal filter
    const { isSeeded } = req.query;
    if (isSeeded !== undefined && isSeeded !== "") {
      if (isSeeded === "true") {
        query.isSeeded = true;
      } else {
        query.isSeeded = { $ne: true };
      }
    }

    // practiced status filter
    if (practiced !== undefined && practiced !== "") {
      query.practiced = practiced === "true";
    }

    // keyword search (title, notes, company name, position)
    if (q && q.trim() !== "") {
      const searchRegex = new RegExp(q.trim(), "i");

      // match company names first to find matching IDs
      const matchingCompanies = await db
        .collection("companies")
        .find({
          userId: req.user._id,
          name: { $regex: searchRegex },
        })
        .toArray();
      const matchingCompanyIds = matchingCompanies.map((c) => c._id);

      query.$or = [
        { title: { $regex: searchRegex } },
        { notes: { $regex: searchRegex } },
        { "companyAppearances.companyId": { $in: matchingCompanyIds } },
        { "companyAppearances.position": { $regex: searchRegex } },
      ];
    }

    const questions = await questionsCollection.find(query).sort({ createdAt: -1 }).toArray();
    const populated = await populateQuestions(questions, db, req.user._id);

    const difficultyWeight = { Easy: 1, Medium: 2, Hard: 3 };
    populated.sort((a, b) => {
      const topicA = a.topic ? a.topic.name.toLowerCase() : "";
      const topicB = b.topic ? b.topic.name.toLowerCase() : "";

      if (topicA !== topicB) {
        if (!topicA) return 1;
        if (!topicB) return -1;
        return topicA.localeCompare(topicB);
      }

      const diffA = difficultyWeight[a.difficulty] || 0;
      const diffB = difficultyWeight[b.difficulty] || 0;
      if (diffA !== diffB) {
        return diffA - diffB;
      }

      const dateA = a.createdAt ? new Date(a.createdAt) : 0;
      const dateB = b.createdAt ? new Date(b.createdAt) : 0;
      return dateB - dateA;
    });

    res.json(populated);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// import default leetcode set
export async function seedUserLeetcode(db, userId) {
  const questionsCollection = db.collection("questions");
  const topicsCollection = db.collection("topics");

  // don't seed if they already have them
  const existingCount = await questionsCollection.countDocuments({
    userId: userId,
    isSeeded: true,
  });
  if (existingCount >= 1200) {
    return { success: true, count: 0, message: "Already seeded" };
  }

  // get list from remote json
  let leetcodeData = [];
  try {
    const fetchResponse = await fetch(
      "https://raw.githubusercontent.com/noworneverev/leetcode-api/master/data/leetcode_questions.json"
    );
    if (!fetchResponse.ok) {
      throw new Error("Failed to fetch LeetCode JSON");
    }
    leetcodeData = await fetchResponse.json();
  } catch (fetchErr) {
    console.error("Direct fetch failed, trying fallback...", fetchErr);
    // try main branch if master is missing/renamed
    const fallbackResponse = await fetch(
      "https://raw.githubusercontent.com/noworneverev/leetcode-api/main/data/leetcode_questions.json"
    );
    if (!fallbackResponse.ok) {
      throw new Error("Could not retrieve LeetCode questions database.");
    }
    leetcodeData = await fallbackResponse.json();
  }

  if (!Array.isArray(leetcodeData) || leetcodeData.length === 0) {
    throw new Error("LeetCode questions database is empty or invalid format");
  }

  // only keep free questions, cap at 1200
  const rawQuestions = leetcodeData
    .map((item) => item.data?.question)
    .filter((q) => q && !q.isPaidOnly)
    .slice(0, 1200);

  // harvest all unique tags to create corresponding topics
  const tagNamesSet = new Set();
  rawQuestions.forEach((q) => {
    if (Array.isArray(q.topicTags)) {
      q.topicTags.forEach((tag) => {
        if (tag.name) tagNamesSet.add(tag.name.trim());
      });
    }
  });

  // create any tags that don't exist yet
  const existingTopics = await topicsCollection.find({ userId: userId }).toArray();
  const existingTopicNames = new Set(existingTopics.map((t) => t.name.toLowerCase()));

  const newTopicsToInsert = [];
  const colors = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#06b6d4",
  ];
  let colorIndex = 0;

  tagNamesSet.forEach((tagName) => {
    if (!existingTopicNames.has(tagName.toLowerCase())) {
      newTopicsToInsert.push({
        userId: userId,
        name: tagName,
        description: `LeetCode problems tagged with ${tagName}`,
        color: colors[colorIndex % colors.length],
      });
      colorIndex++;
    }
  });

  if (newTopicsToInsert.length > 0) {
    await topicsCollection.insertMany(newTopicsToInsert);
  }

  // map topic names to their mongo ids
  const allTopics = await topicsCollection.find({ userId: userId }).toArray();
  const topicMap = {};
  allTopics.forEach((t) => {
    topicMap[t.name.toLowerCase()] = t._id;
  });

  // map raw json list into database schema
  const questionsToInsert = rawQuestions.map((q) => {
    // associate with their corresponding topic
    let matchedTopicId = null;
    if (
      Array.isArray(q.topicTags) &&
      q.topicTags.length > 0 &&
      q.topicTags[0] &&
      q.topicTags[0].name
    ) {
      const primaryTagName = q.topicTags[0].name.trim().toLowerCase();
      matchedTopicId = topicMap[primaryTagName] || null;
    }

    // standard difficulty mapping
    let difficulty = "Medium";
    if (q.difficulty === "Easy" || q.difficulty === "Hard") {
      difficulty = q.difficulty;
    }

    return {
      userId: userId,
      title: q.title ? q.title.trim() : "Untitled LeetCode Question",
      url:
        q.url ||
        (q.titleSlug ? `https://leetcode.com/problems/${q.titleSlug}/` : "https://leetcode.com"),
      difficulty,
      topicId: matchedTopicId,
      practiced: false,
      notes: "",
      companyAppearances: [],
      isSeeded: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  // write bulk entries
  await questionsCollection.insertMany(questionsToInsert);
  return { success: true, count: questionsToInsert.length };
}

// seed default problems
router.post("/seed-leetcode", async (req, res) => {
  try {
    const db = getDb();
    const result = await seedUserLeetcode(db, req.user._id);
    res.json({
      message: `Successfully seeded ${result.count} LeetCode questions!`,
      seededCount: result.count,
    });
  } catch (error) {
    console.error("Error seeding LeetCode questions:", error);
    res.status(500).json({ error: `Failed to seed database: ${error.message}` });
  }
});

// fetch single question
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid question ID format" });
    }

    const db = getDb();
    const question = await db
      .collection("questions")
      .findOne({ _id: new ObjectId(id), userId: req.user._id });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const populated = await populateQuestions([question], db, req.user._id);
    res.json(populated[0]);
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// add custom question
router.post("/", async (req, res) => {
  try {
    const { title, url, difficulty, topicId, practiced, notes, companyAppearances } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Question title is required" });
    }
    if (!difficulty || !["Easy", "Medium", "Hard"].includes(difficulty)) {
      return res.status(400).json({ error: "Valid difficulty is required (Easy, Medium, Hard)" });
    }

    const db = getDb();
    const questionsCollection = db.collection("questions");

    // check name collision
    const existing = await questionsCollection.findOne(
      {
        userId: req.user._id,
        title: title.trim(),
      },
      { collation: { locale: "en", strength: 2 } }
    );

    if (existing) {
      return res.status(400).json({ error: "Question already exists in your vault" });
    }

    // parse request payload fields
    const parsedTopicId = topicId && ObjectId.isValid(topicId) ? new ObjectId(topicId) : null;
    const parsedAppearances = (companyAppearances || []).map((app) => ({
      companyId: new ObjectId(app.companyId),
      position: (app.position || "").trim(),
      year: app.year ? parseInt(app.year, 10) : new Date().getFullYear(),
    }));

    const newQuestion = {
      userId: req.user._id,
      title: title.trim(),
      url: (url || "").trim(),
      difficulty,
      topicId: parsedTopicId,
      practiced: !!practiced,
      notes: (notes || "").trim(),
      companyAppearances: parsedAppearances,
      isSeeded: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await questionsCollection.insertOne(newQuestion);
    res.status(201).json({ _id: result.insertedId, ...newQuestion });
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// edit question details
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid question ID format" });
    }

    const { title, url, difficulty, topicId, practiced, notes, companyAppearances } = req.body;

    const db = getDb();
    const questionsCollection = db.collection("questions");
    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (url !== undefined) updateData.url = url.trim();
    if (difficulty !== undefined) {
      if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
        return res.status(400).json({ error: "Invalid difficulty value" });
      }
      updateData.difficulty = difficulty;
    }
    if (topicId !== undefined) {
      updateData.topicId = topicId && ObjectId.isValid(topicId) ? new ObjectId(topicId) : null;
    }
    if (practiced !== undefined) updateData.practiced = !!practiced;
    if (notes !== undefined) updateData.notes = notes.trim();

    if (companyAppearances !== undefined) {
      updateData.companyAppearances = companyAppearances.map((app) => ({
        companyId: new ObjectId(app.companyId),
        position: (app.position || "").trim(),
        year: app.year ? parseInt(app.year, 10) : new Date().getFullYear(),
      }));
    }

    updateData.updatedAt = new Date();

    // check title collision excluding self
    if (title !== undefined) {
      const existing = await questionsCollection.findOne(
        {
          userId: req.user._id,
          _id: { $ne: new ObjectId(id) },
          title: title.trim(),
        },
        { collation: { locale: "en", strength: 2 } }
      );

      if (existing) {
        return res.status(400).json({ error: "Another question with this title already exists" });
      }
    }

    const result = await questionsCollection.updateOne(
      { _id: new ObjectId(id), userId: req.user._id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json({ message: "Question updated successfully" });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// delete question
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid question ID format" });
    }

    const db = getDb();
    const result = await db
      .collection("questions")
      .deleteOne({ _id: new ObjectId(id), userId: req.user._id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// link company appearance
router.post("/:id/appearances", async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, position, year } = req.body;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(companyId)) {
      return res.status(400).json({ error: "Invalid question ID or company ID format" });
    }

    const db = getDb();
    const appearance = {
      companyId: new ObjectId(companyId),
      position: (position || "").trim(),
      year: year ? parseInt(year, 10) : new Date().getFullYear(),
    };

    const result = await db
      .collection("questions")
      .updateOne(
        { _id: new ObjectId(id), userId: req.user._id },
        { $push: { companyAppearances: appearance }, $set: { updatedAt: new Date() } }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json({ message: "Appearance added successfully", appearance });
  } catch (error) {
    console.error("Error adding appearance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// unlink company appearance
router.delete("/:id/appearances", async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, position, year } = req.body;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(companyId)) {
      return res.status(400).json({ error: "Invalid question ID or company ID format" });
    }

    const db = getDb();
    const result = await db.collection("questions").updateOne(
      { _id: new ObjectId(id), userId: req.user._id },
      {
        $pull: {
          companyAppearances: {
            companyId: new ObjectId(companyId),
            position: position || "",
            year: year ? parseInt(year, 10) : 0,
          },
        },
        $set: { updatedAt: new Date() },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json({ message: "Appearance removed successfully" });
  } catch (error) {
    console.error("Error removing appearance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
