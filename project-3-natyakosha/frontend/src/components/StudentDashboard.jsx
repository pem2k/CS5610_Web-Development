import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./StudentDashboard.css";

function StudentDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("attendance"); // 'attendance', 'fees', 'account'
  const [attendance, setAttendance] = useState(null);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  const fetchStudentData = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      // 1. Fetch personal attendance statistics
      const attendanceRes = await fetch("/api/attendance/my");
      const attendanceData = await attendanceRes.json();
      if (!attendanceRes.ok)
        throw new Error(
          attendanceData.error || "Failed to fetch attendance summary.",
        );
      setAttendance(attendanceData);

      // 2. Fetch personal fee ledger
      const feesRes = await fetch("/api/fees/my");
      const feesData = await feesRes.json();
      if (!feesRes.ok)
        throw new Error(feesData.error || "Failed to fetch fees details.");
      setFees(feesData);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (newPassword !== confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update password.");
      }

      setPassSuccess("Your password has been changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPassError(err.message);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handlePayFee = async (paymentId, monthName) => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/fees/my/pay/${paymentId}`, {
        method: "POST",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to process payment.");
      }

      setSuccessMessage(
        `Payment for '${monthName}' cycle completed successfully!`,
      );
      fetchStudentData();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  if (loading && !attendance) {
    return <p className="loading-text">Loading performance metrics...</p>;
  }

  const { summary, history } = attendance || { summary: {}, history: [] };

  return (
    <div className="student-dashboard animate-fade-in">
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

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === "attendance" ? "active" : ""}`}
          onClick={() => setActiveTab("attendance")}
        >
          Attendance Tracking
        </button>
        <button
          className={`tab-btn ${activeTab === "fees" ? "active" : ""}`}
          onClick={() => setActiveTab("fees")}
        >
          Fees Tracking
        </button>
        <button
          className={`tab-btn ${activeTab === "account" ? "active" : ""}`}
          onClick={() => setActiveTab("account")}
        >
          Account Details
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content animate-fade-in">
        {activeTab === "attendance" && (
          <div
            className="card performance-card"
            style={{ maxWidth: "800px", margin: "0 auto" }}
          >
            <h3>Attendance Standing</h3>

            <div className="attendance-percentage-box">
              <div className="percentage-circle">
                <span className="rate-num">{summary.presenceRate}%</span>
                <span className="rate-lbl">Presence</span>
              </div>

              <div className="attendance-stats">
                <div className="stat-row">
                  <span>Total Classes:</span>
                  <strong>{summary.totalClasses}</strong>
                </div>
                <div className="stat-row text-success">
                  <span>Attended:</span>
                  <strong>{summary.presentCount}</strong>
                </div>
                <div className="stat-row text-danger">
                  <span>Absent:</span>
                  <strong>{summary.absentCount}</strong>
                </div>
              </div>
            </div>

            <div className="attendance-history-ledger">
              <h4>History Register</h4>
              <div
                className="list-container"
                style={{ maxHeight: "250px", overflowY: "auto" }}
              >
                {history.length === 0 ? (
                  <p className="no-data">
                    No attendance records registered yet.
                  </p>
                ) : (
                  <table className="custom-table table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item) => (
                        <tr key={item._id}>
                          <td>{item.date}</td>
                          <td>
                            <span
                              className={`status-pill ${item.status === "present" ? "paid" : "unpaid"}`}
                            >
                              {item.status === "present" ? "Present" : "Absent"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "fees" && (
          <div
            className="card fees-card"
            style={{ maxWidth: "900px", margin: "0 auto" }}
          >
            <h3>Invoice Statements</h3>
            <div className="table-container">
              {fees.length === 0 ? (
                <p className="no-data">
                  No tuition invoice statements created for your account.
                </p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Billing Cycle</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((item) => (
                      <tr key={item._id}>
                        <td>{item.monthName || "Monthly"}</td>
                        <td>{item.dueDate}</td>
                        <td>${item.amount}</td>
                        <td>
                          <span className={`status-pill ${item.status}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          {item.status === "unpaid" ? (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() =>
                                handlePayFee(item._id, item.monthName)
                              }
                            >
                              Pay Now
                            </button>
                          ) : (
                            <span className="text-muted text-sm">
                              Paid on {item.paidDate}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "account" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "2rem",
              maxWidth: "1000px",
              margin: "0 auto",
            }}
          >
            <div className="card profile-details-card">
              <h3>Profile Information</h3>
              <div
                className="profile-info-grid"
                style={{ display: "grid", gap: "1.25rem", marginTop: "1.5rem" }}
              >
                <div
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    paddingBottom: "0.75rem",
                  }}
                >
                  <span
                    className="text-secondary"
                    style={{
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    First Name
                  </span>
                  <p
                    style={{
                      margin: "0.25rem 0 0 0",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                    }}
                  >
                    {user?.firstName || "Not Specified"}
                  </p>
                </div>
                <div
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    paddingBottom: "0.75rem",
                  }}
                >
                  <span
                    className="text-secondary"
                    style={{
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Last Name / Surname
                  </span>
                  <p
                    style={{
                      margin: "0.25rem 0 0 0",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                    }}
                  >
                    {user?.lastName || "Not Specified"}
                  </p>
                </div>
                <div
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    paddingBottom: "0.75rem",
                  }}
                >
                  <span
                    className="text-secondary"
                    style={{
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Username
                  </span>
                  <p
                    style={{
                      margin: "0.25rem 0 0 0",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                    }}
                  >
                    {user?.username}
                  </p>
                </div>
                <div
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    paddingBottom: "0.75rem",
                  }}
                >
                  <span
                    className="text-secondary"
                    style={{
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Account Created On
                  </span>
                  <p
                    style={{
                      margin: "0.25rem 0 0 0",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                    }}
                  >
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="card password-change-card">
              <h3>Change Password</h3>
              <p
                className="text-muted"
                style={{ fontSize: "0.85rem", marginBottom: "1.25rem" }}
              >
                Update your account security password. Keep it secure and
                memorize your new credentials.
              </p>

              {passError && (
                <div className="alert error">
                  <span>{passError}</span>
                  <button
                    type="button"
                    className="alert-close-btn"
                    onClick={() => setPassError("")}
                  >
                    ✕
                  </button>
                </div>
              )}
              {passSuccess && (
                <div className="alert success">
                  <span>{passSuccess}</span>
                  <button
                    type="button"
                    className="alert-close-btn"
                    onClick={() => setPassSuccess("")}
                  >
                    ✕
                  </button>
                </div>
              )}

              <form
                onSubmit={handleChangePassword}
                className="custom-form"
                style={{ marginTop: "1.5rem" }}
              >
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "1rem" }}
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

StudentDashboard.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    createdAt: PropTypes.string,
  }).isRequired,
};

export default StudentDashboard;
