# PrepVault Design Document 🎨

## 1. Project Description

PrepVault is a personal interview prep web app for grad students who are tired of managing questions across scattered notes and docs. You log questions, tag them by topic and difficulty, track which companies asked them and for what role, mark them as practiced, and add your own approach notes. When interview season hits, you filter to exactly what you need and get to work.

---

## 2. User Personas

### Persona A: Keshvi

Keshvi is a first year CS Master's student at Northeastern navigating US recruiting for the first time. She collects problems from Blind, LinkedIn, and mock interviews but has no system. She needs one place to log questions, track what she has studied, and stay on top of prep while juggling coursework and assignments.

### Persona B: Neeraja

Neeraja is Keshvi's classmate and study partner in the same MS CS program. She preps by company and role level rather than randomly grinding. With classes competing for her time she needs focused study sessions and a clear picture of where her gaps are.

---

## 3. User Stories & Use Cases

### Story 1: Logging a New Question

Keshvi spots a sliding window problem in a friend's interview debrief. She opens PrepVault, logs it with topic and difficulty in under a minute, adds her approach in the notes later, and marks it practiced. That note saves her two weeks later in an actual interview.

### Story 2: Managing Company Appearances

Keshvi hears that Meta has been asking System Design for SDE-2 roles. She opens the question, adds Meta as a company appearance with position SDE-2 and year 2024, and it shows up the next time she filters by Meta.

### Story 3: Focused Study Session

Neeraja sits down for a study session before a Google interview. She filters to Graph problems she has not practiced yet and gets a focused list immediately instead of scrolling through everything.

### Story 4: Gap Analysis and Dashboard

Neeraja opens the dashboard before interview week. She sees 47 questions logged, 31 practiced, across 8 topics. She notices 12 Graph problems but only 3 practiced. That becomes her plan for the week.

---

## 4. Design Mockups

Below are the design screenshots showing the responsive user interface of our application:

### 4.1 Authentication View (Login/Signup)

Our login and signup card supporting password validation rules and password visibility toggling.

![PrepVault Authentication Page](./frontend/public/img/1_login_signup.png)

### 4.2 Initial Dashboard (Auto-Seeded on Signup)

Our dashboard view immediately after a new user signs up. The 1,200 LeetCode questions are automatically populated, while the Personal Vault is empty until the user adds custom questions.

![Empty Dashboard Page](./frontend/public/img/2_empty_dashboard.png)

### 4.3 Topics & Companies Management Page

Our interface for adding custom topics with a color picker, as well as managing target companies.

![Topics & Companies Page](./frontend/public/img/3_topics_companies.png)

### 4.4 Case-Insensitive Deduplication Alert

An example of our case-insensitive warning alert when trying to insert a duplicate topic.

![Duplicate Warning Alert](./frontend/public/img/4_duplicate_warning.png)

### 4.5 Segregated Questions Grid and Filtering

Our questions tab showing the toggle tabs separating LeetCode Questions and the personal Vault, along with live search and sidebar filters.

![Populated Dashboard](./frontend/public/img/5_seeded_dashboard.png)

![Questions Grid](./frontend/public/img/6_questions_grid.png)

### 4.6 Account Deletion and Cascade Cleanup

Our account settings option that allows users to permanently delete their account along with a cascading cleanup of all their logged questions, custom topics, companies, and sessions.

![Account Deletion](./frontend/public/img/7_delete_account.png)

---

## 5. Work Distribution


### 5.1 Keshvi (Authentication, Questions, and Account Lifecycle)

- **Backend**:
  - Express routing and CRUD operations for the `questions` collection.
  - Authentication system setup (`POST /signup`, `POST /login`, `GET /me`), including credentials hashing and HTTP cookies/sessions.
  - User account deletion endpoint (`DELETE /delete-account`) with cascading cleanup of personal questions.
- **Frontend**:
  - Questions card list container, question card metadata displays, and practiced checkboxes.
  - Add Question and Edit Question form modals.
  - Slide-over details drawer containing the debounced autosaving notes textarea and company appearances log.
  - Authentication views, including signup forms validation and the password visibility toggle eye icon.

### 5.2 Neeraja (Analytics, Topics/Companies, Search, and Restructuring)

- **Backend**:
  - Express routing and MongoDB CRUD operations for `topics` and `companies` collections.
  - Advanced filter and search query builders for the questions GET route.
  - Automatic background seeding utility (`seedUserLeetcode`) fetching 1,200 coding problems from raw Github JSON.
  - Company deletion logic that automatically purges company details from all matching question records.
- **Frontend**:
  - Split Dashboard view rendering parallel analytics cards (LeetCode vs. User Vault) with SVG progress rings, linear focus tracks per topic, and difficulty distribution bars.
  - Topics & Companies administration views, color pickers, and CRUD submission forms.
  - Sidebar filter options, debounced live search, and the segregation toggle tabs (LeetCode Questions vs. Personal Vault).
  - Project directory restructuring into `frontend/` and `backend/` directories, and script configurations in `package.json`.
