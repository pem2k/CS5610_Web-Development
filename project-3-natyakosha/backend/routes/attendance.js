const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const { isAuthenticated, isTeacher } = require("../middleware/auth");

// GET /api/attendance/batch/:batchId (Teacher only - retrieve attendance records for a batch)
// Query param: ?date=YYYY-MM-DD
router.get("/batch/:batchId", isTeacher, async (req, res) => {
  const { batchId } = req.params;
  const { date } = req.query;

  try {
    const db = getDB();
    const query = { batchId: new ObjectId(batchId) };
    if (date) {
      query.date = date;
    }

    const records = await db.collection("attendance").find(query).toArray();
    res.json(records);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Failed to retrieve attendance logs." });
  }
});

// POST /api/attendance (Teacher only - save/overwrite attendance for a date & batch)
router.post("/", isTeacher, async (req, res) => {
  const { batchId, date, records } = req.body; // records: [{ username, status }]

  if (!batchId || !date || !Array.isArray(records)) {
    return res
      .status(400)
      .json({ error: "BatchId, date, and records array are required." });
  }

  try {
    const db = getDB();
    const batchOid = new ObjectId(batchId);

    // Remove existing records for this batch and date to prevent duplicate logs
    await db.collection("attendance").deleteMany({
      batchId: batchOid,
      date: date,
    });

    if (records.length > 0) {
      const documents = records.map((rec) => ({
        username: rec.username.toLowerCase().trim(),
        batchId: batchOid,
        date: date,
        status: rec.status, // 'present' or 'absent'
        createdAt: new Date(),
      }));

      await db.collection("attendance").insertMany(documents);
    }

    res.json({ message: "Attendance records updated successfully." });
  } catch (error) {
    console.error("Error saving attendance:", error);
    res.status(500).json({ error: "Failed to save attendance logs." });
  }
});

// GET /api/attendance/my (Student only - overall attendance percentage & history)
router.get("/my", isAuthenticated, async (req, res) => {
  try {
    const db = getDB();
    const username = req.user.username;

    // Retrieve historical logs sorted by date descending
    const records = await db
      .collection("attendance")
      .find({ username: username })
      .sort({ date: -1 })
      .toArray();

    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;

    res.json({
      summary: {
        totalClasses: total,
        presentCount: present,
        absentCount: total - present,
        presenceRate: rate,
      },
      history: records,
    });
  } catch (error) {
    console.error("Error fetching student attendance summary:", error);
    res
      .status(500)
      .json({ error: "Failed to calculate attendance statistics." });
  }
});

module.exports = router;
