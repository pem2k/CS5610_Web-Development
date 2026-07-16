function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized. Please log in first." });
}

function isTeacher(req, res, next) {
  if (req.isAuthenticated() && req.user.role === "teacher") {
    return next();
  }
  return res
    .status(403)
    .json({ error: "Forbidden. Teacher permissions required." });
}

module.exports = {
  isAuthenticated,
  isTeacher,
};
