import { API } from "../api.js";

export async function renderDashboard(container) {
  container.innerHTML = `
    <div class="fade-in" style="text-align: center; padding: 40px;">
      <p style="color: var(--text-muted);">Loading dashboard analytics...</p>
    </div>
  `;

  try {
    let username = "My";
    try {
      const me = await API.getMe();
      if (me && me.username) {
        username = me.username;
      }
    } catch (err) {
      console.error("Failed to fetch user info in dashboard:", err);
    }

    const questions = await API.getQuestions();
    const topics = await API.getTopics();

    const leetcodeQs = questions.filter((q) => q.isSeeded === true);
    const personalQs = questions.filter((q) => q.isSeeded !== true);

    const ltTotal = leetcodeQs.length;
    const ltPracticed = leetcodeQs.filter((q) => q.practiced).length;
    const ltPercent = ltTotal > 0 ? Math.round((ltPracticed / ltTotal) * 100) : 0;
    const ltEasy = leetcodeQs.filter((q) => q.difficulty === "Easy").length;
    const ltMedium = leetcodeQs.filter((q) => q.difficulty === "Medium").length;
    const ltHard = leetcodeQs.filter((q) => q.difficulty === "Hard").length;
    const ltEasyPct = ltTotal > 0 ? Math.round((ltEasy / ltTotal) * 100) : 0;
    const ltMediumPct = ltTotal > 0 ? Math.round((ltMedium / ltTotal) * 100) : 0;
    const ltHardPct = ltTotal > 0 ? Math.round((ltHard / ltTotal) * 100) : 0;

    const psTotal = personalQs.length;
    const psPracticed = personalQs.filter((q) => q.practiced).length;
    const psPercent = psTotal > 0 ? Math.round((psPracticed / psTotal) * 100) : 0;
    const psEasy = personalQs.filter((q) => q.difficulty === "Easy").length;
    const psMedium = personalQs.filter((q) => q.difficulty === "Medium").length;
    const psHard = personalQs.filter((q) => q.difficulty === "Hard").length;
    const psEasyPct = psTotal > 0 ? Math.round((psEasy / psTotal) * 100) : 0;
    const psMediumPct = psTotal > 0 ? Math.round((psMedium / psTotal) * 100) : 0;
    const psHardPct = psTotal > 0 ? Math.round((psHard / psTotal) * 100) : 0;

    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const ltStrokeDashoffset = circumference - (ltPercent / 100) * circumference;
    const psStrokeDashoffset = circumference - (psPercent / 100) * circumference;

    const totalTopics = topics.length;

    // sort by total questions descending
    const sortedTopics = [...topics].sort((a, b) => b.totalQuestions - a.totalQuestions);

    let topicsProgressHTML = "";
    if (sortedTopics.length === 0) {
      topicsProgressHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <p>No topics added yet. Go to "Topics & Companies" to create some.</p>
        </div>
      `;
    } else {
      topicsProgressHTML = `
        <div class="topic-progress-list">
          ${sortedTopics
            .slice(0, 5) // top 5 only
            .map((t) => {
              const pct =
                t.totalQuestions > 0
                  ? Math.round((t.practicedQuestions / t.totalQuestions) * 100)
                  : 0;
              return `
              <div class="topic-progress-item">
                <div class="topic-item-header">
                  <span class="topic-item-title">
                    <span class="topic-item-dot" style="background-color: ${t.color || "#6366f1"};"></span>
                    ${t.name}
                  </span>
                  <span class="topic-item-stats">
                    ${t.practicedQuestions} / ${t.totalQuestions} practiced (${pct}%)
                  </span>
                </div>
                <div class="topic-progress-track">
                  <div class="topic-progress-fill" style="width: ${pct}%; background-color: ${t.color || "#6366f1"};"></div>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="fade-in">
        <!-- dashboard widgets -->
        <div class="dashboard-split">
          
          <!-- leetcode card -->
          <div class="dashboard-split-card">
            <div class="dashboard-split-card-header">
              <span class="dashboard-split-card-title">📚 LeetCode Library</span>
            </div>
            
            <div class="dashboard-split-card-body">
              <div class="dashboard-split-card-stats">
                <span class="dashboard-split-card-label">Total Questions</span>
                <span class="dashboard-split-card-value">${ltTotal}</span>
                <span class="dashboard-split-card-subtitle">${ltPracticed} practiced / ${ltTotal - ltPracticed} remaining</span>
              </div>
              
              <div class="progress-ring-container">
                <svg width="70" height="70">
                  <circle class="progress-ring-bg" cx="35" cy="35" r="${radius}"></circle>
                  <circle class="progress-ring-circle" cx="35" cy="35" r="${radius}" 
                          stroke-dasharray="${circumference} ${circumference}" 
                          stroke-dashoffset="${ltStrokeDashoffset}"></circle>
                </svg>
                <div class="progress-percent-text">${ltPercent}%</div>
              </div>
            </div>

            <!-- difficulty stats -->
            <div class="difficulty-breakdown" style="margin-top: 10px;">
              <h4 style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Difficulty Distribution</h4>
              ${
                ltTotal === 0
                  ? `
                <div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 10px 0;">No LeetCode questions seeded yet.</div>
              `
                  : `
                <div class="difficulty-bars">
                  <div class="difficulty-bar easy" style="width: ${ltEasyPct}%;" title="Easy: ${ltEasyPct}%"></div>
                  <div class="difficulty-bar medium" style="width: ${ltMediumPct}%;" title="Medium: ${ltMediumPct}%"></div>
                  <div class="difficulty-bar hard" style="width: ${ltHardPct}%;" title="Hard: ${ltHardPct}%"></div>
                </div>

                <div class="difficulty-legend">
                  <div class="legend-item">
                    <span class="legend-label"><span class="legend-dot easy"></span>Easy</span>
                    <span class="legend-count">${ltEasy} <span class="legend-pct">(${ltEasyPct}%)</span></span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-label"><span class="legend-dot medium"></span>Medium</span>
                    <span class="legend-count">${ltMedium} <span class="legend-pct">(${ltMediumPct}%)</span></span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-label"><span class="legend-dot hard"></span>Hard</span>
                    <span class="legend-count">${ltHard} <span class="legend-pct">(${ltHardPct}%)</span></span>
                  </div>
                </div>
              `
              }
            </div>
          </div>

          <!-- personal vault card -->
          <div class="dashboard-split-card">
            <div class="dashboard-split-card-header">
              <span class="dashboard-split-card-title">🛠️ ${username}'s Vault</span>
            </div>
            
            <div class="dashboard-split-card-body">
              <div class="dashboard-split-card-stats">
                <span class="dashboard-split-card-label">Total Questions</span>
                <span class="dashboard-split-card-value">${psTotal}</span>
                <span class="dashboard-split-card-subtitle">${psPracticed} practiced / ${psTotal - psPracticed} remaining</span>
              </div>
              
              <div class="progress-ring-container">
                <svg width="70" height="70">
                  <circle class="progress-ring-bg" cx="35" cy="35" r="${radius}"></circle>
                  <circle class="progress-ring-circle" cx="35" cy="35" r="${radius}" 
                          stroke-dasharray="${circumference} ${circumference}" 
                          stroke-dashoffset="${psStrokeDashoffset}"></circle>
                </svg>
                <div class="progress-percent-text">${psPercent}%</div>
              </div>
            </div>

            <!-- difficulty stats -->
            <div class="difficulty-breakdown" style="margin-top: 10px;">
              <h4 style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Difficulty Distribution</h4>
              ${
                psTotal === 0
                  ? `
                <div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 10px 0;">No personal questions added yet.</div>
              `
                  : `
                <div class="difficulty-bars">
                  <div class="difficulty-bar easy" style="width: ${psEasyPct}%;" title="Easy: ${psEasyPct}%"></div>
                  <div class="difficulty-bar medium" style="width: ${psMediumPct}%;" title="Medium: ${psMediumPct}%"></div>
                  <div class="difficulty-bar hard" style="width: ${psHardPct}%;" title="Hard: ${psHardPct}%"></div>
                </div>

                <div class="difficulty-legend">
                  <div class="legend-item">
                    <span class="legend-label"><span class="legend-dot easy"></span>Easy</span>
                    <span class="legend-count">${psEasy} <span class="legend-pct">(${psEasyPct}%)</span></span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-label"><span class="legend-dot medium"></span>Medium</span>
                    <span class="legend-count">${psMedium} <span class="legend-pct">(${psMediumPct}%)</span></span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-label"><span class="legend-dot hard"></span>Hard</span>
                    <span class="legend-count">${psHard} <span class="legend-pct">(${psHardPct}%)</span></span>
                  </div>
                </div>
              `
              }
            </div>
          </div>

        </div>

        <!-- focus areas -->
        <div class="dashboard-sections" style="grid-template-columns: 1fr;">
          <div class="dashboard-panel">
            <div class="panel-header">
              <h2 class="panel-title">Topic Progress (Top 5 Focus Areas)</h2>
              <span style="font-size: 0.85rem; color: var(--text-muted);">Total Topics: ${totalTopics}</span>
            </div>
            ${topicsProgressHTML}
          </div>
        </div>

      </div>
    `;
  } catch (error) {
    console.error("Dashboard render error:", error);
    container.innerHTML = `
      <div class="fade-in" style="text-align: center; padding: 40px; color: var(--color-hard);">
        <p>Error loading dashboard. Please verify your database connection.</p>
      </div>
    `;
  }
}
