import React from "react";
import PropTypes from "prop-types";
import "./Navbar.css";

function Navbar({ user, currentView, setView, onLogout }) {
  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <img src="/natraj.png" alt="Nataraja Logo" className="brand-logo" />
        <span className="brand-name">Natyakosha</span>
      </div>

      <div className="nav-links">
        {user.role === "teacher" ? (
          <>
            <button
              className={`nav-btn ${currentView === "curriculum_editor" ? "active" : ""}`}
              onClick={() => setView("curriculum_editor")}
            >
              Curriculum Editor
            </button>
            <button
              className={`nav-btn ${currentView === "batches" ? "active" : ""}`}
              onClick={() => setView("batches")}
            >
              Roster Manager
            </button>
            <button
              className={`nav-btn ${currentView === "attendance" ? "active" : ""}`}
              onClick={() => setView("attendance")}
            >
              Mark Attendance
            </button>
            <button
              className={`nav-btn ${currentView === "fees" ? "active" : ""}`}
              onClick={() => setView("fees")}
            >
              Fee Dashboard
            </button>
          </>
        ) : (
          <>
            <button
              className={`nav-btn ${currentView === "learning" ? "active" : ""}`}
              onClick={() => setView("learning")}
            >
              Learning Area
            </button>
            <button
              className={`nav-btn ${currentView === "student_dashboard" ? "active" : ""}`}
              onClick={() => setView("student_dashboard")}
            >
              Records
            </button>
          </>
        )}
      </div>

      <div className="nav-profile">
        <span className="profile-badge">
          <span className="profile-role-tag">
            {user.role === "teacher" ? "Teacher" : "Student"}
          </span>{" "}
          — {user.username}
        </span>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

Navbar.propTypes = {
  user: PropTypes.shape({
    role: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
  }),
  currentView: PropTypes.string.isRequired,
  setView: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default Navbar;
