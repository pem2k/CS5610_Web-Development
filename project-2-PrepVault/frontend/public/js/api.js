// simple fetch wrapper for api calls

async function request(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

export const API = {
  // questions api
  async getQuestions(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        params.append(key, val);
      }
    });
    const queryString = params.toString();
    return request(`/api/questions${queryString ? "?" + queryString : ""}`);
  },

  async getQuestion(id) {
    return request(`/api/questions/${id}`);
  },

  async createQuestion(questionData) {
    return request("/api/questions", {
      method: "POST",
      body: JSON.stringify(questionData),
    });
  },

  async updateQuestion(id, questionData) {
    return request(`/api/questions/${id}`, {
      method: "PUT",
      body: JSON.stringify(questionData),
    });
  },

  async deleteQuestion(id) {
    return request(`/api/questions/${id}`, {
      method: "DELETE",
    });
  },

  async addAppearance(questionId, appearanceData) {
    return request(`/api/questions/${questionId}/appearances`, {
      method: "POST",
      body: JSON.stringify(appearanceData),
    });
  },

  async removeAppearance(questionId, appearanceData) {
    return request(`/api/questions/${questionId}/appearances`, {
      method: "DELETE",
      body: JSON.stringify(appearanceData),
    });
  },

  // topics api
  async getTopics() {
    return request("/api/topics");
  },

  async createTopic(topicData) {
    return request("/api/topics", {
      method: "POST",
      body: JSON.stringify(topicData),
    });
  },

  async updateTopic(id, topicData) {
    return request(`/api/topics/${id}`, {
      method: "PUT",
      body: JSON.stringify(topicData),
    });
  },

  async deleteTopic(id) {
    return request(`/api/topics/${id}`, {
      method: "DELETE",
    });
  },

  // companies api
  async getCompanies() {
    return request("/api/companies");
  },

  async createCompany(companyData) {
    return request("/api/companies", {
      method: "POST",
      body: JSON.stringify(companyData),
    });
  },

  async updateCompany(id, companyData) {
    return request(`/api/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(companyData),
    });
  },

  async deleteCompany(id) {
    return request(`/api/companies/${id}`, {
      method: "DELETE",
    });
  },

  // auth & seeding api
  async signup(username, email, password) {
    return request("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  },

  async login(email, password) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async logout() {
    return request("/api/auth/logout", {
      method: "POST",
    });
  },

  async getMe() {
    return request("/api/auth/me");
  },

  async seedLeetcode() {
    return request("/api/questions/seed-leetcode", {
      method: "POST",
    });
  },

  async deleteAccount() {
    return request("/api/auth/delete-account", {
      method: "DELETE",
    });
  },
};
