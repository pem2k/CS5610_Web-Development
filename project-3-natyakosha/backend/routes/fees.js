const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const { isAuthenticated, isTeacher } = require("../middleware/auth");

// GET /api/fees/dashboard (Teacher only - aggregations & status lists)
router.get("/dashboard", isTeacher, async (req, res) => {
  try {
    const db = getDB();
    const payments = await db
      .collection("fee_payments")
      .find()
      .sort({ dueDate: -1 })
      .toArray();

    // Fetch batch mappings to decorate payment records
    const users = await db
      .collection("users")
      .find({ role: "student" })
      .toArray();
    const batches = await db.collection("batches").find().toArray();

    const userBatchMap = {};
    users.forEach((u) => {
      if (u.batchId) {
        userBatchMap[u.username.toLowerCase().trim()] = u.batchId.toString();
      }
    });

    const batchMap = {};
    batches.forEach((b) => {
      batchMap[b._id.toString()] = `${b.name} (${b.timeSlot})`;
    });

    // Decorate each payment with batch info
    payments.forEach((p) => {
      const bId = userBatchMap[p.username.toLowerCase().trim()];
      p.batchId = bId || null;
      p.batchName = bId ? batchMap[bId] || null : null;
    });

    // Aggregations
    let totalCollected = 0;
    let totalOutstanding = 0;
    const unpaidStudents = new Set();
    const unpaidLedger = [];

    payments.forEach((p) => {
      if (p.status === "paid") {
        totalCollected += p.amount;
      } else {
        totalOutstanding += p.amount;
        unpaidStudents.add(p.username);
        unpaidLedger.push(p);
      }
    });

    res.json({
      summary: {
        totalCollected,
        totalOutstanding,
        outstandingCount: unpaidLedger.length,
        unpaidStudentsCount: unpaidStudents.size,
      },
      ledger: payments,
      unpaidList: unpaidLedger,
      batches: batches.map((b) => ({
        _id: b._id.toString(),
        name: b.name,
        timeSlot: b.timeSlot,
      })),
    });
  } catch (error) {
    console.error("Error fetching fees dashboard:", error);
    res
      .status(500)
      .json({ error: "Failed to retrieve fee payments dashboard." });
  }
});

// PUT /api/fees/:id (Teacher only - manually mark student fee status)
router.put("/:id", isTeacher, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'paid' or 'unpaid'

  if (!status || !["paid", "unpaid"].includes(status)) {
    return res
      .status(400)
      .json({ error: 'Valid status ("paid" or "unpaid") is required.' });
  }

  try {
    const db = getDB();
    const updateFields = { status };
    if (status === "paid") {
      updateFields.paidDate = new Date().toISOString().split("T")[0];
    } else {
      updateFields.paidDate = null;
    }

    const result = await db
      .collection("fee_payments")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateFields },
        { returnDocument: "after" },
      );

    if (!result) {
      return res.status(404).json({ error: "Fee payment record not found." });
    }

    res.json(result);
  } catch (error) {
    console.error("Error updating fee status:", error);
    res.status(500).json({ error: "Failed to update fee record." });
  }
});

// GET /api/fees/my (Student only - check personal payment logs)
router.get("/my", isAuthenticated, async (req, res) => {
  try {
    const db = getDB();
    const username = req.user.username;

    const payments = await db
      .collection("fee_payments")
      .find({ username: username })
      .sort({ dueDate: -1 })
      .toArray();

    res.json(payments);
  } catch (error) {
    console.error("Error fetching student fee list:", error);
    res.status(500).json({ error: "Failed to retrieve fee payments history." });
  }
});

// POST /api/fees/my/pay/:id (Student only - mock payment action)
router.post("/my/pay/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const username = req.user.username;

  try {
    const db = getDB();

    // Ensure the fee payment belongs to the logged-in student
    const record = await db.collection("fee_payments").findOne({
      _id: new ObjectId(id),
      username: username,
    });

    if (!record) {
      return res
        .status(404)
        .json({ error: "Fee payment record not found or access denied." });
    }

    if (record.status === "paid") {
      return res.status(400).json({ error: "Fee is already marked as paid." });
    }

    const updatedRecord = await db.collection("fee_payments").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "paid",
          paidDate: new Date().toISOString().split("T")[0],
        },
      },
      { returnDocument: "after" },
    );

    res.json({
      message: "Payment completed successfully!",
      record: updatedRecord,
    });
  } catch (error) {
    console.error("Error processing student payment mock:", error);
    res.status(500).json({ error: "Failed to process payment." });
  }
});

module.exports = router;
