const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const {
  findUserByUsername,
  findUserById,
  comparePassword,
} = require("../helpers/user");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await findUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }

      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: "Incorrect password." });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id);
    if (!user) {
      return done(null, false);
    }
    // Remove the password hash for security before adding to session request
    const userSafe = { ...user };
    delete userSafe.password;
    done(null, userSafe);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
