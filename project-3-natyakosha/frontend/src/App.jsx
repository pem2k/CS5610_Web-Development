import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import LearningArea from "./components/LearningArea";
import TeacherCurriculum from "./components/TeacherCurriculum";
import TeacherBatches from "./components/TeacherBatches";
import TeacherAttendance from "./components/TeacherAttendance";
import TeacherFees from "./components/TeacherFees";
import StudentDashboard from "./components/StudentDashboard";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentView, setView] = useState("");
  const [curriculum, setCurriculum] = useState([]);
  const [batches, setBatches] = useState([]);

  // Auth Forms State
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      if (response.ok) {
        setUser(data);
        setView(data.role === "teacher" ? "curriculum_editor" : "learning");
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  // Fetch session status on startup
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch default curriculum and batch options
  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const currResponse = await fetch("/api/curriculum");
      if (currResponse.ok) {
        const currData = await currResponse.json();
        setCurriculum(currData);
      }

      const batchResponse = await fetch("/api/batches");
      if (batchResponse.ok) {
        const batchData = await batchResponse.json();
        setBatches(batchData);
      }
    } catch (err) {
      console.error("Error loading application data:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Auth Operations
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!usernameInput || !passwordInput) {
      setAuthError("Username and password are required.");
      return;
    }

    const endpoint = "/api/auth/login";
    const payload = { username: usernameInput, password: passwordInput };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      setUser(data);
      setUsernameInput("");
      setPasswordInput("");
      setShowPassword(false);
      setView(data.role === "teacher" ? "curriculum_editor" : "learning");
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        setUser(null);
        setView("");
        setCurriculum([]);
        setBatches([]);
        setShowPassword(false);
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (checkingAuth) {
    return (
      <div className="app-container loading-container">
        <img src="/natraj.png" alt="Nataraja Logo" className="loading-logo" />
        <h1>Natyakosha — The Dance Treasury</h1>
        <p className="loading-text animate-pulse">
          Checking access credentials...
        </p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Logged Out View */}
      {!user ? (
        <div className="auth-wrapper animate-fade-in">
          <header className="app-header">
            <img src="/natraj.png" alt="Nataraja Logo" className="auth-logo" />
            <h1>Natyakosha</h1>
          </header>

          <div className="card auth-card">
            <h2>Sign In</h2>

            {authError && (
              <div className="alert error">
                <span>{authError}</span>
                <button
                  type="button"
                  className="alert-close-btn"
                  onClick={() => setAuthError("")}
                >
                  ✕
                </button>
              </div>
            )}
            {authSuccess && (
              <div className="alert success">
                <span>{authSuccess}</span>
                <button
                  type="button"
                  className="alert-close-btn"
                  onClick={() => setAuthSuccess("")}
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="custom-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="form-group password-group">
                <label>Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="off"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Login to Portal
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Logged In View */
        <>
          <Navbar
            user={user}
            currentView={currentView}
            setView={setView}
            onLogout={handleLogout}
          />

          <main className="app-main">
            {/* Teacher views */}
            {user.role === "teacher" && currentView === "curriculum_editor" && (
              <TeacherCurriculum
                curriculum={curriculum}
                onRefresh={fetchData}
              />
            )}
            {user.role === "teacher" && currentView === "batches" && (
              <TeacherBatches batches={batches} onRefresh={fetchData} />
            )}
            {user.role === "teacher" && currentView === "attendance" && (
              <TeacherAttendance batches={batches} />
            )}
            {user.role === "teacher" && currentView === "fees" && (
              <TeacherFees />
            )}

            {/* Student views */}
            {user.role === "student" && currentView === "learning" && (
              <LearningArea curriculum={curriculum} />
            )}
            {user.role === "student" && currentView === "student_dashboard" && (
              <StudentDashboard user={user} />
            )}
          </main>

          <footer className="app-footer">
            <p>Natyakosha — The Dance Treasury &copy; 2026.</p>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;
