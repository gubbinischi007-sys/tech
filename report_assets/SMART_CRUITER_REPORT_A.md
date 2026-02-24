# SMART-CRUITER: An Automated Applicant Tracking System (ATS)

### Bachelor of Technology – Final Year Project Report

**Submitted in partial fulfilment of the requirements for the degree of**
**Bachelor of Technology in Computer Science and Engineering**

---

| | |
|---|---|
| **Project Title** | Smart-Cruiter: An Automated Applicant Tracking System (ATS) |
| **Maintained By** | Nischitha L |
| **Department** | Computer Science and Engineering |
| **Academic Year** | 2025 – 2026 |
| **Report Type** | Final Year Project Report |

---

## ABSTRACT

Recruitment is a mission-critical function in every organisation, yet the processes that underpin it are frequently manual, inconsistent, and opaque for candidates. This project presents **Smart-Cruiter**, a full-stack **Automated Applicant Tracking System (ATS)** engineered to digitalise and automate the entire employee acquisition lifecycle — from vacancy publication to offer acceptance.

The system is built on a three-tier web architecture using **React.js (v18)** with **TypeScript** for a responsive client interface, **Node.js** with **Express.js** for a RESTful API backend, and **SQLite** as an embedded relational database. Key modules include: a **Job Management Engine** for CRUD operations on vacancies; an **Applicant Pipeline Manager** tracking candidates across *Applied → Shortlisted → Recommended → Offered → Hired/Declined*; an **Automated Communication Centre** dispatching personalised HTML emails via **Nodemailer SMTP**; and a **Candidate Self-Service Dashboard** for real-time status visibility and offer response.

Additional features include an immutable **Audit Trail** logging every HR decision, a **Resume Match Score** using keyword-based analysis, **Duplicate Detection** preventing repeated submissions, and **Exportable Reports** in CSV and PDF formats. The UI follows a **Glassmorphism** design system. Security is enforced through parameterised SQL queries, environment-variable credential management, and role-based access control.

Testing was conducted using an Incremental Integration approach. The system achieved a 100% pass rate on all 20 defined test cases, real-time notification delivery within 3 seconds, and sub-500ms API response times — validating that open-source technologies can deliver enterprise-grade HR functionality at near-zero infrastructure cost.

**Keywords:** *Applicant Tracking System, Recruitment Automation, React.js, Node.js, TypeScript, SQLite, Nodemailer, RESTful API, Glassmorphism, Role-Based Access Control, Full-Stack Web Development.*

---

## TABLE OF CONTENTS

| No. | Title |
|:---:|:------|
| | Abstract |
| | Table of Contents |
| | List of Figures |
| | List of Tables |
| **1** | **Introduction** |
| 1.1 | Overview |
| 1.2 | Background of the Study |
| 1.3 | Motivation |
| 1.4 | Objectives |
| 1.5 | Project Scope |
| 1.6 | Organisation of the Report |
| **2** | **Problem Statement** |
| 2.1 | Existing Challenges in Recruitment |
| 2.2 | Specific Problem Areas Addressed |
| 2.3 | Need for the Proposed System |
| **3** | **Literature Review** |
| 3.1 | Evolution of ATS Platforms |
| 3.2 | Workday Recruiting (Enterprise ATS) |
| 3.3 | Greenhouse Software (Mid-Tier ATS) |
| 3.4 | BambooHR (SME-Focused ATS) |
| 3.5 | Manual Recruitment (Spreadsheets) |
| 3.6 | Gaps and Justification for Smart-Cruiter |
| **4** | **Project Requirements Specification** |
| 4.1 | Feasibility Study |
| 4.2 | Functional Requirements |
| 4.3 | Non-Functional Requirements |
| 4.4 | Hardware Requirements |
| 4.5 | Software Requirements |
| 4.6 | Technology Stack Justification |
| **5** | **System Design** |
| 5.1 | High-Level Architecture |
| 5.2 | Three-Tier Breakdown |
| 5.3 | Database Design & Schema |
| 5.4 | Data Flow Diagrams |
| 5.5 | UML Diagrams |
| 5.6 | Deployment Diagram |
| 5.7 | Component Structure |
| **6** | **Data Management** |
| 6.1 | Overview |
| 6.2 | Tables and Relationships |
| 6.3 | Data Seeding and Initialisation |
| 6.4 | Indexing Strategy |

---

## LIST OF FIGURES

| Figure | Title |
|:------:|:------|
| 5.1 | Three-Tier System Architecture Diagram |
| 5.2 | Entity Relationship Diagram (ERD) |
| 5.3 | DFD Level 0 – Context Diagram |
| 5.4 | DFD Level 1 – Detailed Data Flow |
| 5.5 | Use Case Diagram |
| 5.6 | Sequence Diagram – Application & Offer Flow |
| 5.7 | Job Offer Sequence Diagram |
| 5.8 | Deployment Diagram |
| 7.1 | Recruitment Pipeline Workflow Flowchart |
| 9.1 | Landing / Login Page Screenshot |
| 9.2 | HR Dashboard Analytics Screenshot |
| 9.3 | Candidate Inbox Screenshot |

---

## LIST OF TABLES

| Table | Title |
|:-----:|:------|
| 4.1 | Functional Requirements (IEEE 830) |
| 4.2 | Non-Functional Requirements |
| 4.3 | Minimum Hardware Requirements |
| 4.4 | Software Requirements and Versions |
| 4.5 | Technology Stack Comparison |
| 5.1 | Data Dictionary – Jobs Table |
| 5.2 | Data Dictionary – Applicants Table |
| 5.3 | Data Dictionary – Notifications Table |
| 5.4 | Data Dictionary – Application History Table |
| 5.5 | Data Dictionary – Employees Table |
| 5.6 | Data Dictionary – Interviews Table |
| 6.1 | Database Record Volume Estimates |
| 6.2 | Indexing Strategy |
| 9.1 | Test Cases TC01–TC20 |

---

---

## CHAPTER 1: INTRODUCTION

### 1.1 Overview

The recruitment process is the backbone of organisational growth. Hiring the right talent at the right time directly impacts productivity, culture, and profitability. However, as businesses expand, the volume of applications grows exponentially — a single LinkedIn job posting can attract hundreds of applicants within days. Managing this influx using manual processes such as spreadsheets, email inboxes, or paper-based filings quickly becomes unsustainable.

An **Applicant Tracking System (ATS)** is a specialised software application designed to automate and streamline the recruitment workflow. It serves as a centralised repository for all candidate data, enables structured pipeline management from initial application to final hire, and provides communication tools to keep both HR teams and candidates informed throughout the process.

**Smart-Cruiter** is a full-stack web-based ATS developed as a final year engineering project. It digitises the end-to-end recruitment lifecycle, providing separate portal experiences for HR administrators and job candidates. The system is designed to be lightweight, cost-effective, and feature-rich — offering functionality comparable to enterprise-grade solutions like Workday and Greenhouse, built entirely on open-source technologies at near-zero infrastructure cost.

### 1.2 Background of the Study

The landscape of talent acquisition has undergone dramatic transformation over the past two decades.

**2000s — "Post and Pray":** Recruitment was reactive — job ads in newspapers or early job boards, applications via post or email. HR teams processed everything manually.

**Mid-2000s — Job Portals:** Platforms like Monster, Naukri, and Indeed massively increased application volumes, creating an *information overload* problem that spreadsheets and email could not solve.

**Late 2000s — First-Generation ATS (Taleo, iCIMS):** Centralised candidate databases and basic workflow management emerged. However, these systems were expensive, required significant IT infrastructure, and offered limited candidate-facing features.

**Present — Cloud ATS (Greenhouse, Lever, BambooHR):** These modern platforms offer mobile-responsive interfaces, collaborative hiring workflows, and integration ecosystems. However, their subscription pricing (₹25,000–₹8,00,000/month) places them beyond the reach of Indian SMEs and startups.

**Smart-Cruiter** is designed to fill this gap: a professional-grade ATS that can be self-hosted at minimal cost, serving the fastest-growing segment of the market.

### 1.3 Motivation

| # | Motivation | Detail |
|:-:|:-----------|:-------|
| 1 | **Cost Accessibility** | Workday charges $10,000+/month. Smart-Cruiter uses only open-source tech, making it free to develop and deploy. |
| 2 | **Candidate Experience Gap** | Most ATS systems cater exclusively to recruiters. Candidates experience the "Black Hole" effect — applications disappear with no response. Smart-Cruiter adds a dedicated Candidate Portal with a real-time notification inbox. |
| 3 | **Administrative Fatigue** | HR professionals spend ~23 hours screening resumes per hire (Glassdoor, 2023). Smart-Cruiter automates offer letters, status emails, and decision records. |
| 4 | **Audit & Compliance** | Many organisations have no record of why candidates were hired or rejected — a legal risk. Smart-Cruiter maintains an immutable audit trail for every decision. |
| 5 | **Academic Learning** | As a final year project, Smart-Cruiter demonstrates applied CS concepts: database design, RESTful APIs, state management, and security patterns in a real-world context. |

### 1.4 Objectives of the Project

1. Design and develop a full-stack web application automating the hiring pipeline from "Job Posted" to "Candidate Onboarded".
2. Implement a **dual-portal system** with separate interfaces for HR administrators and candidates, each with role-based access control.
3. Build a **Job Management Engine** supporting CRUD operations for vacancies with rich metadata.
4. Create an **Applicant Pipeline Manager** tracking candidates through: *Applied → Shortlisted → Recommended → Offered → Hired/Declined*.
5. Develop an **Automated Communication Engine** using Nodemailer to send personalised HTML emails on every pipeline stage transition.
6. Implement a **Candidate Self-Service Dashboard** for application status, notifications, and offer response.
7. Incorporate an **immutable Audit Trail** recording every HR decision with timestamps and rationale.
8. Provide an **Analytics Dashboard** with data visualisation charts (applicants by stage, per job, recent activity).
9. Integrate **Resume Match Scoring** comparing job description keywords against resume content.
10. Implement **Duplicate Detection** to flag repeated submissions.
11. Enable **Exportable Reports** in CSV and PDF formats for applicants, employees, decisions, and login activity.

### 1.5 Project Scope

**In Scope:**
- HR Admin Portal with analytics, job management, applicant pipeline, interview scheduling, employee management, and report export.
- Public Career Page for job browsing.
- Online Job Application form with validation.
- Candidate Portal with notification inbox and offer acceptance/rejection.
- Automated email dispatch (SMTP) with in-app notification fallback.
- Immutable history and audit logging.

**Out of Scope:** AI/NLP-based resume parsing, video interview integration, third-party HR system integrations, and native mobile applications.

### 1.6 Organisation of the Report

This report mirrors the Software Development Life Cycle (SDLC):

- **Chapter 1:** Overview, background, motivation, objectives.
- **Chapter 2:** Problem statement and need for the proposed system.
- **Chapter 3:** Literature review of existing ATS platforms.
- **Chapter 4:** Feasibility study, functional and non-functional requirements.
- **Chapter 5:** System design — architecture, database schema, DFDs, UML diagrams.
- **Chapter 6:** Data management, tables, relationships, and indexing.
- **Chapter 7:** Development methodology and module design. *(See Part B)*
- **Chapter 8:** Implementation with actual source code. *(See Part B)*
- **Chapter 9:** Test results, performance metrics, and screenshots. *(See Part B)*
- **Chapter 10:** Conclusion, limitations, and future work. *(See Part B)*

---

---

## CHAPTER 2: PROBLEM STATEMENT

### 2.1 Existing Challenges in Recruitment

**Challenge 1 — Volume Overload:**
A single job posting on LinkedIn can generate 100–700 applications in the first week. For organisations with multiple open vacancies, HR teams face thousands of applications without automated tools — making consistent, quality screening impossible.

**Challenge 2 — Communication Breakdown:**
CareerBuilder (2023) reports that 52% of candidates cite "lack of response from employers" as their greatest frustration. This "Application Black Hole" phenomenon damages employer branding, produces negative Glassdoor reviews, and causes loss of top talent to more responsive competitors.

**Challenge 3 — Data Fragmentation:**
Without a centralised system, recruitment data scatters across LinkedIn (job posts), email (applications), Word documents (interview notes), and Excel (candidate tracking). Maintaining a coherent pipeline view becomes impossible.

**Challenge 4 — Audit Deficiency:**
Most organisations have no systematic record of hiring decisions — no log of who decided what and why. This creates operational inefficiencies and legal risks in equal opportunity environments.

**Challenge 5 — Duplicate & Fraudulent Applications:**
Candidates sometimes submit multiple applications or use details belonging to others. Without automated detection, these duplicates waste HR time and risk incorrect hiring decisions.

### 2.2 Specific Problem Areas Addressed

| Problem Area | Current State | Smart-Cruiter Solution |
|:------------|:-------------|:----------------------|
| **Reactive Communication** | Candidates contacted only when convenient | Automated email on every stage transition; real-time notification inbox |
| **No Structured Pipeline** | Spreadsheets with ad-hoc status columns | Six-stage pipeline: Applied → Shortlisted → Recommended → Offered → Hired / Declined |
| **Manual Offer Process** | Word documents emailed manually | One-click offer dispatch with salary, joining date, and terms; candidate can Accept/Decline in-app |
| **Zero Accountability** | No decision history | Immutable `application_history` table with timestamps and rationale |
| **Data Silos** | Email + spreadsheets + chat | Centralised SQLite database with structured API access |

### 2.3 Need for the Proposed System

Given the challenges above, a solution must:

1. **Centralise** all recruitment data in a single structured database.
2. **Automate** repetitive tasks: status emails, offer dispatch, report generation.
3. **Provide transparency** to candidates through a self-service portal.
4. **Ensure accountability** with an immutable audit trail.
5. **Be affordable** — deployable by any organisation, including zero-budget startups.

Smart-Cruiter meets all five requirements. By using open-source technologies and an embedded SQLite database, it eliminates the financial barrier. Its dual-portal architecture solves the transparency problem. Its comprehensive history log ensures every hiring decision is documented and reviewable.

---

---

## CHAPTER 3: LITERATURE REVIEW

### 3.1 Evolution of Applicant Tracking Systems

| Generation | Era | Characteristics |
|:----------:|:----|:----------------|
| **1st Gen** | 1990s–2000s | Digital filing cabinets; keyword search only; no workflows; on-premises (Restrac, Webhire) |
| **2nd Gen** | 2005–2012 | Cloud-hosted SaaS; structured workflows; basic reporting; enterprise pricing (Taleo, iCIMS, Jobvite) |
| **3rd Gen** | 2013–2020 | Collaborative hiring; structured interviews; scorecards; mobile-optimised candidate experience (Greenhouse, Lever, SmartRecruiters) |
| **4th Gen** | 2021–Present | AI-driven: NLP resume screening, chatbot engagement, predictive analytics, bias detection (HireVue, Eightfold.ai) |

Smart-Cruiter positions itself between the 3rd and 4th generations — offering structured workflows and candidate experience of modern platforms, with selective intelligent features (keyword-based resume matching, duplicate detection) that do not require expensive AI infrastructure.

### 3.2 Analysis of Workday Recruiting (Enterprise ATS)

**Overview:** Workday Recruiting is a module within the Workday HCM suite, designed for global enterprises.

**Strengths:** End-to-end HR lifecycle management; enterprise-grade security; AI-powered candidate recommendations; global regulatory compliance.

**Limitations:**
- Licensing starts at ~$100/employee/year; implementation costs $500K–$2M.
- Implementation timelines: 6–18 months with dedicated project teams.
- Cannot be purchased independently — requires full HCM suite.
- Over-engineered for small teams.

**Relevance:** Workday defines the enterprise feature set that Smart-Cruiter replicates at a fraction of the cost, targeting SMEs.

### 3.3 Analysis of Greenhouse Software (Mid-Tier ATS)

**Overview:** Widely adopted among tech companies for structured hiring and data-driven recruitment.

**Strengths:** Structured interview kits; customisable pipelines; 400+ integrations; DEI analytics; robust API.

**Limitations:**
- Pricing starts at ~$6,000/year for small teams, scaling to $50,000+ for enterprise.
- No self-hosting option — raises data sovereignty concerns.
- Candidate portal experience is relatively basic compared to its recruiter tools.

**Relevance:** Greenhouse's structured pipeline approach directly inspires Smart-Cruiter's six-stage model. Smart-Cruiter addresses the candidate portal gap with a comprehensive dashboard featuring notifications and offer response.

### 3.4 Analysis of BambooHR (SME-Focused ATS)

**Overview:** All-in-one HR solution for small to medium businesses (5–1,000 employees).

**Strengths:** Simple, intuitive interface; quick setup; affordable (~$6/employee/month); good SME feature balance.

**Limitations:**
- No event-driven automated communication on stage changes.
- No real-time candidate notification inbox.
- Basic analytics with no data visualisation charts.
- No audit trail for hiring decisions.

**Relevance:** BambooHR confirms strong SME market demand, but falls short on automation and candidate experience — exactly the gaps Smart-Cruiter fills.

### 3.5 Manual Recruitment Using Spreadsheets

Despite available tools, many Indian organisations still rely on:
- WhatsApp/email job sharing → email application receipt → Excel tracking → Word offer letters.

**Key limitations:** No version control, zero automation, no security, no candidate visibility, and a practical scalability ceiling of ~50 concurrent applications.

**Relevance:** This is the baseline Smart-Cruiter replaces.

### 3.6 Gaps Identified and Justification

| Feature | Workday | Greenhouse | BambooHR | Manual | Smart-Cruiter |
|:--------|:-------:|:----------:|:--------:|:------:|:-------------:|
| Cost-effective for SMEs | ✗ | ✗ | △ | ✓ | ✓ |
| Automated Pipeline Communication | ✓ | ✓ | ✗ | ✗ | ✓ |
| Candidate Self-Service Portal | ✓ | △ | ✗ | ✗ | ✓ |
| Real-Time Notification Inbox | △ | ✗ | ✗ | ✗ | ✓ |
| Immutable Audit Trail | ✓ | △ | ✗ | ✗ | ✓ |
| Self-Hosted / No Vendor Lock-in | ✗ | ✗ | ✗ | ✓ | ✓ |
| Open Source & Zero Licensing Cost | ✗ | ✗ | ✗ | — | ✓ |
| Resume Match Scoring | ✓ | ✓ | ✗ | ✗ | ✓ |
| Duplicate Detection | ✓ | △ | ✗ | ✗ | ✓ |
| Export Reports (CSV/PDF) | ✓ | ✓ | △ | ✗ | ✓ |

*✓ = Fully Supported, △ = Partially Supported, ✗ = Not Supported*

**Key Justification:** No existing system simultaneously offers enterprise-grade features, SME-appropriate pricing (free/open-source), and a genuine dual-portal experience for both recruiters and candidates. Smart-Cruiter uniquely occupies this intersection.

---

---

## CHAPTER 4: PROJECT REQUIREMENTS SPECIFICATION

### 4.1 Feasibility Study

#### 4.1.1 Technical Feasibility

All technologies selected are well-established, widely adopted, and open-source:

| Technology | Version | Community & Track Record |
|:-----------|:--------|:------------------------|
| React.js | v18 | 220K+ GitHub stars; used by Meta, Netflix, Airbnb |
| TypeScript | v5.3 | Industry-standard type-safe JavaScript |
| Node.js + Express | v18 + v4.18 | Powers Netflix, Uber, LinkedIn APIs |
| SQLite | v5.1 | Zero-config; handles databases up to 281 TB |
| Nodemailer | v6.9 | Standard Node.js SMTP library |
| Vite | v5 | Next-gen build tool; 10× faster than Webpack |

**Conclusion: Technically Feasible.** The development team has prior SERN-stack experience.

#### 4.1.2 Operational Feasibility

- **HR Users:** Already use browser-based tools daily. The glassmorphism UI requires minimal training.
- **Candidates:** The candidate portal resembles a familiar email inbox. No software installation required.
- **IT Requirements:** A single server or even a laptop suffices for deployment.

**Conclusion: Operationally Feasible.**

#### 4.1.3 Economic Feasibility

| Cost Item | Amount |
|:----------|:-------|
| Development Tools (VS Code, Git) | ₹ 0 (Open Source) |
| All Frameworks & Libraries | ₹ 0 (Open Source) |
| Database (SQLite) | ₹ 0 (Embedded) |
| Hosting (Vercel Free Tier) | ₹ 0 |
| SMTP Email (Gmail) | ₹ 0 |
| Domain Name (Optional) | ~₹ 800/year |
| **Total** | **₹ 0 – ₹ 800** |

Compared to Workday (~₹8,00,000/month) or Greenhouse (~₹50,000/month), Smart-Cruiter offers **99.9% cost savings**.

**Conclusion: Economically Feasible.**

#### 4.1.4 Schedule Feasibility

| Phase | Duration | Activities |
|:------|:---------|:-----------|
| Requirements & Design | Weeks 1–3 | Stakeholder analysis, SRS, system design |
| Backend Development | Weeks 4–7 | Database, API routes, email service |
| Frontend Development | Weeks 8–12 | UI components, pages, state management |
| Integration & Testing | Weeks 13–15 | API integration, test cases, bug fixes |
| Documentation & Deployment | Week 16 | Report, Vercel deployment |

**Conclusion: Feasible within the 16-week academic timeline.**

### 4.2 Functional Requirements (IEEE 830 Standard)

**Table 4.1: Functional Requirements**

| FR ID | Title | Description | Priority |
|:------|:------|:------------|:---------|
| FR-01 | Job Lifecycle Management | HR shall create, view, edit, and delete job postings with title, department, location, type, description, requirements, and status fields. | High |
| FR-02 | Public Job Listing | A publicly accessible career page shall display all "open" jobs without requiring authentication. | High |
| FR-03 | Online Job Application | Candidates shall apply via a form with name, email, phone, resume URL, and cover letter. System validates all required fields and email format. | High |
| FR-04 | Applicant Pipeline Management | HR shall view all applicants, update their stage individually or in bulk. Stages: Applied, Shortlisted, Recommended, Hired, Declined, Withdrawn. | High |
| FR-05 | Automated Email Notifications | On every pipeline stage transition, the system shall automatically send a personalised HTML email to the candidate. | High |
| FR-06 | Offer Generation and Dispatch | HR shall send job offers containing salary, joining date, notes, and terms. The offer is emailed and stored in the candidate's portal. | High |
| FR-07 | Candidate Offer Response | Candidates shall Accept or Decline offers through their portal, updating the pipeline stage to Hired or Declined accordingly. | High |
| FR-08 | Dual-Portal Authentication | Two roles (HR and Candidate) with separate portals and role-based access control. | High |
| FR-09 | Candidate Notification Inbox | Candidates shall have a notification inbox displaying all system communications: status updates, offers, and warnings. | Medium |
| FR-10 | Interview Management | HR shall schedule interviews with date/time, type (online/in-person/phone), meeting link, and notes. | Medium |
| FR-11 | Employee Management | Hired candidates shall be convertible to employee records; employees can be activated or deactivated. | Medium |
| FR-12 | Immutable Audit Trail | Every HR decision shall be logged in `application_history` with name, email, job title, status, reason, and timestamp. | High |
| FR-13 | Analytics Dashboard | Dashboard shall display: total jobs, open postings, total candidates, new candidates (30 days), scheduled interviews, applicants per job (bar chart). | Medium |
| FR-14 | Resume Match Score | System shall compare job description keywords with resume content to generate a relevance match percentage. | Low |
| FR-15 | Duplicate Detection | System shall detect and flag applicants with duplicate email addresses or identical resume content. | Medium |
| FR-16 | Exportable Reports | HR shall export CSV or PDF reports for: Applicant Database, Active Employees, Application Decisions, Login Activity. | Medium |
| FR-17 | Bulk Email Actions | HR shall send bulk acceptance, rejection, duplicate warning, and identity mismatch emails to selected candidates. | Medium |
| FR-18 | Recent Activity Feed | Dashboard shall display a feed of recent actions with timestamps: accepts, rejects, interview schedules, merges. | Low |
| FR-19 | Job Closure Notification | On job deletion, all applicants receive an automated email informing them the position is closed. | Medium |
| FR-20 | Session Management | Sessions managed via localStorage with login/logout timestamps; login history maintained for audit. | Medium |

### 4.3 Non-Functional Requirements

![Security Architecture](./security_illustration.png)

*Figure 4.1: Security Architecture Overview — Parameterised Queries, Role-Based Access Control, and Environment-Variable Credential Management*

**Table 4.2: Non-Functional Requirements**

| NFR ID | Category | Requirement | Target |
|:-------|:---------|:------------|:-------|
| NFR-01 | Performance | Core API endpoints respond within 500ms under normal load | < 500ms |
| NFR-02 | Performance | Candidate notification inbox refreshes for near-real-time updates | < 3 seconds |
| NFR-03 | Security | All database queries shall use parameterised statements (no string concatenation) | 100% |
| NFR-04 | Security | SMTP credentials stored in `.env` files only; never hardcoded | 100% |
| NFR-05 | Security | Role-based access control enforced at React component level | Enforced |
| NFR-06 | Usability | UI follows Glassmorphism design system: frosted glass, gradients, micro-animations | All pages |
| NFR-07 | Usability | Application responsive from 375px (mobile) to 1920px (desktop) | All breakpoints |
| NFR-08 | Scalability | Database design supports 10,000+ applicant records without degradation | 10,000 records |
| NFR-09 | Reliability | Database failures handled gracefully with user-friendly error messages | All routes |
| NFR-10 | Portability | Deployable on Windows, macOS, and Linux without modification | Cross-platform |
| NFR-11 | Maintainability | TypeScript used for both frontend and backend | 100% TypeScript |
| NFR-12 | Availability | Compatible with Vercel serverless deployment for production hosting | Vercel-ready |

### 4.4 Hardware Requirements

**Table 4.3: Minimum Hardware Requirements**

| Component | Minimum | Recommended |
|:----------|:--------|:------------|
| Processor | Dual-Core 2.0 GHz (Intel i3 / Apple M1) | Quad-Core 2.5 GHz (Intel i5 / Apple M2) |
| Memory (RAM) | 8 GB | 16 GB |
| Disk Space | 500 MB (project + SQLite database) | 1 GB |
| Display | 1366 × 768 | 1920 × 1080 |
| Network | Broadband (for email dispatch) | 10 Mbps+ |

### 4.5 Software Requirements

**Table 4.4: Software Requirements and Versions**

| Software | Version | Purpose |
|:---------|:--------|:--------|
| Node.js | v18.0.0+ | JavaScript runtime for backend |
| NPM | v9.0.0+ | Package manager |
| TypeScript | v5.3.3 | Static type checking |
| React.js | v18.x | Frontend UI library |
| Vite | v5.x | Build tool and dev server |
| Express.js | v4.18.2 | Backend web framework |
| SQLite3 | v5.1.6 | Embedded relational database |
| Nodemailer | v6.9.7 | Email dispatch library |
| Axios | Latest | HTTP client for API calls |
| React Router | v6.x | Client-side routing |
| Recharts | Latest | Data visualisation library |
| Lucide React | Latest | SVG icon library |
| date-fns | v2.30.0 | Date formatting utility |
| UUID | v9.0.1 | Unique identifier generation |
| jsPDF + autotable | Latest | Client-side PDF generation |

### 4.6 Technology Stack Justification

**Table 4.5: Technology Stack Comparison**

| Layer | Chosen | Alternative(s) Considered | Reason for Choice |
|:------|:-------|:--------------------------|:------------------|
| Frontend | React.js | Angular, Vue.js | Largest ecosystem; hooks simplify state management; component model suits modular ATS design |
| Language | TypeScript | JavaScript (plain) | Type safety reduces runtime errors; better IDE support; documentation improves collaboration |
| Build Tool | Vite | Webpack, Create React App | Significantly faster cold start and HMR; modern ESM-based architecture |
| Backend | Express.js | Fastify, NestJS | Minimalist; vast middleware ecosystem; proven at scale; no boilerplate overhead |
| Database | SQLite | PostgreSQL, MongoDB | Zero configuration; portable single-file; ideal for demo and SME deployment |
| Email | Nodemailer | SendGrid, AWS SES | Open source; zero API cost; works with any SMTP server including Gmail |
| Hosting | Vercel | AWS, Heroku, Railway | Free tier; zero-config deployment; automatic HTTPS; serverless functions |
| State | React Context | Redux, Zustand | Sufficient for app complexity; avoids additional dependency |

---

---

## CHAPTER 5: SYSTEM DESIGN

### 5.1 High-Level System Architecture

Smart-Cruiter follows a **Three-Tier Architecture** pattern — the industry standard for modern web applications:

1. **Presentation Tier (Client):** React.js SPA running in the browser. Handles UI rendering, interactions, form validation, and client-side routing. Communicates with the logic tier exclusively via HTTP (Axios).

2. **Logic Tier (Server):** Node.js/Express.js backend. Processes business logic, handles API requests, manages database operations, and orchestrates email dispatch. Exposes 8 RESTful route modules.

3. **Data Tier (Database):** SQLite embedded database. Persists all application data across 6 tables. Accessed exclusively through the logic tier using parameterised SQL queries.

![System Architecture Diagram](./system_architecture.png)

*Figure 5.1: High-Level Three-Tier System Architecture of Smart-Cruiter*

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION TIER                       │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │ HR Portal  │  │ Career Page │  │ Candidate Portal │  │
│  │ (React)    │  │ (React)     │  │ (React)          │  │
│  └─────┬──────┘  └──────┬──────┘  └────────┬─────────┘  │
│        └────────────────┼───────────────────┘            │
│                   Axios HTTP Requests                     │
└───────────────────────────┬─────────────────────────────┘
                            │  CORS Middleware
┌───────────────────────────┼─────────────────────────────┐
│                  LOGIC TIER                              │
│   Express.js REST API Server (Port 3001)                 │
│  ┌──────────┬────────────┬────────────┬───────────────┐  │
│  │ /jobs    │ /applicants│ /interviews│ /notifications │  │
│  ├──────────┼────────────┼────────────┼───────────────┤  │
│  │ /emails  │ /analytics │ /employees │ /history       │  │
│  └──────────┴────────────┴────────────┴───────────────┘  │
│              Email Service (Nodemailer/SMTP)              │
└───────────────────────────┬─────────────────────────────┘
                      Parameterised SQL
┌───────────────────────────┼─────────────────────────────┐
│                  DATA TIER                               │
│   SQLite Database (database.sqlite)                      │
│  ┌──────┬───────────┬────────────┬──────────────────┐    │
│  │ jobs │ applicants│ interviews │ employees        │    │
│  ├──────┴───────────┴────────────┴──────────────────┤    │
│  │ notifications    │ application_history            │    │
│  └──────────────────┴───────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Three-Tier Architecture Breakdown

**Presentation Tier — Key Technologies:**

| Component | Technology | Purpose |
|:----------|:-----------|:--------|
| UI Framework | React 18 (Functional Components + Hooks) | Declarative component-based rendering |
| Routing | React Router DOM v6 | Client-side URL-based navigation |
| HTTP Client | Axios | Promise-based API communication |
| State | React Context API + useState | Global auth state + local component state |
| Charts | Recharts | Bar charts for analytics visualisation |
| Icons | Lucide React | SVG icon system |
| PDF Export | jsPDF + jspdf-autotable | Client-side PDF generation |
| Styling | Vanilla CSS with Custom Properties | Glassmorphism design system |

**Logic Tier — Key Technologies:**

| Component | Technology | Purpose |
|:----------|:-----------|:--------|
| Runtime | Node.js v18+ | Server-side JavaScript |
| Framework | Express.js v4.18 | HTTP routing and middleware |
| Database Driver | sqlite3 v5.1 | SQLite connectivity |
| Email | Nodemailer v6.9 | SMTP email dispatch |
| IDs | UUID v9 (v4 variant) | Unique record identifiers |
| Config | dotenv v16 | Environment variable management |

**Data Tier — Highlights:**
- Engine: SQLite 3 (embedded, serverless, zero configuration)
- Storage: Single file `database.sqlite` in the `server/` directory
- Tables: 6 tables (jobs, applicants, interviews, employees, notifications, application_history)
- Indexes: 5 performance indexes
- Integrity: Foreign key constraints with ON DELETE CASCADE / SET NULL

### 5.3 Database Design & Schema

#### 5.3.1 Entity Relationship Diagram

![Database ER Diagram](./database_erd.png)

*Figure 5.2: Entity Relationship Diagram of the Smart-Cruiter Database*

**Key Relationships:**

| Relationship | Type | Constraint |
|:-------------|:----:|:-----------|
| Jobs ↔ Applicants | 1 : N | ON DELETE CASCADE — deleting a job removes its applicants |
| Applicants ↔ Interviews | 1 : N | ON DELETE CASCADE — deleting an applicant removes their interviews |
| Jobs ↔ Interviews | 1 : N | ON DELETE CASCADE — deleting a job removes its interviews |
| Applicants → Employees | 1 : 1 | ON DELETE SET NULL — employee record persists if applicant is deleted |
| Applicants → Notifications | via email | No FK — notifications persist independent of applicant records |
| Application History | standalone | No FK — immutable; decoupled to ensure records never cascade-delete |

#### 5.3.2 Data Dictionary

**Table 5.1: Jobs Table**

| Attribute | Type | Constraints | Description |
|:----------|:-----|:------------|:------------|
| id | TEXT | PRIMARY KEY | UUID v4 unique identifier |
| title | TEXT | NOT NULL | Job designation title |
| department | TEXT | NULLABLE | Department (e.g., Engineering) |
| location | TEXT | NULLABLE | Work location |
| type | TEXT | NULLABLE | full-time / part-time / contract |
| description | TEXT | NULLABLE | Detailed job description |
| requirements | TEXT | NULLABLE | Required skills and qualifications |
| status | TEXT | DEFAULT 'open' | open / closed / draft |
| created_at | DATETIME | DEFAULT NOW | Creation timestamp |
| updated_at | DATETIME | DEFAULT NOW | Last modification timestamp |

**Table 5.2: Applicants Table**

| Attribute | Type | Constraints | Description |
|:----------|:-----|:------------|:------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| job_id | TEXT | NOT NULL, FK → jobs | Applied job reference |
| first_name | TEXT | NOT NULL | Candidate first name |
| last_name | TEXT | NOT NULL | Candidate last name |
| email | TEXT | NOT NULL | Candidate email |
| phone | TEXT | NULLABLE | Contact number |
| resume_url | TEXT | NULLABLE | Link to resume |
| cover_letter | TEXT | NULLABLE | Cover letter text |
| stage | TEXT | DEFAULT 'applied' | Pipeline stage |
| status | TEXT | DEFAULT 'active' | active / archived |
| applied_at | DATETIME | DEFAULT NOW | Application timestamp |
| updated_at | DATETIME | DEFAULT NOW | Last update |
| offer_salary | TEXT | NULLABLE | Offered salary |
| offer_joining_date | TEXT | NULLABLE | Proposed start date |
| offer_status | TEXT | NULLABLE | pending / accepted / rejected |
| offer_notes | TEXT | NULLABLE | Offer benefits/notes |
| offer_rules | TEXT | NULLABLE | Terms & conditions |
| offer_sent_at | DATETIME | NULLABLE | Offer dispatch timestamp |

**Table 5.3: Notifications Table**

| Attribute | Type | Constraints | Description |
|:----------|:-----|:------------|:------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| recipient_email | TEXT | NOT NULL | Candidate email |
| subject | TEXT | NOT NULL | Notification subject |
| message | TEXT | NOT NULL | HTML message content |
| type | TEXT | DEFAULT 'info' | email / info / warning |
| is_read | INTEGER | DEFAULT 0 | 0 = unread, 1 = read |
| created_at | DATETIME | DEFAULT NOW | Creation timestamp |

**Table 5.4: Application History Table**

| Attribute | Type | Constraints | Description |
|:----------|:-----|:------------|:------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| name | TEXT | NOT NULL | Applicant full name |
| email | TEXT | NOT NULL | Applicant email |
| job_title | TEXT | NULLABLE | Role applied for |
| status | TEXT | NOT NULL | Accepted / Rejected / Deactivated |
| reason | TEXT | NULLABLE | Decision rationale |
| date | DATETIME | DEFAULT NOW | Decision timestamp |

**Table 5.5: Employees Table**

| Attribute | Type | Constraints | Description |
|:----------|:-----|:------------|:------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| applicant_id | TEXT | FK → applicants (SET NULL) | Origin applicant |
| name | TEXT | NOT NULL | Full name |
| email | TEXT | NOT NULL | Email |
| job_title | TEXT | NULLABLE | Assigned role |
| department | TEXT | NULLABLE | Department |
| hired_date | DATETIME | NULLABLE | Hire date |
| status | TEXT | DEFAULT 'active' | active / inactive |
| created_at | DATETIME | DEFAULT NOW | Record creation |

**Table 5.6: Interviews Table**

| Attribute | Type | Constraints | Description |
|:----------|:-----|:------------|:------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| applicant_id | TEXT | NOT NULL, FK → applicants | Candidate |
| job_id | TEXT | NOT NULL, FK → jobs | Position |
| scheduled_at | DATETIME | NOT NULL | Interview date & time |
| type | TEXT | DEFAULT 'online' | online / in-person / phone |
| meeting_link | TEXT | NULLABLE | Video conference URL |
| notes | TEXT | NULLABLE | Interviewer notes |
| status | TEXT | DEFAULT 'scheduled' | scheduled / completed / cancelled |
| created_at | DATETIME | DEFAULT NOW | Creation timestamp |
| updated_at | DATETIME | DEFAULT NOW | Last update |

### 5.4 Data Flow Diagrams (DFD)

#### 5.4.1 DFD Level 0 – Context Diagram

The Level 0 DFD shows the system as a single process, with all external entities and data flows.

![DFD Level 0](./dfd_level_0.png)

*Figure 5.3: DFD Level 0 – System Context Diagram*

**External Entities:**
- **HR Administrator** → provides job configurations, stage updates, offer details → receives analytics, reports, audit logs.
- **Job Candidate** → provides applications, offer responses → receives status notifications, offers, communications.
- **SMTP Email Server** → receives email dispatch requests from the system.

#### 5.4.2 DFD Level 1 – Process Breakdown

The Level 1 DFD decomposes the system into 8 major internal processes:

![DFD Level 1](./data_flow_dfd.png)

*Figure 5.4: DFD Level 1 – Detailed Data Flow Diagram*

| Process | Function |
|:--------|:---------|
| **P1 – Authentication Manager** | Validates credentials, determines role (HR/Candidate), routes to appropriate portal |
| **P2 – Job Management Engine** | CRUD for job postings; triggers closure emails on job deletion |
| **P3 – Application Handler** | Processes incoming applications; validates input; creates applicant records |
| **P4 – Pipeline Manager** | Manages stage transitions; supports individual and bulk updates |
| **P5 – Offer Engine** | Generates and dispatches offers; processes Accept/Decline responses |
| **P6 – Notification Dispatcher** | Sends emails via SMTP + saves notification records in the database simultaneously |
| **P7 – Analytics Engine** | Aggregates metrics: total jobs, applicants, stages, interviews, recent activity |
| **P8 – Report Generator** | Compiles data into CSV or PDF exports |

### 5.5 UML Diagrams

#### 5.5.1 Use Case Diagram

![Use Case Diagram](./use_case_diagram.png)

*Figure 5.5: Use Case Diagram – HR Admin and Candidate Roles*

| HR Admin Use Cases | Candidate Use Cases |
|:------------------|:--------------------|
| Login as HR | Login as Candidate |
| Create / Edit / Delete Job | Browse Open Jobs (Public) |
| View All Applicants | Submit Job Application |
| Update Pipeline Stage | View Application Status |
| Send Job Offer | View Notification Inbox |
| Schedule Interview | Accept / Decline Offer |
| View Analytics Dashboard | Logout |
| Export Reports (CSV/PDF) | |
| View Audit History | |
| Manage Employees | |
| Send Bulk Emails | |
| Logout | |

#### 5.5.2 Sequence Diagram

![Sequence Diagram](./sequence_diagram.png)

*Figure 5.6: Sequence Diagram – Application Submission and Offer Flow*

![Job Offer Sequence](./job_offer_sequence_diagram.png)

*Figure 5.7: Sequence Diagram – Job Offer Dispatch and Candidate Response*

**Condensed Sequence Flow:**
```
Candidate → Browse Jobs → GET /api/jobs → DB SELECT → Display Jobs
Candidate → Submit Application → POST /api/applicants → DB INSERT → Confirmation
[HR Reviews → Sends Offer]
HR → PATCH /api/applicants/:id/offer → DB UPDATE (offer fields) → sendEmail() → SMTP + DB INSERT notification
Candidate → View Inbox → GET /api/notifications → Display Offer
Candidate → Accept → POST /api/applicants/:id/offer-response → DB UPDATE stage='hired'
```

#### 5.5.3 Activity Diagram

The complete recruitment workflow state machine:

```
START → HR Creates Job → Job Published on Career Page
→ Candidate Submits Application → Validate Input
  (Invalid?) → Show Error → END
  (Valid?) → Stage: APPLIED → HR Reviews
    → Decision branches:
       [Shortlist] → Stage: SHORTLISTED → Recommended → Schedule Interview
                  → Interview Conducted:
                       [Send Offer] → HR Sends Offer (email + portal)
                                   → Candidate Reviews:
                                        [Accept] → Stage: HIRED → Create Employee Record → Log to History → END
                                        [Decline] → Stage: DECLINED → Log to History → END
                       [Reject] → Stage: DECLINED → Log to History → END
       [Reject] → Stage: DECLINED → Send Rejection Email → END
```

### 5.6 Deployment Diagram

![Deployment Diagram](./deployment_diagram.png)

*Figure 5.8: Deployment Diagram*

**Local Development:**
```
Developer Machine
  ├── Vite Dev Server (Port 5173) [React Frontend]
  │      │ HTTP (Axios)
  ├── Express Server (Port 3001) [Node.js Backend]
  │      │ File I/O
  └── database.sqlite [SQLite]
         │ SMTP (Port 587)
  Gmail SMTP Server (smtp.gmail.com)
```

**Production (Vercel):**
```
Vercel Edge Network (CDN)
  ├── Static Files [Vite Production Build]
  │      │ /api/* Proxy
  ├── Vercel Serverless Function [Express.js API]
  │      │
  └── /tmp/database.sqlite [Ephemeral SQLite — resets between cold starts]
```

> **Note on Vercel:** The `database.sqlite` in `/tmp` is ephemeral and resets between serverless cold starts. For persistent production use, the application should migrate to a hosted database such as PlanetScale, Neon, or Supabase.

### 5.7 Component Structure (Class Diagram)

Since Smart-Cruiter uses React functional components, the class diagram is represented as a **Component Hierarchy:**

```
App.tsx [Root Router]
├── Login.tsx (Public)
├── Layout.tsx [HR Admin Shell]
│   ├── Dashboard.tsx
│   ├── Jobs.tsx / JobDetail.tsx / CreateJob.tsx / EditJob.tsx
│   ├── Applicants.tsx / ApplicantDetail.tsx
│   ├── Employees.tsx
│   ├── Interviews.tsx
│   └── History.tsx
├── CandidateLayout.tsx [Candidate Shell]
│   ├── CandidateDashboard.tsx
│   ├── CandidateJobs.tsx
│   ├── CandidateEmails.tsx
│   └── ApplicationStatus.tsx
├── PublicJobDetail.tsx / ApplyJob.tsx (Public)
├── Shared: ProtectedRoute / ConfirmationModal / StatusModal
├── Contexts: AuthContext / NotificationContext
└── Services: api.ts (Axios + all endpoint functions)
```

---

---

## CHAPTER 6: DATA MANAGEMENT

### 6.1 Overview

Smart-Cruiter uses **SQLite** as its primary data storage engine. SQLite is embedded, serverless, and self-contained — storing the entire database in a single cross-platform file (`database.sqlite`).

**Why SQLite for Smart-Cruiter:**

| Advantage | Detail |
|:----------|:-------|
| Zero Configuration | No server to install; the application creates and manages the file automatically |
| Portability | Single file; trivially copyable, backed up, or migrated |
| ACID Compliance | Full transaction support ensures data integrity |
| Capacity | Supports databases up to 281 TB — far beyond any ATS requirement |
| Cost | Open source; embedded in Node.js via the `sqlite3` package |

**Data Access Abstraction — `database.ts`:**

All database interactions are channelled through three utility functions:

```typescript
// Execute INSERT / UPDATE / DELETE
run(sql: string, params: any[]): Promise<sqlite3.RunResult>

// Execute SELECT, return single row
get<T>(sql: string, params: any[]): Promise<T | undefined>

// Execute SELECT, return all matching rows
all<T>(sql: string, params: any[]): Promise<T[]>
```

All three accept parameterised queries (using `?` placeholders) — the primary defence against SQL injection attacks. They return Promises, enabling consistent `async/await` patterns throughout the application.

### 6.2 Database Tables and Relationships

**Table Relationship Map:**
```
             ┌──────────────┐
             │     JOBS     │
             └──┬───────┬───┘
          FK(job_id)  FK(job_id)
                │           │
    ┌───────────▼──┐   ┌────▼──────────────┐
    │  APPLICANTS  │   │    INTERVIEWS      │
    └──┬──────┬────┘   └───────────────────┘
       │      │ (email match)
 FK(id)│      │
       │   ┌──▼──────────────────┐
  ┌────▼──┐ │    NOTIFICATIONS   │
  │EMPLOY-│ │  (Candidate Inbox) │
  │ EES   │ └────────────────────┘
  └───────┘
             ┌──────────────────────┐
             │  APPLICATION_HISTORY │
             │  (Immutable Audit)   │
             └──────────────────────┘
```

**Table 6.1: Database Record Volume Estimates**

| Table | Year 1 Estimate | Growth Rate |
|:------|:--------------:|:-----------:|
| Jobs | 50–200 | ~10/month |
| Applicants | 500–5,000 | ~100/month |
| Interviews | 100–1,000 | ~30/month |
| Employees | 20–200 | ~5/month |
| Notifications | 1,000–10,000 | ~200/month |
| Application History | 200–2,000 | ~50/month |

### 6.3 Data Seeding and Initialisation

The `initDatabase()` function in `database.ts` performs three operations on application startup:

**1. Idempotent Schema Creation:**
Every table uses `CREATE TABLE IF NOT EXISTS` — safe to run on every restart without duplicating tables.

**2. Schema Migration:**
The `applicants` table migration uses SQLite's `PRAGMA table_info(applicants)` to check for offer-related columns. Missing columns are added via `ALTER TABLE` statements — enabling backward-compatible schema evolution:

```typescript
const tableInfo = await all(`PRAGMA table_info(applicants)`);
const columns = tableInfo.map((col: any) => col.name);
if (!columns.includes('offer_salary')) {
  await run(`ALTER TABLE applicants ADD COLUMN offer_salary TEXT`);
}
// ... repeat for offer_joining_date, offer_status, etc.
```

**3. Demo Data Seeding:**
If the `jobs` table is empty, the function seeds two job postings (Senior Software Engineer, Product Manager), one applicant (John Doe), and one history entry (Jane Smith — Accepted). This ensures meaningful data on first launch.

### 6.4 Data Indexing Strategy

**Table 6.2: Indexing Strategy**

| Index Name | Table | Column | Justification |
|:-----------|:------|:-------|:--------------|
| `idx_applicants_job_id` | applicants | job_id | Frequent JOIN with jobs; filter by job in pipeline view |
| `idx_applicants_stage` | applicants | stage | Analytics `GROUP BY stage`; stage filter in pipeline |
| `idx_interviews_applicant_id` | interviews | applicant_id | Load interviews for specific applicant |
| `idx_interviews_job_id` | interviews | job_id | Load all interviews for a specific job |
| `idx_history_email` | application_history | email | Candidate history lookup by email |

```sql
CREATE INDEX IF NOT EXISTS idx_applicants_job_id ON applicants(job_id);
CREATE INDEX IF NOT EXISTS idx_applicants_stage ON applicants(stage);
CREATE INDEX IF NOT EXISTS idx_interviews_applicant_id ON interviews(applicant_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_history_email ON application_history(email);
```

These indexes ensure that the most frequent query patterns — filtering applicants by job/stage, looking up interviews by applicant or job, and searching history by email — execute in O(log n) time rather than O(n) full-table scans.

---

*— End of Report Part A (Chapters 1–6) —*
*Continue with `SMART_CRUITER_REPORT_B.md` for Chapters 7–10, References, and Appendices.*
