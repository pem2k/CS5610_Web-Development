import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./TeacherAttendance.css";

function TeacherAttendance({ batches }) {
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [roster, setRoster] = useState([]); // [{ username, status }]
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Locate the active batch object
  const activeBatch = batches.find((b) => b._id === selectedBatchId);

  // Reload records whenever active batch or date changes
  useEffect(() => {
    if (!selectedBatchId || !selectedDate) {
      setRoster([]);
      return;
    }

    const fetchAttendance = async () => {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      try {
        const response = await fetch(
          `/api/attendance/batch/${selectedBatchId}?date=${selectedDate}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch attendance data.");
        }

        // Map existing attendance log or default to 'present'
        if (activeBatch) {
          const mappedRoster = activeBatch.students.map((username) => {
            const existingLog = data.find((log) => log.username === username);
            return {
              username,
              status: existingLog ? existingLog.status : "present", // Defaults to present
            };
          });
          setRoster(mappedRoster);
        }
      } catch (err) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedBatchId, selectedDate, batches, activeBatch]);

  const handleStatusChange = (username, newStatus) => {
    setRoster((prev) =>
      prev.map((student) =>
        student.username === username
          ? { ...student, status: newStatus }
          : student,
      ),
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedBatchId || !selectedDate) {
      setErrorMessage("Please select a batch and date.");
      return;
    }

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: selectedBatchId,
          date: selectedDate,
          records: roster,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save attendance.");
      }

      setSuccessMessage("Attendance register saved successfully!");
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="teacher-attendance animate-fade-in">
      <header className="section-header">
        <h2>Attendance Register</h2>
      </header>

      <div className="card register-setup-card">
        <div className="setup-controls">
          <div className="form-group">
            <label>Select Time Slot / Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
            >
              <option value="">-- Select Class --</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.timeSlot})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
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

      {selectedBatchId && (
        <div className="card register-sheet-card">
          <div className="sheet-header">
            <h3>{activeBatch?.name} — Roster Sheet</h3>
            <span className="sheet-date">Date: {selectedDate}</span>
          </div>

          {loading ? (
            <p className="loading-text">Loading student roster list...</p>
          ) : roster.length === 0 ? (
            <p className="no-students">
              This batch does not have any students assigned to it. Assign
              students in Roster Manager first.
            </p>
          ) : (
            <form onSubmit={handleSave}>
              <div className="attendance-table-container">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Student Roster</th>
                      <th style={{ textAlign: "center" }}>Present</th>
                      <th style={{ textAlign: "center" }}>Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((student) => (
                      <tr key={student.username}>
                        <td className="student-name-cell">
                          {student.username}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <label className="radio-label">
                            <input
                              type="radio"
                              name={`attendance-${student.username}`}
                              checked={student.status === "present"}
                              onChange={() =>
                                handleStatusChange(student.username, "present")
                              }
                            />
                            <span className="custom-radio present-radio"></span>
                          </label>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <label className="radio-label">
                            <input
                              type="radio"
                              name={`attendance-${student.username}`}
                              checked={student.status === "absent"}
                              onChange={() =>
                                handleStatusChange(student.username, "absent")
                              }
                            />
                            <span className="custom-radio absent-radio"></span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sheet-actions">
                <button type="submit" className="btn btn-primary">
                  Save Register Entries
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

TeacherAttendance.propTypes = {
  batches: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      timeSlot: PropTypes.string.isRequired,
      students: PropTypes.arrayOf(PropTypes.string).isRequired,
    }),
  ).isRequired,
};

export default TeacherAttendance;
