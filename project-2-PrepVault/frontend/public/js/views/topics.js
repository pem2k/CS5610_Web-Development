import { API } from "../api.js";

export async function renderTopicsPage(container) {
  // view state
  let topics = [];
  let companies = [];

  container.innerHTML = `
    <div class="management-layout fade-in">
      <!-- topics -->
      <section class="management-card">
        <div class="management-header">
          <h2 class="management-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            Topics
          </h2>
          <button id="btn-add-topic" class="btn-primary">Add Topic</button>
        </div>
        <div id="topics-list" class="management-list">
          <!-- topics load here -->
        </div>
      </section>

      <!-- companies -->
      <section class="management-card">
        <div class="management-header">
          <h2 class="management-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            Companies
          </h2>
          <button id="btn-add-company" class="btn-primary">Add Company</button>
        </div>
        <div id="companies-list" class="management-list">
          <!-- companies load here -->
        </div>
      </section>
    </div>

    <!-- topic modal -->
    <div class="modal-overlay" id="topic-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title" id="topic-modal-title">Add Topic</h3>
          <button class="modal-close" id="topic-modal-close" aria-label="Close modal">
            &times;
          </button>
        </div>
        <form id="topic-form">
          <input type="hidden" id="topic-id" />
          <div class="modal-body">
            <div class="form-group">
              <label for="t-name" class="form-label">Topic Name *</label>
              <input
                type="text"
                id="t-name"
                class="form-control"
                placeholder="e.g. Graphs"
                required
              />
            </div>
            <div class="form-group">
              <label for="t-desc" class="form-label">Description (Optional)</label>
              <textarea
                id="t-desc"
                class="form-control"
                placeholder="Briefly describe what this topic covers..."
              ></textarea>
            </div>
            <div class="form-group">
              <label for="t-color" class="form-label">Color *</label>
              <div class="color-picker-wrapper">
                <input type="color" id="t-color" class="color-input" value="#6366f1" />
                <span id="t-color-text">#6366f1</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="topic-modal-cancel">Cancel</button>
            <button type="submit" class="btn-primary">Save Topic</button>
          </div>
        </form>
      </div>
    </div>

    <!-- company modal -->
    <div class="modal-overlay" id="company-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title" id="company-modal-title">Add Company</h3>
          <button class="modal-close" id="company-modal-close" aria-label="Close modal">
            &times;
          </button>
        </div>
        <form id="company-form">
          <input type="hidden" id="company-id" />
          <div class="modal-body">
            <div class="form-group">
              <label for="c-name" class="form-label">Company Name *</label>
              <input
                type="text"
                id="c-name"
                class="form-control"
                placeholder="e.g. Google"
                required
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="company-modal-cancel">Cancel</button>
            <button type="submit" class="btn-primary">Save Company</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // inputs
  const topicModal = document.getElementById("topic-modal");
  const topicForm = document.getElementById("topic-form");
  const topicIdInput = document.getElementById("topic-id");
  const tNameInput = document.getElementById("t-name");
  const tDescInput = document.getElementById("t-desc");
  const tColorInput = document.getElementById("t-color");
  const tColorText = document.getElementById("t-color-text");

  const companyModal = document.getElementById("company-modal");
  const companyForm = document.getElementById("company-form");
  const companyIdInput = document.getElementById("company-id");
  const cNameInput = document.getElementById("c-name");

  // API loads
  async function loadData() {
    try {
      topics = await API.getTopics();
      companies = await API.getCompanies();

      renderTopics();
      renderCompanies();
    } catch (error) {
      console.error("Error loading management data:", error);
    }
  }

  // render topics list
  function renderTopics() {
    const listEl = document.getElementById("topics-list");
    if (topics.length === 0) {
      listEl.innerHTML =
        '<p style="color:var(--text-muted); text-align:center; padding: 20px;">No topics defined. Click "Add Topic" to start.</p>';
      return;
    }

    listEl.innerHTML = topics
      .map(
        (t) => `
      <div class="management-item" data-id="${t._id}">
        <div class="item-main">
          <span class="item-color-indicator" style="background-color: ${t.color || "#6366f1"};"></span>
          <div class="item-info">
            <span class="item-name">${t.name}</span>
            <span class="item-desc">${t.description || "No description"}</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-icon btn-edit-topic" title="Edit Topic" data-id="${t._id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-icon btn-icon-danger btn-delete-topic" title="Delete Topic" data-id="${t._id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </div>
    `
      )
      .join("");

    // click handlers for items
    listEl.querySelectorAll(".btn-edit-topic").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const topic = topics.find((t) => t._id === id);
        if (topic) openTopicModal(topic);
      });
    });

    listEl.querySelectorAll(".btn-delete-topic").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const topic = topics.find((t) => t._id === id);
        if (
          topic &&
          confirm(
            `Are you sure you want to delete topic "${topic.name}"?\nQuestions in this topic will become uncategorized.`
          )
        ) {
          try {
            await API.deleteTopic(id);
            loadData();
          } catch (err) {
            alert(err.message || "Failed to delete topic");
          }
        }
      });
    });
  }

  // render companies list
  function renderCompanies() {
    const listEl = document.getElementById("companies-list");
    if (companies.length === 0) {
      listEl.innerHTML =
        '<p style="color:var(--text-muted); text-align:center; padding: 20px;">No companies defined. Click "Add Company" to start.</p>';
      return;
    }

    listEl.innerHTML = companies
      .map(
        (c) => `
      <div class="management-item" data-id="${c._id}">
        <div class="item-main">
          <div class="item-info">
            <span class="item-name">${c.name}</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-icon btn-edit-company" title="Edit Company" data-id="${c._id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-icon btn-icon-danger btn-delete-company" title="Delete Company" data-id="${c._id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </div>
    `
      )
      .join("");

    // click handlers for items
    listEl.querySelectorAll(".btn-edit-company").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const company = companies.find((c) => c._id === id);
        if (company) openCompanyModal(company);
      });
    });

    listEl.querySelectorAll(".btn-delete-company").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const company = companies.find((c) => c._id === id);
        if (
          company &&
          confirm(
            `Are you sure you want to delete company "${company.name}"?\nThis will remove all appearances of this company from your questions.`
          )
        ) {
          try {
            await API.deleteCompany(id);
            loadData();
          } catch (err) {
            alert(err.message || "Failed to delete company");
          }
        }
      });
    });
  }

  // topic modal helper
  function openTopicModal(topic = null) {
    if (topic) {
      document.getElementById("topic-modal-title").textContent = "Edit Topic";
      topicIdInput.value = topic._id;
      tNameInput.value = topic.name;
      tDescInput.value = topic.description || "";
      tColorInput.value = topic.color || "#6366f1";
      tColorText.textContent = topic.color || "#6366f1";
    } else {
      document.getElementById("topic-modal-title").textContent = "Add Topic";
      topicForm.reset();
      topicIdInput.value = "";
      tColorInput.value = "#6366f1";
      tColorText.textContent = "#6366f1";
    }
    topicModal.classList.add("active");
  }

  // company modal helper
  function openCompanyModal(company = null) {
    if (company) {
      document.getElementById("company-modal-title").textContent = "Edit Company";
      companyIdInput.value = company._id;
      cNameInput.value = company.name;
    } else {
      document.getElementById("company-modal-title").textContent = "Add Company";
      companyForm.reset();
      companyIdInput.value = "";
    }
    companyModal.classList.add("active");
  }

  // edit/add triggers
  document.getElementById("btn-add-topic").addEventListener("click", () => openTopicModal());
  document.getElementById("btn-add-company").addEventListener("click", () => openCompanyModal());

  // save topic
  topicForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = topicIdInput.value;
    const data = {
      name: tNameInput.value,
      description: tDescInput.value,
      color: tColorInput.value,
    };

    try {
      if (id) {
        await API.updateTopic(id, data);
      } else {
        await API.createTopic(data);
      }
      topicModal.classList.remove("active");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to save topic");
    }
  });

  // update color input text preview
  tColorInput.addEventListener("input", (e) => {
    tColorText.textContent = e.target.value;
  });

  // save company
  companyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = companyIdInput.value;
    const data = {
      name: cNameInput.value,
    };

    try {
      if (id) {
        await API.updateCompany(id, data);
      } else {
        await API.createCompany(data);
      }
      companyModal.classList.remove("active");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to save company");
    }
  });

  // cancel triggers
  document
    .getElementById("topic-modal-close")
    .addEventListener("click", () => topicModal.classList.remove("active"));
  document
    .getElementById("topic-modal-cancel")
    .addEventListener("click", () => topicModal.classList.remove("active"));

  document
    .getElementById("company-modal-close")
    .addEventListener("click", () => companyModal.classList.remove("active"));
  document
    .getElementById("company-modal-cancel")
    .addEventListener("click", () => companyModal.classList.remove("active"));

  // close on overlay click
  window.addEventListener("click", (e) => {
    if (e.target === topicModal) topicModal.classList.remove("active");
    if (e.target === companyModal) companyModal.classList.remove("active");
  });

  // load on page init
  await loadData();
}
