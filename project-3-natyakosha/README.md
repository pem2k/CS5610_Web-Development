# Natyakosha — The Dance Treasury

A premium, interactive classical Indian dance (Bharatanatyam) curriculum portal designed for graduate and undergraduate dance students to access dance theories, mudras, and rhythmic adavu tutorials, and for instructors to manage batch rosters, track daily attendance, and oversee fee registers.

---

## Course & Author Details

- **Class Link**: [CS 5610 Web Development](https://canvas.northeastern.edu/)
- **Authors**: Neeraja Joshi & Keshvi Choksi
- **Project Objective**: To digitize the classical dance learning experience by providing students with structured lesson archives, interactive video tutorial displays, and a personal dashboard showing progress metrics, while equipping instructors with roster configurations, automated attendance tracking, and financial ledgers.
- **AI Disclosure**: Generative AI tools were utilized to compile and generate the history, text-based theories, and conceptual curriculum content material of Bharatanatyam seeded in the database.

---

## Screenshots

### 1. User Authentication View

Our secure login page supporting session-based local authentication and password visibility toggling for credential privacy.

![Natyakosha Authentication Page](./frontend/public/img/1_login_page.png)

### 2. Student Learning Area - Theory & Texts

The learning portal displaying classical dance theory archives, historical background treatises, and accordion text cards.

![Student Learning Area - Theory & Texts](./frontend/public/img/2_learning_theory.png)

### 3. Student Attendance Standing & History

The student dashboard features a custom, color-coded attendance presence rate visualization ring showing total classes attended versus missed, alongside a detailed history register ledger of past dates.

![Student Attendance Dashboard](./frontend/public/img/3_attendance_standing.png)

### 4. Student Fee Ledger & Payment

A self-service tuition fee ledger listing monthly payment cycles. Students can view cycle due dates, check outstanding amounts, and make instant tuition payments directly from their portal.

![Student Fee Ledger](./frontend/public/img/4_student_fees.png)

### 5. Student Account Details

The student profile details view displaying registration metadata, username, account creation timestamp, and a change password utility form.

![Student Account Details](./frontend/public/img/5_account_details.png)

### 6. Curriculum Creator & Editor

The instructor interface allows teachers to perform CRUD operations on dance lessons, upload YouTube tutorials, insert reference images, and add descriptions categorized by theory, mudras, or adavus.

![Curriculum Creator](./frontend/public/img/6_curriculum_creator.png)

### 7. Roster & Batch Manager

The batch manager enables instructors to create new class batches, register new student profiles (auto-generating sanitized usernames like `keshvi_patel` with a default password of `student123`), and assign or remove students from evening time slots.

![Roster & Batch Manager](./frontend/public/img/7_roster_batch_manager.png)

### 8. Batch Attendance Register

The digital attendance register allows instructors to choose a batch and date to log student records. Row selections update attendance logs in MongoDB in real time, with unmarked student rows defaulting to present status.

![Attendance Register](./frontend/public/img/8_attendance_register.png)

### 9. Fee Management Dashboard

The financial control dashboard aggregates Total Collected, Total Outstanding, and Unpaid Invoices, enabling teachers to filter financial tables by batch timing, search invoice lists, and record manual payments.

![Fee Management Dashboard](./frontend/public/img/9_fee_dashboard.png)

### 10. Student Learning Area - Mudra Gallery

The learning portal displaying video tutorial cards and detailed explanations for Asamyukta Hastas (single-hand gestures).

![Student Learning Area - Mudra Gallery](./frontend/public/img/10_learning_mudra.png)

### 11. Student Learning Area - Adavu Steps

The learning portal displaying tutorial cards with embedded YouTube videos for rhythmic steps (Adavus).

![Student Learning Area - Adavu Steps](./frontend/public/img/11_learning_adavu.png)

---

## Key Features

### 1. Interactive Student Learning Center & Curriculum Viewer

- **Categorized Dance Archives**: Switch tabs dynamically to filter through **Theory & Texts**, **Mudra Gallery** (single-hand gestures), and **Adavu Steps** (rhythmic footwork).
- **YouTube Media Integration**: The system automatically extracts video IDs from raw YouTube URLs using regular expression matching and mounts secure iframe players dynamically.
- **Accordion Read-More Treatises**: Expand and collapse long description text for historical treatises without cluttering the card layout grid.

### 2. Student Dashboard & Performance Progress Ring

- **Circular Progress Ring**: A clean visual gauge that computes and renders the student's overall presence rate percentage based on log history.
- **Roster Standing Analytics**: Quick stats indicating Total Classes, Attended, and Absent count.
- **Attendance Ledger**: View a scrollable ledger containing all recorded attendance entries.
- **Tuition Fee Gateway**: Self-service ledger showing month, billing date, amount, and payment status, allowing students to pay outstanding dues in a single click.

### 3. Teacher Roster, Batch & Account Manager

- **Roster & Account Creation**: Create student profiles with auto-suggested usernames derived by slugifying name inputs (e.g. `Keshvi Patel` becomes `keshvi_patel`), defaulting their credentials to `student123`.
- **Roster Assignments**: Assign existing student profiles to one of the four evening time-slot batches or remove them with safety confirmations.
- **Batch Configurations**: View batch rosters, count enrolled students, and run search/filter options.

### 4. Teacher Attendance Register & Fee Reconciliation

- **Roster Sheet Logging**: Select a batch and date to view students. Submit attendance as present or absent using radio controls. Unsaved rows default to present to speed up registry.
- **Financial Analytics**: Displays Total Collected, Total Outstanding, and Unpaid Invoices.
- **Time Slot Filtering**: Filter the entire financial dashboard and ledger list dynamically by evening batch timings.
- **Manual Payment Approvals**: Oversee outstanding invoices and manually mark cash or check payments as PAID, syncing immediately with the student's dashboard ledger.

### 5. Account Security & Verification

- **Passport Authentication**: Secure session-based local authentication using Passport.js and express-session.
- **Session Protections**: Configured cookie durations and secure session states.
- **Password Updates**: Secure profile page to change passwords, validating the current password against stored hashes and confirming matching fields.

---

## Directory Structure

The project is structured with a separate `frontend` (React client application built with Vite) and a `backend` (Express API server backed by native MongoDB client):

```
project-3-natyakosha/
├── backend/                  # Server-side logic & API
│   ├── config/               # Infrastructure & auth configuration
│   │   ├── db.js             # Native MongoDB Connection client
│   │   └── passport.js       # Passport LocalStrategy & session serializers
│   ├── helpers/              # Helper utilities
│   │   └── user.js           # Username sanitization and parsing utilities
│   ├── middleware/           # Express middleware (Auth validation checks)
│   │   └── auth.js           # isAuthenticated and isTeacher role guards
│   ├── routes/               # API Router endpoints
│   │   ├── attendance.js     # Attendance logs & student summary fetches
│   │   ├── auth.js           # Login, logout, and password change endpoints
│   │   ├── batches.js        # Batch configurations and roster allocations
│   │   ├── curriculum.js     # Dance curriculum CRUD endpoints
│   │   └── fees.js           # Tuition fee tracking, payments, and dashboard APIs
│   ├── scripts/              # Database populating scripts
│   │   └── seed.js           # Drops collections and seeds 1,000+ synthetic records
│   ├── .env                  # Port, database URI, and session secret parameters
│   └── server.js             # Express application server entrypoint
├── frontend/                 # Client-side React code
│   ├── public/               # Static web assets
│   │   └── natraj.png        # Nataraja branding logo
│   ├── src/                  # React application source code
│   │   ├── assets/           # Local static assets
│   │   ├── components/       # Custom React views and styling
│   │   │   ├── LearningArea.css
│   │   │   ├── LearningArea.jsx
│   │   │   ├── Navbar.css
│   │   │   ├── Navbar.jsx
│   │   │   ├── StudentDashboard.css
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── TeacherAttendance.css
│   │   │   ├── TeacherAttendance.jsx
│   │   │   ├── TeacherBatches.css
│   │   │   ├── TeacherBatches.jsx
│   │   │   ├── TeacherCurriculum.css
│   │   │   ├── TeacherCurriculum.jsx
│   │   │   ├── TeacherFees.css
│   │   │   └── TeacherFees.jsx
│   │   ├── App.css           # Global layout stylesheet
│   │   ├── App.jsx           # Main React component & routing logic
│   │   ├── index.css         # Styling entry point
│   │   └── main.jsx          # React app DOM render mount
│   ├── eslint.config.js      # ESLint configuration rules
│   ├── vite.config.js        # Vite configurations (dev server & API proxy)
│   └── package.json          # Frontend local dependencies & scripts
├── package.json              # Project root scripts and concurrently configurations
└── README.md                 # Project README
```

---

## Build & Run Instructions

### Prerequisites

- Node.js installed (v18+ recommended)
- MongoDB Connection URI (local MongoDB instance or MongoDB Atlas cluster)

### Installation

1. Navigate to the project directory:
   ```bash
   cd project-3-natyakosha
   ```
2. Install root and package dependencies:
   ```bash
   # Install root concurrently package
   npm install

   # Install Backend dependencies
   cd backend
   npm install --include=dev

   # Install Frontend dependencies
   cd ../frontend
   npm install --include=dev
   ```

### Configuration

Create a `.env` file in the `backend` folder:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/natyakosha?retryWrites=true&w=majority
PORT=5000
SESSION_SECRET=your_secret_session_key
```

### Seeding the Database

To clear existing collections and pre-populate the MongoDB database with users (instructor `neeraja`, students like `keshvi` and `priya`), curriculum entries, time slots, and 1,000+ historical attendance and tuition payment records, run:

```bash
# Run from the project root folder
npm run seed
```

### Run the App

Start the backend Node/Express API service and the frontend Vite/React development server concurrently by executing:

```bash
# Run from the project root folder
npm start
```

Once running:
- **Frontend client** is hosted on: [http://localhost:5173/](http://localhost:5173/)
- **Backend API server** is hosted on: [http://localhost:5000/](http://localhost:5000/)

---

## Code Quality & Formatting

Linting rules are managed via `eslint` and `oxlint`. To run code linting checks on the frontend files:

```bash
# Navigate to the frontend directory
cd frontend

# Run linter
npm run lint
```
