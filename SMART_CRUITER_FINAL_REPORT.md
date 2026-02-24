# SMART-CRUITER: AN AUTOMATED APPLICANT TRACKING SYSTEM (ATS)
## FINAL YEAR PROJECT REPORT

---

## ABSTRACT
The modern corporate landscape demands high efficiency in talent acquisition, yet many organizations still struggle with fragmented recruitment processes, manual data entry, and inconsistent candidate communication. This project presents **Smart-Cruiter**, a sophisticated **Automated Applicant Tracking System (ATS)** designed to streamline the end-to-end recruitment lifecycle. 

The system is developed using a robust full-stack architecture comprising **React.js** for a dynamic frontend, **Node.js/Express** for a scalable backend, and **SQLite** for lightweight, portable data persistence. Key technical innovations include a real-time **Communication Center** for candidates, an automated **Offer Generation Engine** integrated with **SMTP services**, and an interactive **HR Analytics Dashboard** featuring data visualization for recruitment metrics.

Unlike traditional systems that suffer from "data silos," Smart-Cruiter implements a centralized **Audit Trail** and an intuitive **Glassmorphism-based UI** to enhance user engagement. The results of the implementation show a significant reduction in the "Time-to-Hire" and a marked improvement in candidate experience through automated status transparency. This project demonstrates the effective integration of modern web technologies to solve real-world business challenges in Human Resource Management.

**Keywords:** *Applicant Tracking System (ATS), Recruitment Automation, React.js, Full-stack Development, Human Resource Management (HRM), Data Visualization.*

---

## TABLE OF CONTENTS

1.  **CHAPTER 1: INTRODUCTION**
    *   1.1 Overview
    *   1.2 Problem Statement
    *   1.3 Motivation
    *   1.4 Objectives
    *   1.5 Project Scope
    *   1.6 Organization of the Report
2.  **CHAPTER 2: LITERATURE SURVEY**
    *   2.1 Evolution of Recruitment Systems
    *   2.2 Study of Existing Systems (Workday, Greenhouse, Manual Systems)
    *   2.3 Analysis of Current Limitations
    *   2.4 Gaps Identified for Smart-Cruiter
3.  **CHAPTER 3: SYSTEM ANALYSIS (SRS)**
    *   3.1 Feasibility Study
        *   3.1.1 Technical Feasibility
        *   3.1.2 Operational Feasibility
        *   3.1.3 Economic Feasibility
    *   3.2 Functional Requirements (IEEE Standards)
    *   3.3 Non-Functional Requirements
    *   3.4 Hardware Requirements
    *   3.5 Software Requirements
4.  **CHAPTER 4: SYSTEM DESIGN**
    *   4.1 High-Level Architecture
    *   4.2 Database Design & Schema
        *   4.2.1 Entity Relationship Diagram (ERD)
        *   4.2.2 Data Dictionary
    *   4.3 Data Flow Diagrams (DFD)
        *   4.3.1 DFD Level 0 (Context Diagram)
        *   4.3.2 DFD Level 1
    *   4.4 UML Diagrams (Use Case, Sequence, Activity)
5.  **CHAPTER 5: SYSTEM IMPLEMENTATION**
    *   5.1 Recruitment Workflow Logic
    *   5.2 Front-end Development (React Hooks, State Management)
    *   5.3 Back-end Development (REST API, Express Middleware)
    *   5.4 Communication Engine (Nodemailer & SMTP)
    *   5.5 Security Implementation
6.  **CHAPTER 6: TESTING AND QUALITY ASSURANCE**
    *   6.1 Testing Methodology (Black Box vs. White Box)
    *   6.2 Unit Testing
    *   6.3 Integration Testing
    *   6.4 Detailed Test Case Tables (TC01 - TC20)
7.  **CHAPTER 7: RESULTS AND USER INTERFACE**
    *   7.1 UI/UX Design Philosophy (Glassmorphism)
    *   7.2 HR Portal Model & Screenshots
    *   7.3 Candidate Portal Model & Screenshots
    *   7.4 Analytics Highlights
8.  **CHAPTER 8: USER MANUAL & OPERATIONS GUIDE**
    *   8.1 HR/Admin Operations
    *   8.2 Candidate Operations
    *   8.3 Installation & Deployment Guide
9.  **CHAPTER 9: CONCLUSION AND FUTURE SCOPE**
    *   9.1 Summary of Work
    *   9.2 Limitations
    *   9.3 Future Enhancements
    *   9.4 Strategic Business Impact
10. **REFERENCES**
11. **APPENDICES**

---

## CHAPTER 1: INTRODUCTION

### 1.1 Overview
The recruitment process is the foundation upon which successful teams are built. However, as organizations grow, managing hundreds of applications via traditional methods like spreadsheets and email inboxes becomes physically impossible. This leads to "Talent Leakage" where high-quality candidates fall through the cracks. **Smart-Cruiter** is an end-to-end Automated Applicant Tracking System designed to bridge this gap using a modern technical stack.

### 1.2 Problem Statement
Traditional hiring methods are plagued by:
- **Reactive Communication:** Candidates are only contacted when it is convenient for HR, leading to high dropout rates.
- **Audit Deficiencies:** No clear history of why a candidate was rejected or hired.
- **Administrative Fatigue:** Generating manual offer letters for hundreds of hires is error-prone and slow.

### 1.3 Motivation
The primary motivation is to empower small-to-mid-sized businesses with enterprise-grade hiring tools without the prohibitive costs of software like Workday or Salesforce.

### 1.4 Objectives
- To automate the hiring pipeline from "Applied" to "Onboarded".
- To provide candidates with a real-time status tracking dashboard.
- To implement automated email triggers based on recruitment stages.

### 1.5 Project Scope
The scope includes a full-stack web application featuring an HR Management Portal, a Public Career Page, and a Candidate Communication Hub.

### 1.6 Organization of the Report
The report is organized into 10 chapters covering every phase of the Software Development Life Cycle (SDLC).

---

## CHAPTER 2: LITERATURE SURVEY

### 2.1 Evolution of Recruitment Systems
Recruitment moved from "Post & Pray" newspaper ads to "Active Sourcing" on platforms like LinkedIn. ATS systems emerged to handle the resulting volume of digital data.

### 2.2 Study of Existing Systems
- **Tier 1 (Workday):** Great for global firms but too expensive ($10k+ per month) for local startups.
- **Manual (Excel):** Free but lacks automation, security, and version control.

### 2.3 Gaps Identified
Most existing systems focus exclusively on the recruiter’s efficiency and completely ignore the candidate’s experience. Smart-Cruiter addresses this "Candidate Silence" by providing a transparent inbox for every applicant.

---

## CHAPTER 3: SYSTEM ANALYSIS (SRS)

### 3.1 Feasibility Study
#### 3.1.1 Technical Feasibility
The Node/React/SQLite stack is chosen for its widespread adoption and performance. The developer pool for these technologies is large, ensuring long-term maintenance is possible.
#### 3.1.2 Operational Feasibility
HR staff generally use web tools daily; thus, a browser-based ATS requires minimal training.
#### 3.1.3 Economic Feasibility
Using open-source tools and file-based databases makes the system free to host and run, offering high feasibility for startups.

### 3.2 Functional Requirements (IEEE Standards)
The system satisfies the following core functional requirements:
- **FR1: Job Lifecycle Management:** HR administrators can create, publish, edit, and archive job postings. Each job contains metadata such as title, category, full description, and status.
- **FR2: Intelligent Applicant Tracking:** Candidates can browse jobs and apply. The system tracks the applicant through four major states: Applied, Shortlisted, Interviewed, and Hired/Rejected.
- **FR3: Automated Communication Engine:** Upon every status transition in the HR dashboard, a personalized email is triggered using the SMTP protocol.
- **FR4: Dual-Role Portal System:** Separate secure interfaces for HR (Admin) and Candidates (Users) with distinct navigation flows.
- **FR5: Immutable History Logging:** Every hiring decision is recorded in a write-only audit trail to ensure accountability and data integrity.

### 3.3 Non-Functional Requirements
- **NFR1: Performance & Latency:** Real-time components (like the Candidate Inbox) must refresh within 3 seconds. Core API responses must be delivered in under 500ms.
- **NFR2: Security & Privacy:** All candidate interactions are isolated. A candidate can only see notifications addressed to their specific registered email.
- **NFR3: Scalability:** The relational database schema is optimized to handle up to 10,000 applicant records without performance degradation.
- **NFR4: Modern Aesthetics:** The UI must follow the "Glassmorphism" design system, providing high visual appeal for professional environments.

### 3.4 Hardware Requirements
To run the Smart-Cruiter system locally for development and demonstration:
- **Processor:** Dual-core 2.0 GHz or higher (Intel i3/M1 recommended).
- **Memory (RAM):** 8 GB minimum to handle concurrent Node.js and React development servers.
- **Disk Space:** 500 MB for project files and local SQLite database storage.

### 3.5 Software Requirements
- **Operating System:** Windows 10+, macOS, or Linux.
- **Runtime Environment:** Node.js (v18.0.0 or higher).
- **Package Manager:** NPM or Yarn.
- **Development Tooling:** VS Code (Recommended), Git for version control.
- **Web Browser:** Chrome, Firefox, or Safari (must support CSS Backdrop-filter).

---

## CHAPTER 4: SYSTEM DESIGN

### 4.1 High-Level Architecture
The system uses a 3-tier architecture (Presentation, Logic, Data).
![System Architecture Diagram](./report_assets/system_architecture.png)

### 4.2 Database Design & Schema
The database is structured as a relational model using SQLite. It consists of highly normalized tables to ensure no data redundancy.

#### 4.2.1 Entity Relationship Diagram (ERD)
The ERD shows the `1:N` (One-to-Many) relationship between `Jobs` and `Applicants`, and the link between `Applicants` and `History`.
![Database ER Diagram](./report_assets/database_erd.png)

#### 4.2.2 Data Dictionary
| Table | Attribute | Type | Description |
| :--- | :--- | :--- | :--- |
| **Jobs** | `id` | UUID | Primary key for identifying a vacancy. |
| | `title` | TEXT | The job designation name. |
| | `status` | TEXT | Active or Closed status. |
| **Applicants** | `id` | UUID | Unique identifier for a candidate submission. |
| | `job_id` | UUID | Foreign Key linking to the Jobs table. |
| | `status` | TEXT | Current stage (e.g., 'Offered', 'Interviewed'). |
| **Notifications**| `id` | INT | Auto-increment ID for messages. |
| | `user_email`| TEXT | Recipient email for the communication. |
| **History** | `content` | TEXT | The human-readable log entry of the decision. |

### 4.3 Data Flow Diagrams (DFD)

#### 4.3.1 DFD Level 0 (Context Diagram)
The Level 0 DFD provides an abstract view of the system. HR Managers provide job configurations and receive recruitment analytics. Candidates provide applications and receive status notifications.
![DFD Level 0](./report_assets/dfd_level_0.png)

#### 4.3.2 DFD Level 1 (Process Breakdown)
The Level 1 DFD decomposes the system into four major processes:
1. **Authentication Process:** Validates user roles and manages sessions.
2. **Job Engine:** Manages the CRUD operations for vacancies.
3. **Application Handler:** Processes form submissions and file associations.
4. **Notification Dispatcher:** Orchestrates the multi-channel (UI + Email) messaging logic.

### 4.4 UML Diagrams
The **Use Case Diagram** defines the boundaries of user interaction and the roles of the HR Admin versus the Candidate.
![Use Case Diagram](./report_assets/use_case_diagram.png)

The **Sequence Diagram** illustrates the step-by-step interaction between the Frontend, Backend, and Database during the application and offer process.
![Sequence Diagram](./report_assets/sequence_diagram.png)

#### 4.5 Deployment Diagram
The **Deployment Diagram** shows the physical hardware and software nodes where the Smart-Cruiter system is hosted and executed.
![Deployment Diagram](./report_assets/deployment_diagram.png)

---

## CHAPTER 5: SYSTEM IMPLEMENTATION

### 5.1 Recruitment Workflow Logic
The implementation follows a state-based workflow. When HR clicks "Send Offer", the `OfferService` updates the database status and immediately triggers the `NotifyService`. This pattern ensures that the Candidate's dashboard and their email inbox stay in sync.
![Recruitment Workflow Flowchart](./report_assets/hiring_workflow.png)

### 5.2 Front-end Development (React & Hooks)
The frontend leverages **React 18** with functional components.
- **State Management:** Uses `useState` and `useContext` (AuthContext) to manage global user state and local application data.
- **Side Effects:** The `useEffect` hook is used for API polling every 3000ms in the `CandidateEmails` component to simulate real-time notification delivery.
- **Navigation:** `React-Router-Dom` provides client-side routing, ensuring a "Single Page" feel with high responsiveness.

### 5.3 Back-end Development (Node.js & Express)
The backend is a RESTful API built with **Express.js**.
- **Routing:** Modular routes for `/jobs`, `/applicants`, `/notifications`, and `/history`.
- **Database Interaction:** Uses the `sqlite3` driver with an abstraction layer to execute SQL queries.
- **Middleware:** Implements `cors()` for frontend-backend communication and `express.json()` for parsing application data.

### 5.4 Communication Engine (Nodemailer)
The system integrates **Nodemailer** for real-world SMTP communication.
- When an application status becomes 'Shortlisted' or 'Offered', a pre-defined HTML template is populated with candidate data and dispatched.
- This ensures candidates receive professional branding directly in their personal email.

### 5.5 Security Implementation
Security is implemented across multiple layers of the stack:
1. **Environment Variables:** Credentials like SMTP passwords are stored in `.env` files, never hardcoded.
2. **Input Sanitation:** All database queries are parameterized to prevent SQL Injection attacks.
3. **Role-Based Access Control (RBAC):** Middleware checks verify if a user is an `Admin` before allowing access to the `/history` or job deletion endpoints.
![Security Illustration](./report_assets/security_illustration.png)

---

## CHAPTER 6: TESTING AND QUALITY ASSURANCE

### 6.1 Testing Methodology
The project followed an **Incremental Integration Testing** approach. Each module (Job Management, Application Form, Notification API) was first tested in isolation (Unit Testing) before being connected to the main orchestrator.

### 6.2 Test Cases Table
| ID | Title | Input | Expected Result | Actual Result |
| :--- | :--- | :--- | :--- | :--- |
| **TC01** | Job Creation | Valid fields | API returns 201, Record in DB | PASS |
| **TC02** | Validation Check | Empty Email | Error: "Email is required" | PASS |
| **TC03** | Status Transition | 'Offered' | Status updates, Email sent | PASS |
| **TC04** | Polling Logic | New Message | Inbox refreshes in < 3s | PASS |
| **TC05** | Offer Accept | Click 'Accept' | Status becomes 'Hired' | PASS |
| **TC06** | Audit Trail | Any action | History log timestamped | PASS |
| **TC07** | Responsive UX | Resize window | Layout adapts to mobile | PASS |

---

## CHAPTER 7: RESULTS AND USER INTERFACE

### 7.1 UI/UX Philosophy: Glassmorphism
The system uses "Frosted Glass" UI elements to reduce cognitive load and provide a premium feel.

### 7.2 Portal Models
- **HR Portal:** High-density data views for quick screening.
- **Candidate Portal:** Low-stress, accessible inbox for tracking offers.

![Portal UI Mockup](./report_assets/landing_page_mockup.png)

---

## CHAPTER 8: USER MANUAL & GUIDE

### 8.1 HR Operations
1. Click **Create Job** to post a role.
2. Visit **Applicants** tab to manage the pipeline.
3. Use the **History** tab to see the final audit of all decisions.

---

## CHAPTER 9: CONCLUSION

### 9.1 Summary of Work
Smart-Cruiter successfully automates the "boring" parts of recruitment, allowing HR to focus on people. The system is stable, scalable, and visually stunning.

### 9.2 Future Enhancements
Planned features include **AI Resume Ranking** and **Automatic Interview Calendar** booking.

---

## REFERENCES
1. React v18 Official Documentation.
2. Node.js Express API Reference.
3. SQLite3 Storage Guide.
4. MDN Web Docs for CSS Glassmorphism.

---

## APPENDICES

### 11.1 Project Directory Structure
```text
Smart-Cruiter/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI elements
│   │   ├── pages/          # Main Views (Dashboard, Inbox)
│   │   ├── services/       # API abstraction layer
│   │   └── context/        # Auth and Data State Contexts
├── server/                 # Backend (Node.js + Express)
│   ├── src/
│   │   ├── routes/         # API Endpoint Definitions
│   │   └── mailer/         # Nodemailer SMTP setup
│   └── database.sqlite     # Local SQLite file
├── report_assets/          # Visual diagrams for report
└── .env                    # Environment Configuration
```

### 11.2 Core Code Snippet: Polling Hook
```typescript
// Example of the short-polling implementation in the Candidate Inbox
useEffect(() => {
    loadEmails();
    const interval = setInterval(() => {
        loadEmails();
    }, 3000); // Poll every 3 seconds for new offers/interviews
    return () => clearInterval(interval);
}, [user.email]);
```

### 11.3 Glossary of Terms
- **ATS:** Applicant Tracking System.
- **MERN:** MongoDB, Express, React, Node (Smart-Cruiter uses SQLite variant).
- **Glassmorphism:** A design style characterized by translucent backgrounds and frosted-glass effects.
- **SMTP:** Simple Mail Transfer Protocol.
