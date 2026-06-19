import { API } from "./api.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderQuestionsPage } from "./views/questions.js";
import { renderTopicsPage } from "./views/topics.js";

const routes = {
  "/dashboard": {
    title: "Dashboard",
    render: renderDashboard,
    navId: "nav-dashboard",
  },
  "/questions": {
    title: "Questions",
    render: renderQuestionsPage,
    navId: "nav-questions",
  },
  "/topics": {
    title: "Topics & Companies",
    render: renderTopicsPage,
    navId: "nav-topics",
  },
};

const mainContent = document.getElementById("main-content");
const pageTitle = document.getElementById("page-title");
const authContainer = document.getElementById("auth-container");
const appContainer = document.getElementById("app-container");
const userDisplayName = document.getElementById("user-display-name");
const userAvatar = document.getElementById("user-avatar");

let currentUser = null;

function router() {
  if (!currentUser) return; // wait for auth check first

  let path = window.location.pathname;

  // fallback to dashboard if path is root or invalid
  if (path === "/" || !routes[path]) {
    path = "/dashboard";
    window.history.replaceState({}, "", path);
  }

  const route = routes[path];

  // update page titles
  pageTitle.textContent = route.title;
  document.title = `PrepVault - ${route.title}`;

  // update active sidebar state
  document.querySelectorAll(".sidebar .nav-item").forEach((item) => {
    item.classList.remove("active");
  });
  const activeNavItem = document.getElementById(route.navId);
  if (activeNavItem) {
    activeNavItem.classList.add("active");
  }

  // draw page content
  route.render(mainContent);
}

// toggle dashboard vs auth layout
function toggleAuthLayout(isAuthenticated) {
  if (isAuthenticated) {
    authContainer.style.display = "none";
    appContainer.style.display = "grid";
  } else {
    appContainer.style.display = "none";
    authContainer.style.display = "flex";
  }
}

// setup auth forms
function setupAuthListeners() {
  const tabLogin = document.getElementById("tab-login");
  const tabSignup = document.getElementById("tab-signup");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const authError = document.getElementById("auth-error");

  // swap active tabs
  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
    loginForm.classList.add("active");
    signupForm.classList.remove("active");
    authError.style.display = "none";
  });

  tabSignup.addEventListener("click", () => {
    tabSignup.classList.add("active");
    tabLogin.classList.remove("active");
    signupForm.classList.add("active");
    loginForm.classList.remove("active");
    authError.style.display = "none";
  });

  // handle login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authError.style.display = "none";
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      const data = await API.login(email, password);
      currentUser = data.user;
      userDisplayName.textContent = currentUser.username;
      userAvatar.textContent = currentUser.username.substring(0, 2).toUpperCase();

      toggleAuthLayout(true);
      router();
    } catch (err) {
      authError.textContent = err.message || "Failed to log in";
      authError.style.display = "block";
    }
  });

  // show/hide password buttons
  const bindToggle = (inputId, buttonId) => {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(buttonId);
    if (input && btn) {
      btn.addEventListener("click", () => {
        const type = input.getAttribute("type") === "password" ? "text" : "password";
        input.setAttribute("type", type);
        if (type === "text") {
          btn.innerHTML = `
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" class="eye-icon" viewBox="0 0 24 24">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          `;
          btn.setAttribute("title", "Hide password");
        } else {
          btn.innerHTML = `
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" class="eye-icon" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          `;
          btn.setAttribute("title", "Show password");
        }
      });
    }
  };

  bindToggle("login-password", "toggle-login-password");
  bindToggle("signup-password", "toggle-signup-password");

  // handle signup
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authError.style.display = "none";
    const username = document.getElementById("signup-username").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    if (password.length < 8) {
      authError.textContent = "Password must be at least 8 characters long.";
      authError.style.display = "flex";
      return;
    }
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(password)) {
      authError.textContent = "Password must contain at least one special character.";
      authError.style.display = "flex";
      return;
    }

    try {
      const data = await API.signup(username, email, password);
      currentUser = data.user;
      userDisplayName.textContent = currentUser.username;
      userAvatar.textContent = currentUser.username.substring(0, 2).toUpperCase();

      toggleAuthLayout(true);
      router();
    } catch (err) {
      authError.textContent = err.message || "Failed to create account";
      authError.style.display = "flex";
    }
  });

  // handle logout
  document.getElementById("btn-logout").addEventListener("click", async () => {
    try {
      await API.logout();
      currentUser = null;
      toggleAuthLayout(false);
      loginForm.reset();
      signupForm.reset();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  });

  // handle delete account
  const btnDeleteAccount = document.getElementById("btn-delete-account");
  if (btnDeleteAccount) {
    btnDeleteAccount.addEventListener("click", async () => {
      const confirmDelete = confirm(
        "Are you absolutely sure you want to delete your account? This action is permanent and will delete all your questions, topics, companies, and stats."
      );
      if (!confirmDelete) return;

      try {
        await API.deleteAccount();
        currentUser = null;
        toggleAuthLayout(false);
        loginForm.reset();
        signupForm.reset();
        alert("Your account and data have been deleted successfully.");
      } catch (err) {
        alert(err.message || "Failed to delete account.");
      }
    });
  }
}

// intercept link clicks for client-side routing
document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (!link) return;

  const url = new URL(link.href);
  if (url.origin === window.location.origin) {
    e.preventDefault();
    if (window.location.pathname !== url.pathname) {
      window.history.pushState({}, "", url.pathname);
      router();
    }
  }
});

// back/forward navigation support
window.addEventListener("popstate", router);

// bootstrap the app
document.addEventListener("DOMContentLoaded", async () => {
  setupAuthListeners();

  try {
    const user = await API.getMe();
    currentUser = user;
    userDisplayName.textContent = currentUser.username;
    userAvatar.textContent = currentUser.username.substring(0, 2).toUpperCase();

    toggleAuthLayout(true);
    router();
  } catch {
    // not logged in, show auth screen
    toggleAuthLayout(false);
  }
});
