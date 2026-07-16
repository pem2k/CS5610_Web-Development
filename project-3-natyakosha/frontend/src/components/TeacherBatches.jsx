import React, { useState } from "react";
import PropTypes from "prop-types";
import "./TeacherBatches.css";

function TeacherBatches({ batches, onRefresh }) {
  const [studentInput, setStudentInput] = useState({}); // { batchId: 'username' }
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Registration States
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regBatchId, setRegBatchId] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regError, setRegError] = useState("");

  const handleNameChange = (first, last) => {
    setRegFirstName(first);
    setRegLastName(last);
    const suggested =
      `${first.toLowerCase().trim()}_${last.toLowerCase().trim()}`
        .replace(/[^a-z0-9_]/g, "") // remove special characters except underscores
        .replace(/\s+/g, "");
    setRegUsername(suggested);
  };

  const handleInputChange = (batchId, val) => {
    setStudentInput({ ...studentInput, [batchId]: val });
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!regFirstName || !regLastName || !regUsername || !regBatchId) {
      setRegError(
        "All fields (First Name, Last Name, Username, and Batch) are required.",
      );
      return;
    }

    try {
      const response = await fetch("/api/batches/create-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: regFirstName,
          lastName: regLastName,
          username: regUsername,
          batchId: regBatchId,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create student account.");
      }

      setRegSuccess(
        `Successfully registered '${regFirstName} ${regLastName}' with username '${regUsername}'. Default password is 'student123'.`,
      );
      setRegFirstName("");
      setRegLastName("");
      setRegUsername("");
      setRegBatchId("");
      onRefresh();
    } catch (err) {
      setRegError(err.message);
    }
  };

  const handleAddStudent = async (e, batchId) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const username = studentInput[batchId];
    if (!username) {
      setErrorMessage("Please enter a student username.");
      return;
    }

    try {
      const response = await fetch(`/api/batches/${batchId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to add student to batch.");
      }

      setSuccessMessage(
        `Successfully added student '${username}' to the batch roster.`,
      );
      setStudentInput({ ...studentInput, [batchId]: "" });
      onRefresh();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleRemoveStudent = async (batchId, username) => {
    if (
      !window.confirm(
        `Are you sure you want to remove '${username}' from this batch roster?`,
      )
    )
      return;
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/batches/${batchId}/students/${username}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to remove student.");
      }

      setSuccessMessage(
        `Successfully removed student '${username}' from the batch roster.`,
      );
      onRefresh();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="teacher-batches animate-fade-in">
      <header className="section-header">
        <h2>Roster & Batch Manager</h2>
      </header>

      {/* New Student Registration Card */}
      <div className="card reg-student-card" style={{ marginBottom: "2.5rem" }}>
        <h3>Register New Student Account</h3>
        <p
          className="text-muted"
          style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}
        >
          Create a student profile. The student will be assigned to their batch
          immediately and can log in using their username and the default
          password <strong>student123</strong>.
        </p>

        {regError && (
          <div className="alert error">
            <span>{regError}</span>
            <button
              type="button"
              className="alert-close-btn"
              onClick={() => setRegError("")}
            >
              ✕
            </button>
          </div>
        )}
        {regSuccess && (
          <div className="alert success">
            <span>{regSuccess}</span>
            <button
              type="button"
              className="alert-close-btn"
              onClick={() => setRegSuccess("")}
            >
              ✕
            </button>
          </div>
        )}

        <form
          onSubmit={handleCreateStudent}
          className="custom-form"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.25rem",
            alignItems: "end",
          }}
        >
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              placeholder="e.g. Keshvi"
              value={regFirstName}
              onChange={(e) => handleNameChange(e.target.value, regLastName)}
              autoComplete="off"
              required
            />
          </div>

          <div className="form-group">
            <label>Last Name / Surname</label>
            <input
              type="text"
              placeholder="e.g. Patel"
              value={regLastName}
              onChange={(e) => handleNameChange(regFirstName, e.target.value)}
              autoComplete="off"
              required
            />
          </div>

          <div className="form-group">
            <label>Generated Username</label>
            <input
              type="text"
              placeholder="e.g. keshvi_patel"
              value={regUsername}
              onChange={(e) =>
                setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))
              }
              autoComplete="off"
              required
            />
          </div>

          <div className="form-group">
            <label>Select Batch Timings</label>
            <select
              value={regBatchId}
              onChange={(e) => setRegBatchId(e.target.value)}
              required
            >
              <option value="">-- Select Class --</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.timeSlot})
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: "span 1", minWidth: "150px" }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "0.75rem 1rem" }}
            >
              Register Student
            </button>
          </div>
        </form>
      </div>

      {errorMessage && (
        <div className="alert error">
          <span>{errorMessage}</span>
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setErrorMessage("")}
          >
            ✕
          </button>
        </div>
      )}
      {successMessage && (
        <div className="alert success">
          <span>{successMessage}</span>
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setSuccessMessage("")}
          >
            ✕
          </button>
        </div>
      )}

      <div className="batches-grid">
        {batches.map((batch) => (
          <div key={batch._id} className="card batch-card">
            <div className="batch-header">
              <h3>{batch.name}</h3>
              <span className="time-badge">{batch.timeSlot}</span>
            </div>

            <div className="batch-roster">
              <h4>Enrolled Roster ({batch.students.length} Students)</h4>
              {batch.students.length === 0 ? (
                <p className="no-students">
                  No students registered in this slot yet.
                </p>
              ) : (
                <ul className="roster-list">
                  {batch.students.map((student) => (
                    <li key={student} className="roster-item">
                      <span>{student}</span>
                      <button
                        className="btn-remove"
                        onClick={() => handleRemoveStudent(batch._id, student)}
                        title="Remove student from batch"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form
              onSubmit={(e) => handleAddStudent(e, batch._id)}
              className="add-student-form"
            >
              <input
                type="text"
                placeholder="Enter student username..."
                value={studentInput[batch._id] || ""}
                onChange={(e) => handleInputChange(batch._id, e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Assign
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

TeacherBatches.propTypes = {
  batches: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      timeSlot: PropTypes.string.isRequired,
      students: PropTypes.arrayOf(PropTypes.string).isRequired,
    }),
  ).isRequired,
  onRefresh: PropTypes.func.isRequired,
};

export default TeacherBatches;
