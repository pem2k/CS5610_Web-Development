const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const { isAuthenticated, isTeacher } = require("../middleware/auth");
const { createUser } = require("../helpers/user");

// GET /api/batches (Teachers and logged in students can read batch lists)
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const db = getDB();
    const batches = await db.collection("batches").find().toArray();
    res.json(batches);
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ error: "Failed to retrieve batches." });
  }
});

// POST /api/batches (Teacher only - creates a new batch)
router.post("/", isTeacher, async (req, res) => {
  const { name, timeSlot } = req.body;

  if (!name || !timeSlot) {
    return res
      .status(400)
      .json({ error: "Batch name and time slot are required." });
  }

  try {
    const db = getDB();
    const newBatch = {
      name,
      timeSlot,
      students: [], // Array of student usernames
      createdAt: new Date(),
    };

    const result = await db.collection("batches").insertOne(newBatch);
    res.status(201).json({ _id: result.insertedId, ...newBatch });
  } catch (error) {
    console.error("Error creating batch:", error);
    res.status(500).json({ error: "Failed to create batch." });
  }
});

// POST /api/batches/:id/students (Teacher only - adds/assigns a student to a batch)
router.post("/:id/students", isTeacher, async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Student username is required." });
  }

  try {
    const db = getDB();
    const trimmedUsername = username.toLowerCase().trim();

    // 1. Verify user exists
    const user = await db
      .collection("users")
      .findOne({ username: trimmedUsername });
    if (!user) {
      return res
        .status(404)
        .json({ error: `User '${username}' does not exist.` });
    }
    if (user.role !== "student") {
      return res
        .status(400)
        .json({ error: "Only student accounts can be assigned to batches." });
    }

    // 2. Remove student from any other batch first (a student belongs to one batch)
    await db
      .collection("batches")
      .updateMany(
        { students: trimmedUsername },
        { $pull: { students: trimmedUsername } },
      );

    // 3. Add student to this batch
    const batchResult = await db
      .collection("batches")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $addToSet: { students: trimmedUsername } },
        { returnDocument: "after" },
      );

    if (!batchResult) {
      return res.status(404).json({ error: "Batch not found." });
    }

    // 4. Update user profile batch link
    await db
      .collection("users")
      .updateOne(
        { username: trimmedUsername },
        { $set: { batchId: new ObjectId(id) } },
      );

    res.json(batchResult);
  } catch (error) {
    console.error("Error adding student to batch:", error);
    res.status(500).json({ error: "Failed to assign student to batch." });
  }
});

// DELETE /api/batches/:id/students/:username (Teacher only - removes a student from a batch)
router.delete("/:id/students/:username", isTeacher, async (req, res) => {
  const { id, username } = req.params;

  try {
    const db = getDB();
    const trimmedUsername = username.toLowerCase().trim();

    // Remove from batch student list
    const batchResult = await db
      .collection("batches")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $pull: { students: trimmedUsername } },
        { returnDocument: "after" },
      );

    if (!batchResult) {
      return res.status(404).json({ error: "Batch not found." });
    }

    // Clear user profile batch link
    await db
      .collection("users")
      .updateOne({ username: trimmedUsername }, { $set: { batchId: null } });

    res.json(batchResult);
  } catch (error) {
    console.error("Error removing student from batch:", error);
    res.status(500).json({ error: "Failed to remove student from batch." });
  }
});

// POST /api/batches/create-student (Teacher only - creates student user and assigns them to batch)
router.post("/create-student", isTeacher, async (req, res) => {
  const { firstName, lastName, username, batchId } = req.body;

  if (!firstName || !lastName || !username || !batchId) {
    return res
      .status(400)
      .json({
        error:
          "First name, last name, username, and batch timings are required.",
      });
  }

  try {
    // I'd be really careful about using regex like this, or at least make sure there's
    // some character escaping and validation on the backend, as things stand
    // this allows regex injection. There's a way to do this without regex, in mongo
    // called collation which is basically a string comparator that allows case/character insensitive searches
    // and doesnt expose your db this way: https://www.mongodb.com/docs/manual/reference/collation/
    const db = getDB();
    const cleanUsername = username.toLowerCase().trim();
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    // 1. Check if username is taken
    const existingUser = await db
      .collection("users")
      .findOne({ username: cleanUsername });

    // 2. Check if a user with the same first and last name exists (case-insensitive)
    const duplicateNameUser = await db.collection("users").findOne({
      firstName: { $regex: new RegExp(`^${cleanFirstName}$`, "i") },
      lastName: { $regex: new RegExp(`^${cleanLastName}$`, "i") },
    });

    if (existingUser) {
      if (duplicateNameUser) {
        return res.status(400).json({
          error: `A student named '${cleanFirstName} ${cleanLastName}' already exists with username '${duplicateNameUser.username}'. Please choose a different username for this student.`,
        });
      }
      return res
        .status(400)
        .json({
          error:
            "Username is already taken. Please choose a different username.",
        });
    }

    // 3. Verify batch exists
    const batch = await db
      .collection("batches")
      .findOne({ _id: new ObjectId(batchId) });
    if (!batch) {
      return res.status(404).json({ error: "Selected batch does not exist." });
    }

    // 4. Create new student user with default password 'student123'
    const newStudent = await createUser(
      cleanUsername,
      "student123",
      "student",
      batchId,
      cleanFirstName,
      cleanLastName,
    );

    // 5. Remove student from any other batch first (just in case)
    await db
      .collection("batches")
      .updateMany(
        { students: cleanUsername },
        { $pull: { students: cleanUsername } },
      );

    // 6. Add student username to the batch roster array
    await db
      .collection("batches")
      .updateOne(
        { _id: new ObjectId(batchId) },
        { $addToSet: { students: cleanUsername } },
      );

    // Remove hashed password from response for safety
    const safeStudent = { ...newStudent };
    delete safeStudent.password;

    res.status(201).json({
      message: "Student account registered and assigned successfully.",
      student: safeStudent,
    });
  } catch (error) {
    console.error("Error creating student account:", error);
    res.status(500).json({ error: "Failed to create student account." });
  }
});

module.exports = router;
