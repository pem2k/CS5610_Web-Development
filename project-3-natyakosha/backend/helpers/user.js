const { getDB } = require("../config/db");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");

async function findUserByUsername(username) {
  const db = getDB();
  if (!username) return null;
  return await db
    .collection("users")
    .findOne({ username: username.toLowerCase().trim() });
}

async function findUserById(id) {
  const db = getDB();
  try {
    return await db.collection("users").findOne({ _id: new ObjectId(id) });
  } catch (error) {
    return null;
  }
}

async function createUser(
  username,
  password,
  role,
  batchId = null,
  firstName = null,
  lastName = null,
) {
  const db = getDB();
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    username: username.toLowerCase().trim(),
    password: hashedPassword,
    role: role || "student", // 'teacher' or 'student'
    batchId: batchId ? new ObjectId(batchId) : null,
    firstName: firstName ? firstName.trim() : null,
    lastName: lastName ? lastName.trim() : null,
    createdAt: new Date(),
  };

  const result = await db.collection("users").insertOne(newUser);
  return { _id: result.insertedId, ...newUser };
}

async function comparePassword(candidatePassword, hash) {
  return await bcrypt.compare(candidatePassword, hash);
}

async function updateUserPassword(userId, newPassword) {
  const db = getDB();
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db
    .collection("users")
    .updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashedPassword } },
    );
}

module.exports = {
  findUserByUsername,
  findUserById,
  createUser,
  comparePassword,
  updateUserPassword,
};
