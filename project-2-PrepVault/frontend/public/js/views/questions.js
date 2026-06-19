import { API } from "../api.js";

// simple debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export async function renderQuestionsPage(container) {
  // show personal brand on tab
  let username = "My";
  try {
    const me = await API.getMe();
    if (me && me.username) {
      username = me.username;
    }
  } catch (err) {
    console.error("Failed to fetch user info in questions page:", err);
  }

  // view state
  let questions = [];
  let topics = [];
  let companies = [];
  let currentFilters = {
    topicId: "",
    companyId: "",
    difficulty: "",
    practiced: "",
    q: "",
    isSeeded: "true", // Default to LeetCode questions
  };

  // shell layout
  container.innerHTML = `
    <div class="questions-layout fade-in">
      <!-- filters -->
      <aside class="filters-sidebar">
        <div class="filter-title">
          <span>Filters</span>
          <button id="btn-reset-filters" class="btn-reset-filters">Reset</button>
        </div>
        
        <div class="filter-group">
          <label class="form-label" for="filter-topic">Topic</label>
          <select id="filter-topic" class="form-control">
            <option value="">All Topics</option>
            <option value="none">Uncategorized</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="form-label" for="filter-company">Company</label>
          <select id="filter-company" class="form-control">
            <option value="">All Companies</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="form-label" for="filter-difficulty">Difficulty</label>
          <select id="filter-difficulty" class="form-control">
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="form-label" for="filter-status">Practice Status</label>
          <select id="filter-status" class="form-control">
            <option value="">All Questions</option>
            <option value="true">Practiced</option>
            <option value="false">Unpracticed</option>
          </select>
        </div>
      </aside>

      <!-- main area -->
      <section class="questions-main">
        <div class="search-action-bar">
          <div class="search-container">
            <span class="search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input type="text" id="search-bar" class="search-input" placeholder="Search by title, notes, company, role...">
          </div>
          <button id="btn-add-question" class="btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Question
          </button>
        </div>

        <!-- tabs -->
        <div class="questions-type-tabs">
          <button type="button" class="questions-tab-btn active" id="tab-leetcode">LeetCode Questions</button>
          <button type="button" class="questions-tab-btn" id="tab-vault">${username}'s Vault</button>
        </div>

        <div id="questions-container" class="questions-grid">
          <!-- cards -->
        </div>
      </section>
    </div>

    <!-- detail view modal -->
    <div class="modal-overlay" id="details-modal">
      <div class="modal-content" style="max-width: 900px; width: 95%;">
        <div class="modal-header">
          <h3 class="modal-title" id="details-title">Question Details</h3>
          <button class="modal-close" id="details-modal-close" aria-label="Close modal">&times;</button>
        </div>
        <div class="modal-body" id="details-modal-body">
          <!-- dynamic details -->
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" id="details-modal-close-btn">Close</button>
        </div>
      </div>
    </div>

    <!-- question editor modal -->
    <div class="modal-overlay" id="question-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title" id="question-modal-title">Add Question</h3>
          <button class="modal-close" id="question-modal-close" aria-label="Close modal">
            &times;
          </button>
        </div>
        <form id="question-form">
          <input type="hidden" id="question-id" />
          <div class="modal-body">
            <div class="form-group">
              <label for="q-title" class="form-label">Title *</label>
              <input
                type="text"
                id="q-title"
                class="form-control"
                placeholder="e.g. Longest Substring Without Repeating Characters"
                required
              />
            </div>
            <div class="form-group">
              <label for="q-url" class="form-label">URL (Optional)</label>
              <input
                type="url"
                id="q-url"
                class="form-control"
                placeholder="e.g. https://leetcode.com/problems/... "
              />
            </div>
            <div class="form-group">
              <label for="q-difficulty" class="form-label">Difficulty *</label>
              <select id="q-difficulty" class="form-control" required>
                <option value="Easy">Easy</option>
                <option value="Medium" selected>Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div class="form-group">
              <label for="q-topic" class="form-label">Topic *</label>
              <select id="q-topic" class="form-control" required>
                <option value="">-- Select Topic --</option>
              </select>
            </div>
            <div class="form-group">
              <label class="filter-checkbox-label">
                <input type="checkbox" id="q-practiced" />
                <span class="custom-checkbox"></span>
                Mark as Practiced
              </label>
            </div>
            <div class="form-group">
              <label for="q-notes" class="form-label">Notes / Approach</label>
              <textarea
                id="q-notes"
                class="form-control"
                placeholder="Write down your solution thoughts, time complexity, or key ideas..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="question-modal-cancel">Cancel</button>
            <button type="submit" class="btn-primary">Save Question</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // DOM hookups
  const questionsContainer = document.getElementById("questions-container");
  const filterTopic = document.getElementById("filter-topic");
  const filterCompany = document.getElementById("filter-company");
  const filterDifficulty = document.getElementById("filter-difficulty");
  const filterStatus = document.getElementById("filter-status");
  const btnResetFilters = document.getElementById("btn-reset-filters");
  const searchBar = document.getElementById("search-bar");
  const btnAddQuestion = document.getElementById("btn-add-question");

  const questionModal = document.getElementById("question-modal");
  const questionForm = document.getElementById("question-form");
  const questionIdInput = document.getElementById("question-id");
  const qTitleInput = document.getElementById("q-title");
  const qUrlInput = document.getElementById("q-url");
  const qDifficultySelect = document.getElementById("q-difficulty");
  const qTopicSelect = document.getElementById("q-topic");
  const qPracticedCheckbox = document.getElementById("q-practiced");
  const qNotesTextarea = document.getElementById("q-notes");

  const detailsModal = document.getElementById("details-modal");
  const detailsModalBody = document.getElementById("details-modal-body");

  // populate filter selects
  async function loadFilterOptions() {
    try {
      topics = await API.getTopics();
      companies = await API.getCompanies();

      // add topics
      topics.forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t._id;
        opt.textContent = `${t.name} (${t.totalQuestions})`;
        filterTopic.appendChild(opt);

        // add form option
        const optForm = document.createElement("option");
        optForm.value = t._id;
        optForm.textContent = t.name;
        qTopicSelect.appendChild(optForm);
      });

      companies.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c._id;
        opt.textContent = c.name;
        filterCompany.appendChild(opt);
      });
    } catch (e) {
      console.error("Error loading filter options:", e);
    }
  }

  // load questions list
  async function loadQuestions() {
    questionsContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        Loading questions...
      </div>
    `;

    try {
      questions = await API.getQuestions(currentFilters);
      renderQuestionsList();
    } catch (error) {
      console.error("Error loading questions:", error);
      questionsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--color-hard);">
          Failed to load questions.
        </div>
      `;
    }
  }

  // draw question cards
  function renderQuestionsList() {
    if (questions.length === 0) {
      questionsContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 60px 20px;">
          <div class="empty-state-icon">🔍</div>
          <h3>No questions match your criteria</h3>
          <p>Try resetting the filters or add a new question to get started.</p>
        </div>
      `;
      return;
    }

    questionsContainer.innerHTML = questions
      .map((q) => {
        const difficultyClass = `badge-${q.difficulty.toLowerCase()}`;
        const topicName = q.topic ? q.topic.name : "Uncategorized";
        const topicColor = q.topic ? q.topic.color : "#94a3b8";

        const companyBadges = (q.companyAppearances || [])
          .map((app) => {
            return `<span class="company-badge">${app.company.name} <small style="opacity: 0.8;">${app.position || ""} ${app.year || ""}</small></span>`;
          })
          .slice(0, 3)
          .join(""); // limit to 3 badges on card

        const hasMoreCompanies = (q.companyAppearances || []).length > 3;

        return `
        <div class="question-card" data-id="${q._id}">
          <div class="card-header">
            <span class="badge ${difficultyClass}">${q.difficulty}</span>
            <label class="practiced-checkbox-container" data-id="${q._id}" onclick="event.stopPropagation();">
              <input type="checkbox" ${q.practiced ? "checked" : ""} class="card-practiced-toggle">
              <span class="practiced-slider"></span>
            </label>
          </div>
          <div class="card-body">
            <h4 class="card-title">
              ${q.title}
              ${
                q.url
                  ? `
                <a href="${q.url}" target="_blank" onclick="event.stopPropagation();" class="card-link-icon" title="Open Link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              `
                  : ""
              }
            </h4>
            
            <div class="card-meta-row">
              <span class="card-topic-tag">
                <span class="card-topic-dot" style="background-color: ${topicColor};"></span>
                ${topicName}
              </span>
            </div>

            ${
              q.companyAppearances && q.companyAppearances.length > 0
                ? `
              <div class="card-company-badges">
                ${companyBadges}
                ${hasMoreCompanies ? `<span class="company-badge" style="font-style: italic;">+${q.companyAppearances.length - 3} more</span>` : ""}
              </div>
            `
                : ""
            }
          </div>
        </div>
      `;
      })
      .join("");

    // open detail view on click
    document.querySelectorAll(".question-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        openDetailsModal(id);
      });
    });

    // save practiced state immediately
    document.querySelectorAll(".card-practiced-toggle").forEach((toggle) => {
      toggle.addEventListener("change", async (e) => {
        const id = e.target.closest("label").dataset.id;
        const practiced = e.target.checked;
        try {
          await API.updateQuestion(id, { practiced });
          // save in local state for fast UI feedback
          const q = questions.find((item) => item._id === id);
          if (q) q.practiced = practiced;
        } catch (err) {
          console.error("Error updating practiced status:", err);
          e.target.checked = !practiced; // rollback on fail
        }
      });
    });
  }

  // fetch & open details
  async function openDetailsModal(id) {
    detailsModal.classList.add("active");
    detailsModalBody.innerHTML = '<p style="color: var(--text-muted);">Loading details...</p>';

    try {
      const q = await API.getQuestion(id);
      renderQuestionDetails(q);
    } catch (e) {
      console.error(e);
      detailsModalBody.innerHTML =
        '<p style="color: var(--color-hard);">Error loading details.</p>';
    }
  }

  // draw details
  function renderQuestionDetails(q) {
    const difficultyClass = `badge-${q.difficulty.toLowerCase()}`;
    const topicName = q.topic ? q.topic.name : "Uncategorized";
    const topicColor = q.topic ? q.topic.color : "#94a3b8";

    // autosave notes after delay
    const debouncedSaveNotes = debounce(async (text) => {
      const indicator = document.getElementById("notes-save-status");
      indicator.textContent = "Saving...";
      try {
        await API.updateQuestion(q._id, { notes: text });
        indicator.textContent = "Saved";
        setTimeout(() => {
          if (indicator.textContent === "Saved") indicator.textContent = "";
        }, 2000);
      } catch {
        indicator.textContent = "Error saving!";
      }
    }, 800);

    detailsModalBody.innerHTML = `
      <div class="question-details-grid">
        <!-- details panel -->
        <div class="details-main-section">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span class="badge ${difficultyClass}">${q.difficulty}</span>
              <span class="card-topic-tag">
                <span class="card-topic-dot" style="background-color: ${topicColor};"></span>
                ${topicName}
              </span>
            </div>
            <h2 style="font-size:1.6rem; font-weight:700; margin-bottom:12px;">
              ${q.title}
              ${
                q.url
                  ? `
                <a href="${q.url}" target="_blank" style="color: var(--accent-secondary); margin-left: 8px;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              `
                  : ""
              }
            </h2>
          </div>

          <div class="notes-editor-container">
            <div class="notes-header-row">
              <label for="details-notes" class="form-label" style="margin-bottom:0; font-weight:600;">Approach & Personal Notes</label>
              <span class="save-status-indicator" id="notes-save-status"></span>
            </div>
            <textarea id="details-notes" class="notes-textarea" placeholder="Describe the optimal approach, space/time complexity, corner cases, etc. (Autosaves as you type)">${q.notes || ""}</textarea>
          </div>

          <div style="display:flex; gap:12px; margin-top: 10px;">
            <button id="btn-edit-question-details" class="btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Edit Details
            </button>
            <button id="btn-delete-question-details" class="btn-danger">Delete Question</button>
          </div>
        </div>

        <!-- options sidebar -->
        <div class="details-sidebar-section">
          <div>
            <label class="filter-checkbox-label" style="font-size:1.1rem; font-weight:600; color:var(--text-primary);">
              <input type="checkbox" id="details-practiced-toggle" ${q.practiced ? "checked" : ""}>
              <span class="custom-checkbox" style="width:20px; height:20px;"></span>
              Marked as Practiced
            </label>
          </div>

          <div class="appearances-management">
            <h4 style="font-weight:600; margin-bottom:12px; font-size:1rem; border-bottom: 1px solid var(--border-color); padding-bottom:8px;">Company Appearances</h4>
            
            <div class="appearances-list" id="details-appearances-list">
              <!-- list of logged positions -->
            </div>

            <form id="add-appearance-form" class="add-appearance-form">
              <div class="form-group" style="margin-bottom:10px;">
                <label for="app-company-select" class="form-label">Add Company</label>
                <select id="app-company-select" class="form-control" required>
                  <option value="">-- Select Company --</option>
                  ${companies.map((c) => `<option value="${c._id}">${c.name}</option>`).join("")}
                </select>
              </div>
              <div class="appearance-inputs-row">
                <div>
                  <label for="app-position" class="form-label">Position / Role</label>
                  <input type="text" id="app-position" class="form-control" placeholder="e.g. SDE-2" style="padding: 8px 12px;">
                </div>
                <div>
                  <label for="app-year" class="form-label">Year</label>
                  <input type="number" id="app-year" class="form-control" placeholder="2026" value="${new Date().getFullYear()}" style="padding: 8px 12px;">
                </div>
              </div>
              <button type="submit" class="btn-secondary" style="width:100%; justify-content:center; padding: 8px; margin-top:8px;">
                + Add Appearance
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    // Render initial appearances list
    renderAppearancesList(q);

    // hook up details triggers
    const notesTextarea = document.getElementById("details-notes");
    notesTextarea.addEventListener("input", (e) => {
      debouncedSaveNotes(e.target.value);
    });

    const practicedToggle = document.getElementById("details-practiced-toggle");
    practicedToggle.addEventListener("change", async (e) => {
      const practiced = e.target.checked;
      try {
        await API.updateQuestion(q._id, { practiced });
        loadQuestions(); // refresh list in background
      } catch (err) {
        console.error(err);
        e.target.checked = !practiced;
      }
    });

    // delete action
    document.getElementById("btn-delete-question-details").addEventListener("click", async () => {
      if (confirm(`Are you sure you want to delete "${q.title}"?`)) {
        try {
          await API.deleteQuestion(q._id);
          detailsModal.classList.remove("active");
          loadQuestions();
        } catch {
          alert("Error deleting question");
        }
      }
    });

    // edit action
    document.getElementById("btn-edit-question-details").addEventListener("click", () => {
      detailsModal.classList.remove("active");
      openEditModal(q);
    });

    // add company tag
    const appForm = document.getElementById("add-appearance-form");
    appForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const companySelect = document.getElementById("app-company-select");
      const positionInput = document.getElementById("app-position");
      const yearInput = document.getElementById("app-year");

      const companyId = companySelect.value;
      const position = positionInput.value.trim();
      const year = parseInt(yearInput.value, 10);

      try {
        await API.addAppearance(q._id, { companyId, position, year });

        // refresh detail panel & background list
        const updatedQ = await API.getQuestion(q._id);
        renderQuestionDetails(updatedQ);
        loadQuestions();
      } catch (err) {
        alert(err.message || "Failed to add appearance");
      }
    });
  }

  // draw logged appearances
  function renderAppearancesList(q) {
    const listEl = document.getElementById("details-appearances-list");
    const apps = q.companyAppearances || [];

    if (apps.length === 0) {
      listEl.innerHTML =
        '<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding: 12px 0;">No logged appearances.</p>';
      return;
    }

    listEl.innerHTML = apps
      .map(
        (app, index) => `
      <div class="appearance-item" data-index="${index}">
        <div class="appearance-info">
          <span class="appearance-company">${app.company.name}</span>
          <span class="appearance-details">
            ${app.position || "N/A"} • ${app.year || "N/A"}
          </span>
        </div>
        <button class="btn-delete-appearance" title="Remove appearance" data-company-id="${app.companyId}" data-position="${app.position}" data-year="${app.year}">&times;</button>
      </div>
    `
      )
      .join("");

    // remove company tag
    listEl.querySelectorAll(".btn-delete-appearance").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const companyId = btn.dataset.companyId;
        const position = btn.dataset.position;
        const year = parseInt(btn.dataset.year, 10);

        try {
          await API.removeAppearance(q._id, { companyId, position, year });
          const updatedQ = await API.getQuestion(q._id);
          renderQuestionDetails(updatedQ);
          loadQuestions();
        } catch {
          alert("Failed to remove appearance");
        }
      });
    });
  }

  // toggle editing modal
  function openEditModal(q) {
    // fill form inputs
    document.getElementById("question-modal-title").textContent = "Edit Question";
    questionIdInput.value = q._id;
    qTitleInput.value = q.title;
    qUrlInput.value = q.url || "";
    qDifficultySelect.value = q.difficulty;
    qTopicSelect.value = q.topicId || "";
    qPracticedCheckbox.checked = !!q.practiced;
    qNotesTextarea.value = q.notes || "";

    questionModal.classList.add("active");
  }

  // reset filters
  btnResetFilters.addEventListener("click", () => {
    filterTopic.value = "";
    filterCompany.value = "";
    filterDifficulty.value = "";
    filterStatus.value = "";
    searchBar.value = "";

    currentFilters = {
      topicId: "",
      companyId: "",
      difficulty: "",
      practiced: "",
      q: "",
      isSeeded: currentFilters.isSeeded, // keep current tab selected
    };
    loadQuestions();
  });

  // filter selections
  const applyFilters = () => {
    currentFilters.topicId = filterTopic.value;
    currentFilters.companyId = filterCompany.value;
    currentFilters.difficulty = filterDifficulty.value;
    currentFilters.practiced = filterStatus.value;
    loadQuestions();
  };

  filterTopic.addEventListener("change", applyFilters);
  filterCompany.addEventListener("change", applyFilters);
  filterDifficulty.addEventListener("change", applyFilters);
  filterStatus.addEventListener("change", applyFilters);

  // debounced text filter
  searchBar.addEventListener(
    "input",
    debounce((e) => {
      currentFilters.q = e.target.value;
      loadQuestions();
    }, 300)
  );

  // tab triggers
  const tabLeetcode = document.getElementById("tab-leetcode");
  const tabVault = document.getElementById("tab-vault");

  tabLeetcode.addEventListener("click", () => {
    tabLeetcode.classList.add("active");
    tabVault.classList.remove("active");
    currentFilters.isSeeded = "true";
    loadQuestions();
  });

  tabVault.addEventListener("click", () => {
    tabVault.classList.add("active");
    tabLeetcode.classList.remove("active");
    currentFilters.isSeeded = "false";
    loadQuestions();
  });

  // add question trigger
  btnAddQuestion.addEventListener("click", () => {
    document.getElementById("question-modal-title").textContent = "Add Question";
    questionForm.reset();
    questionIdInput.value = "";
    questionModal.classList.add("active");
  });

  // save handler (create/update)
  questionForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = questionIdInput.value;
    const questionData = {
      title: qTitleInput.value,
      url: qUrlInput.value,
      difficulty: qDifficultySelect.value,
      topicId: qTopicSelect.value || null,
      practiced: qPracticedCheckbox.checked,
      notes: qNotesTextarea.value,
    };

    try {
      if (id) {
        await API.updateQuestion(id, questionData);
      } else {
        await API.createQuestion(questionData);
      }

      questionModal.classList.remove("active");
      questionForm.reset();
      loadQuestions();
    } catch (err) {
      alert(err.message || "Failed to save question");
    }
  });

  // close triggers
  document.getElementById("question-modal-close").addEventListener("click", () => {
    questionModal.classList.remove("active");
  });
  document.getElementById("question-modal-cancel").addEventListener("click", () => {
    questionModal.classList.remove("active");
  });

  const closeDetails = () => {
    detailsModal.classList.remove("active");
  };
  document.getElementById("details-modal-close").addEventListener("click", closeDetails);
  document.getElementById("details-modal-close-btn").addEventListener("click", closeDetails);

  // close on overlay click
  window.addEventListener("click", (e) => {
    if (e.target === questionModal) {
      questionModal.classList.remove("active");
    }
    if (e.target === detailsModal) {
      closeDetails();
    }
  });

  // load on page init
  await loadFilterOptions();
  await loadQuestions();
}
