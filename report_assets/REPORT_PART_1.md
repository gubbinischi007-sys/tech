

# SMART-CRUITER: AN AUTOMATED APPLICANT TRACKING SYSTEM (ATS)

### Bachelor of Technology – Final Year Project Report

**Submitted in partial fulfilment of the requirements for the degree of**
**Bachelor of Technology in Computer Science and Engineering**

---

|                    |                                  |
|--------------------|----------------------------------|
| **Project Title**  | Smart-Cruiter: An Automated Applicant Tracking System (ATS) |
| **Department**     | Computer Science and Engineering |
| **Academic Year**  | 2025 – 2026                      |
| **Report Type**    | Final Year Project Report        |

---

---

## ABSTRACT

Recruitment is a mission-critical function in every organisation, yet the processes that underpin it are frequently manual, inconsistent, and opaque for candidates. This project presents **Smart-Cruiter**, a full-stack **Automated Applicant Tracking System (ATS)** engineered to digitalise and automate the entire employee acquisition lifecycle — from vacancy publication to offer acceptance.

The system is built upon a three-tier web architecture utilising **React.js (v18)** with **TypeScript** for a responsive and dynamic client interface, **Node.js** with the **Express.js** framework for a RESTful API backend, and **SQLite** as an embedded, portable relational database engine. The key modules delivered include: a **Job Management Engine** enabling HR administrators to create, publish, and archive vacancies; an **Applicant Pipeline Manager** that tracks candidates across the stages of *Applied → Shortlisted → Recommended → Offered → Hired/Declined*; an **Automated Communication Centre** that dispatches personalised HTML-formatted emails via the **Nodemailer SMTP** library upon every pipeline stage transition; and a **Candidate Self-Service Dashboard** where job-seekers can view their real-time application status and respond to job offers electronically.

The system further incorporates an immutable **Audit Trail** that logs every HR decision with a timestamp and rationale, providing complete accountability and enabling post-hoc review. A **Resume Match Score** feature uses keyword-based relevance analysis to generate match percentages between applicant resumes and job descriptions. **Duplicate Detection** prevents repeated submissions by checking email and resume data against existing records. The application also supports **Exportable Reports** in CSV and PDF formats for applicants, employees, decisions, and login activity.

A **Glassmorphism-styled** user interface, adhering to modern UX principles, ensures a premium and accessible experience across all device sizes. Security is enforced through parameterised SQL queries, environment-variable credential management, and role-based access control implemented at the middleware level.

Testing was conducted using an Incremental Integration approach. The system successfully passed all defined test cases, demonstrating correct status transitions, real-time notification delivery (within 3 seconds), and a 100% pass rate for core functional requirements. The project validates that open-source, lightweight technologies can be combined to deliver enterprise-grade HR functionality at near-zero infrastructure cost — making Smart-Cruiter a compelling, scalable alternative to costly proprietary systems such as Workday and Greenhouse.

**Keywords:** *Applicant Tracking System (ATS), Recruitment Automation, React.js, Node.js, Express.js, TypeScript, SQLite, Nodemailer, RESTful API, Glassmorphism, Role-Based Access Control, Human Resource Management (HRM), Full-Stack Web Development.*

---

---

## TABLE OF CONTENTS

| Chapter No. | Title | Page No. |
|:-----------:|:------|:--------:|
| | **ABSTRACT** | i |
| | **TABLE OF CONTENTS** | ii |
| | **LIST OF FIGURES** | iv |
| | **LIST OF TABLES** | v |
| **1** | **INTRODUCTION** | 1 |
| | 1.1 Overview | 1 |
| | 1.2 Background of the Study | 2 |
| | 1.3 Motivation | 3 |
| | 1.4 Objectives of the Project | 4 |
| | 1.5 Project Scope | 5 |
| | 1.6 Organisation of the Report | 5 |
| **2** | **PROBLEM STATEMENT** | 6 |
| | 2.1 Existing Challenges in Recruitment | 6 |
| | 2.2 Specific Problem Areas Addressed | 7 |
| | 2.3 Need for the Proposed System | 8 |
| **3** | **LITERATURE REVIEW** | 9 |
| | 3.1 Evolution of Applicant Tracking Systems | 9 |
| | 3.2 Analysis of Workday Recruiting (Enterprise ATS) | 10 |
| | 3.3 Analysis of Greenhouse Software (Mid-Tier ATS) | 11 |
| | 3.4 Analysis of BambooHR (SME-Focused ATS) | 12 |
| | 3.5 Manual Recruitment Using Spreadsheets | 13 |
| | 3.6 Gaps Identified and Justification for Smart-Cruiter | 14 |
| **4** | **PROJECT REQUIREMENTS SPECIFICATION** | 16 |
| | 4.1 Feasibility Study | 16 |
| |     4.1.1 Technical Feasibility | 16 |
| |     4.1.2 Operational Feasibility | 17 |
| |     4.1.3 Economic Feasibility | 17 |
| |     4.1.4 Schedule Feasibility | 18 |
| | 4.2 Functional Requirements (IEEE 830 Standard) | 18 |
| | 4.3 Non-Functional Requirements | 20 |
| | 4.4 Hardware Requirements | 21 |
| | 4.5 Software Requirements | 22 |
| | 4.6 Technology Stack Justification | 22 |
| **5** | **SYSTEM DESIGN (Detailed)** | 24 |
| | 5.1 High-Level System Architecture | 24 |
| | 5.2 Three-Tier Architecture Breakdown | 25 |
| | 5.3 Database Design & Schema | 26 |
| |     5.3.1 Entity Relationship Diagram (ERD) | 26 |
| |     5.3.2 Data Dictionary | 27 |
| | 5.4 Data Flow Diagrams (DFD) | 29 |
| |     5.4.1 DFD Level 0 – Context Diagram | 29 |
| |     5.4.2 DFD Level 1 – Process Breakdown | 30 |
| | 5.5 UML Diagrams | 31 |
| |     5.5.1 Use Case Diagram | 31 |
| |     5.5.2 Sequence Diagram | 32 |
| |     5.5.3 Activity Diagram | 33 |
| | 5.6 Deployment Diagram | 34 |
| | 5.7 Class Diagram (Component Structure) | 35 |
| **6** | **DATA** | 36 |
| | 6.1 Overview of Data Management | 36 |
| | 6.2 Database Tables and Relationships | 37 |
| | 6.3 Data Seeding and Initialisation | 38 |
| | 6.4 Data Indexing Strategy | 39 |
| **7** | **PROPOSED METHODOLOGY** | 40 |
| | 7.1 Overview of Development Methodology | 40 |
| | 7.2 Initial Analysis and Requirement Gathering | 41 |
| | 7.3 System Module Design | 42 |
| |     7.3.1 Job Management Module | 42 |
| |     7.3.2 Applicant Pipeline Module | 43 |
| |     7.3.3 Communication Engine Module | 44 |
| | 7.4 Website – Development and Process | 45 |
| **8** | **IMPLEMENTATION AND CODE** | 46 |
| | 8.1 Server-Side Implementation | 46 |
| |     8.1.1 Server Entry Point and Middleware Setup | 46 |
| |     8.1.2 Database Initialisation and Schema | 47 |
| |     8.1.3 Job CRUD Operations | 49 |
| |     8.1.4 Applicant Management and Pipeline | 50 |
| |     8.1.5 Offer Dispatch and Candidate Response | 51 |
| |     8.1.6 Email Service (Nodemailer SMTP) | 53 |
| |     8.1.7 Analytics and Dashboard API | 54 |
| |     8.1.8 Notification System | 55 |
| |     8.1.9 History and Audit Trail | 55 |
| | 8.2 Client-Side Implementation | 56 |
| |     8.2.1 Application Routing (React Router) | 56 |
| |     8.2.2 Authentication Context and Session Management | 57 |
| |     8.2.3 API Service Layer (Axios) | 58 |
| |     8.2.4 Protected Route Component | 59 |
| |     8.2.5 HR Dashboard with Analytics | 59 |
| |     8.2.6 Report Export (CSV / PDF) | 60 |
| **9** | **RESULTS AND DISCUSSION** | 62 |
| | 9.1 Testing Methodology | 62 |
| | 9.2 Unit Testing | 63 |
| | 9.3 Integration Testing | 64 |
| | 9.4 Detailed Test Case Tables (TC01 – TC20) | 65 |
| | 9.5 UI/UX Results and Screenshots | 68 |
| | 9.6 Performance Metrics | 69 |
| **10** | **CONCLUSION AND FUTURE WORK** | 70 |
| | 10.1 Summary of Work Done | 70 |
| | 10.2 Limitations | 71 |
| | 10.3 Future Enhancements | 72 |
| | 10.4 Strategic Business Impact | 73 |
| | **REFERENCES / BIBLIOGRAPHY** | 74 |
| | **APPENDIX A – Project Directory Structure** | 76 |
| | **APPENDIX B – Definitions, Acronyms and Abbreviations** | 77 |

---

---

## LIST OF FIGURES

| Figure No. | Title | Page No. |
|:----------:|:------|:--------:|
| Figure 5.1 | High-Level Three-Tier System Architecture Diagram | 24 |
| Figure 5.2 | Entity Relationship Diagram (ERD) of Smart-Cruiter Database | 26 |
| Figure 5.3 | DFD Level 0 – System Context Diagram | 29 |
| Figure 5.4 | DFD Level 1 – Detailed Data Flow Diagram | 30 |
| Figure 5.5 | Use Case Diagram – HR Admin and Candidate Roles | 31 |
| Figure 5.6 | Sequence Diagram – Application Submission and Offer Flow | 32 |
| Figure 5.7 | Activity Diagram – Recruitment Pipeline Process | 33 |
| Figure 5.8 | Deployment Diagram – Node and Software Configuration | 34 |
| Figure 5.9 | Class Diagram – React Component Hierarchy | 35 |
| Figure 7.1 | Recruitment Pipeline State-Transition Workflow Flowchart | 42 |
| Figure 9.1 | Smart-Cruiter Landing Page Screenshot | 68 |
| Figure 9.2 | HR Dashboard Analytics Screenshot | 68 |
| Figure 9.3 | Candidate Inbox and Offer Response Screenshot | 69 |

---

---

## LIST OF TABLES

| Table No. | Title | Page No. |
|:---------:|:------|:--------:|
| Table 4.1 | Functional Requirements (IEEE 830 Standard) | 18 |
| Table 4.2 | Non-Functional Requirements | 20 |
| Table 4.3 | Minimum Hardware Requirements | 21 |
| Table 4.4 | Software Requirements and Versions | 22 |
| Table 4.5 | Technology Stack Comparison | 23 |
| Table 5.1 | Data Dictionary – Jobs Table | 27 |
| Table 5.2 | Data Dictionary – Applicants Table | 27 |
| Table 5.3 | Data Dictionary – Notifications Table | 28 |
| Table 5.4 | Data Dictionary – Application History Table | 28 |
| Table 5.5 | Data Dictionary – Employees Table | 28 |
| Table 5.6 | Data Dictionary – Interviews Table | 29 |
| Table 9.1 | Test Case Table – TC01 to TC20 | 65 |

---

---

## CHAPTER 1: INTRODUCTION

### 1.1 Overview

The recruitment process is the backbone of organisational growth. Hiring the right talent at the right time directly impacts a company's productivity, culture, and profitability. However, as businesses expand, the volume of applications grows exponentially. A single job posting on platforms like LinkedIn or Indeed can attract hundreds, if not thousands, of applicants within days. Managing this influx of data using manual processes — spreadsheets, email inboxes, or paper-based filings — quickly becomes unsustainable.

An **Applicant Tracking System (ATS)** is a specialised software application designed to automate and streamline the recruitment workflow. It serves as a centralised repository for all candidate data, enables structured pipeline management (from initial application to final hire), and provides communication tools to keep both HR teams and candidates informed throughout the process. Modern ATS platforms have evolved beyond simple data storage to include intelligent features such as resume parsing, automated email notifications, interview scheduling, and analytics dashboards.

**Smart-Cruiter** is a full-stack web-based Applicant Tracking System developed as a final year engineering project. It digitises the end-to-end recruitment lifecycle, providing separate portal experiences for HR administrators and job candidates. The system is designed to be lightweight, cost-effective, and feature-rich — offering functionality comparable to enterprise-grade solutions like Workday and Greenhouse, but built entirely with open-source technologies at near-zero infrastructure cost.

The core philosophy behind Smart-Cruiter is the belief that a well-designed recruitment tool should serve both sides of the hiring equation: the recruiter who needs efficiency and data, and the candidate who deserves transparency and timely communication. This dual-focus approach sets Smart-Cruiter apart from many existing solutions that cater exclusively to the employer's perspective.

### 1.2 Background of the Study

The landscape of talent acquisition has undergone a dramatic transformation over the past two decades. In the early 2000s, recruitment was largely a reactive process — organisations would post job advertisements in newspapers or on job boards, wait for postal or email applications, and manually sift through résumés. This approach, often referred to as the "Post and Pray" model, was characterised by high latency, limited reach, and significant administrative overhead.

The emergence of online job portals (Monster, Naukri, Indeed) in the mid-2000s marked the first major shift towards digitisation. Suddenly, organisations had access to a vastly larger talent pool. However, this increased volume created a new problem: **information overload**. HR departments were now dealing with hundreds of applications per vacancy, yet their tools (primarily email and spreadsheets) had not evolved to handle this scale.

The first generation of ATS platforms (Taleo, iCIMS) emerged in the late 2000s to address this challenge. These systems offered centralised candidate databases, basic workflow management, and rudimentary reporting. However, they were typically expensive, required extensive IT infrastructure, and offered limited candidate-facing features.

The current generation of ATS platforms (Greenhouse, Lever, BambooHR) represents a significant improvement in user experience and feature set. These cloud-based solutions offer mobile-responsive interfaces, integration with social media platforms, and collaborative hiring workflows. However, they remain out of reach for many small and medium enterprises (SMEs) due to their subscription-based pricing models, which can range from ₹25,000 to ₹8,00,000 per month depending on the organisation size and feature tier.

This pricing barrier has created a significant gap in the market. Many SMEs and startups in India — the very organisations that are growing fastest and hiring most aggressively — are forced to rely on manual processes or cobbled-together solutions involving Google Sheets, email, and WhatsApp. **Smart-Cruiter** is designed to fill this gap by providing a professional-grade ATS that can be self-hosted at minimal cost.

### 1.3 Motivation

The primary motivations for this project are:

1. **Cost Accessibility:** Enterprise ATS platforms like Workday charge upwards of $10,000 per month, making them inaccessible to startups and SMEs. Smart-Cruiter uses entirely open-source technologies (React, Node.js, SQLite), making it free to develop, deploy, and maintain.

2. **Candidate Experience Gap:** Most existing ATS systems are designed exclusively from the recruiter's perspective. Candidates are left in the dark about their application status, leading to what is known as the "Black Hole" effect — where résumés go in but no communication comes out. Smart-Cruiter addresses this by providing a dedicated Candidate Portal with a real-time notification inbox.

3. **Administrative Fatigue:** HR professionals spend an estimated 23 hours screening résumés for a single hire (Glassdoor, 2023). Manual processes such as generating offer letters, sending status update emails, and maintaining decision records consume significant time that could be better spent on strategic talent acquisition activities. Smart-Cruiter automates these repetitive tasks.

4. **Audit and Compliance:** Many organisations lack a systematic record of why candidates are hired or rejected. This creates legal and compliance risks, particularly in industries subject to equal opportunity regulations. Smart-Cruiter implements an immutable audit trail that logs every decision with a timestamp and rationale.

5. **Academic Learning:** As a final year project, Smart-Cruiter provides an opportunity to apply core Computer Science concepts — database design, RESTful API architecture, state management, and security patterns — in a real-world, end-to-end application.

### 1.4 Objectives of the Project

The specific objectives of the Smart-Cruiter project are:

1. To design and develop a full-stack web application that automates the hiring pipeline from "Job Posted" to "Candidate Onboarded".
2. To implement a **dual-portal system** with separate interfaces for HR administrators and job candidates, each with role-based access control.
3. To build a **Job Management Engine** that supports CRUD (Create, Read, Update, Delete) operations for job vacancies with metadata including title, department, location, type, description, and requirements.
4. To create an **Applicant Pipeline Manager** that tracks candidates through the stages: Applied → Shortlisted → Recommended → Offered → Hired/Declined.
5. To develop an **Automated Communication Engine** using Nodemailer and SMTP that sends personalised HTML emails to candidates upon every pipeline stage transition.
6. To implement a **Candidate Self-Service Dashboard** where applicants can view their application status, receive notifications, and respond to job offers electronically.
7. To incorporate an **immutable Audit Trail** that records every HR decision with timestamp and context for accountability.
8. To provide an **Analytics Dashboard** with data visualisation charts showing applicants by stage, applicants per job, recent activity, and upcoming interviews.
9. To integrate **Resume Match Scoring** that compares job description keywords with resume content to generate relevance percentages.
10. To implement **Duplicate Detection** that identifies repeated applicant submissions and alerts HR administrators.
11. To enable **Exportable Reports** in CSV and PDF formats for applicants, employees, decisions, and login activity.

### 1.5 Project Scope

The scope of Smart-Cruiter encompasses the following deliverables:

- **HR Admin Portal:** A comprehensive dashboard for managing jobs, applicants, interviews, employees, and recruitment history. Includes analytics charts, report exports, and activity feeds.
- **Public Career Page:** A publicly accessible page where visitors can browse open job postings and view detailed job descriptions.
- **Job Application System:** An online form allowing candidates to submit applications with personal details, resume URLs, and cover letters.
- **Candidate Portal:** A private portal for registered candidates to track application status, view notifications, and respond to offers.
- **Email Communication System:** Automated email dispatch using SMTP for status updates, offer letters, acceptance/rejection notifications, and warning emails.
- **Interview Management:** Scheduling and tracking of interviews with support for online, in-person, and phone interview types.
- **Employee Management:** Post-hire employee records with activation and deactivation capabilities.
- **History and Audit:** A complete log of all hiring decisions for compliance and review.

**Out of Scope:** AI-based resume parsing using NLP, video interview integration, third-party HR system integrations, and mobile native applications.

### 1.6 Organisation of the Report

This report is organised into ten chapters that mirror the phases of the Software Development Life Cycle (SDLC):

- **Chapter 1 (Introduction):** Provides the overview, background, motivation, and objectives.
- **Chapter 2 (Problem Statement):** Defines the specific problems this project addresses.
- **Chapter 3 (Literature Review):** Surveys existing systems and identifies gaps.
- **Chapter 4 (Project Requirements Specification):** Details feasibility, functional, and non-functional requirements.
- **Chapter 5 (System Design):** Presents architecture, database schema, DFDs, and UML diagrams.
- **Chapter 6 (Data):** Describes data management, tables, relationships, and indexing.
- **Chapter 7 (Proposed Methodology):** Outlines the development approach and module design.
- **Chapter 8 (Implementation and Code):** Contains the core source code with explanations.
- **Chapter 9 (Results and Discussion):** Presents test results, screenshots, and performance.
- **Chapter 10 (Conclusion and Future Work):** Summarises achievements and proposes enhancements.

---

---

## CHAPTER 2: PROBLEM STATEMENT

### 2.1 Existing Challenges in Recruitment

The modern recruitment landscape is characterised by several systemic challenges that affect both employers and candidates. These challenges have intensified with the digitisation of job applications, which has dramatically increased the volume of applications while leaving the underlying management processes largely unchanged.

**Challenge 1: Volume Overload**
A single job posting on a platform like LinkedIn can generate between 100 and 700 applications within the first week. For organisations posting multiple vacancies simultaneously, this translates to thousands of applications requiring screening, categorisation, and response. Without automated tools, HR teams face an impossible task: reviewing each application manually while maintaining quality and consistency in their evaluations.

**Challenge 2: Communication Breakdown**
Research by CareerBuilder (2023) found that 52% of candidates cite "lack of response from employers" as their greatest frustration with the job search process. This phenomenon, known as "Candidate Silence" or the "Application Black Hole," occurs when organisations fail to communicate status updates to applicants. The consequences are significant: damaged employer brand, negative reviews on platforms like Glassdoor, and loss of top talent to more responsive competitors.

**Challenge 3: Data Fragmentation**
In the absence of a centralised system, recruitment data is typically scattered across multiple platforms: job postings on LinkedIn, applications in email, interview notes in Word documents, and candidate evaluations in spreadsheets. This fragmentation makes it extremely difficult to maintain a coherent view of the hiring pipeline, track metrics, or conduct post-hoc analysis.

**Challenge 4: Audit Deficiency**
Many organisations have no systematic record of their hiring decisions. There is no log of why a candidate was advanced to the interview stage, why another was rejected, or who made these decisions. This lack of accountability creates both operational inefficiencies (decisions cannot be reviewed or improved) and legal risks (inability to demonstrate fair hiring practices).

**Challenge 5: Duplicate and Fraudulent Applications**
Candidates sometimes submit multiple applications for the same position, either accidentally or intentionally. Some may also use different names or upload resumes belonging to other individuals. Without automated detection mechanisms, these duplicates and inconsistencies go unnoticed, wasting HR time and potentially leading to incorrect hiring decisions.

### 2.2 Specific Problem Areas Addressed

Smart-Cruiter is designed to address five specific problem areas:

| Problem Area | Current State | Smart-Cruiter Solution |
|:------------|:-------------|:----------------------|
| **Reactive Communication** | Candidates contacted only when convenient for HR; high dropout rates | Automated email triggers on every pipeline stage change; real-time candidate notification inbox |
| **No Structured Pipeline** | Candidates tracked in spreadsheets without defined stages | Six-stage pipeline: Applied → Shortlisted → Recommended → Offered → Hired / Declined |
| **Manual Offer Process** | Offer letters generated in Word, emailed manually | One-click offer dispatch with salary, joining date, terms; candidate can Accept/Decline in-app |
| **Zero Accountability** | No history of who made what decision and when | Immutable `application_history` table with timestamps and rationale |
| **Data Silos** | Information in email, spreadsheets, and chat platforms | Centralised SQLite database with structured API access |

### 2.3 Need for the Proposed System

Given the challenges outlined above, there is a clear and pressing need for a system that:

1. **Centralises** all recruitment data in a single, structured database.
2. **Automates** repetitive tasks such as status updates, email notifications, and report generation.
3. **Provides transparency** to candidates through a self-service portal with real-time status visibility.
4. **Ensures accountability** through an immutable audit trail of all decisions.
5. **Is affordable** and deployable by organisations of any size, including startups with zero IT budget.

Smart-Cruiter is the proposed solution that meets all five of these requirements. By leveraging open-source technologies and a lightweight SQLite database, the system eliminates the financial barrier to entry. By implementing a dual-portal architecture with automated communication, it solves the transparency problem. And by maintaining a comprehensive history log, it ensures every hiring decision is documented and reviewable.

---

---

## CHAPTER 3: LITERATURE REVIEW

### 3.1 Evolution of Applicant Tracking Systems

The concept of tracking job applicants using software emerged in the 1990s as organisations began moving from paper-based processes to digital systems. The evolution can be broadly categorised into four generations:

**First Generation (1990s – Early 2000s): Basic Database Systems**
The earliest ATS platforms were essentially digital filing cabinets. They stored résumés in a database and allowed recruiters to search through them using keywords. There were no workflow capabilities, no communication tools, and no candidate-facing interfaces. Examples from this era include Restrac and Webhire. These systems were typically deployed on-premises and required dedicated IT support to maintain.

**Second Generation (2005 – 2012): Web-Based SaaS Platforms**
The rise of Software-as-a-Service (SaaS) transformed the ATS market. Platforms like Taleo (later acquired by Oracle), iCIMS, and Jobvite offered cloud-hosted solutions with subscription pricing. These systems introduced structured recruitment workflows, basic reporting, and integration with job boards. However, they were primarily designed for large enterprises and their pricing reflected this focus.

**Third Generation (2013 – 2020): Experience-Focused Platforms**
Companies like Greenhouse, Lever, and SmartRecruiters recognised that the ATS should serve as a strategic hiring tool rather than just a data store. They introduced features like structured interviewing (scorecards), collaborative hiring (team feedback), and candidate relationship management (CRM). This generation also saw the emergence of mobile-optimised candidate experiences and integration ecosystems (connecting with calendar apps, video interview tools, and background check services).

**Fourth Generation (2021 – Present): AI-Driven Intelligent Recruitment**
The current generation leverages artificial intelligence for resume screening, chatbot-based candidate engagement, predictive analytics, and bias detection. Platforms like HireVue, Pymetrics, and Eightfold.ai use machine learning models to assess candidate fit and predict hiring outcomes. However, these advanced features come with significant cost and complexity implications.

Smart-Cruiter positions itself between the third and fourth generations — offering the structured workflows and candidate experience of modern platforms, with selective intelligent features (keyword-based resume matching, duplicate detection) that do not require expensive AI infrastructure.

### 3.2 Analysis of Workday Recruiting (Enterprise ATS)

**Overview:** Workday Recruiting is a module within the broader Workday Human Capital Management (HCM) suite. It is designed for global enterprises with thousands of employees and complex hiring workflows.

**Key Features:**
- Fully integrated with payroll, benefits, and performance management
- Multi-language and multi-currency support
- Advanced reporting and analytics with Workday Prism
- AI-powered candidate recommendations
- Compliance management for diverse regulatory environments

**Strengths:**
- End-to-end HR lifecycle management in a single platform
- Enterprise-grade security and data governance
- Extensive customisation capabilities
- Global support infrastructure

**Limitations:**
- **Prohibitive Cost:** Licensing starts at approximately $100 per employee per year, with implementation costs ranging from $500,000 to $2,000,000 for mid-sized organisations. This makes it completely inaccessible for startups and SMEs.
- **Complex Implementation:** Typical implementation timelines range from 6 to 18 months, requiring dedicated project teams and external consultants.
- **Over-Engineered for Small Teams:** Many features (multi-currency, global compliance) are unnecessary for small organisations, adding complexity without value.
- **No Standalone ATS:** Workday Recruiting cannot be purchased independently; it requires the broader HCM suite.

**Relevance to Smart-Cruiter:** Workday demonstrates the features that enterprise organisations expect from an ATS (structured pipelines, automated communication, analytics). Smart-Cruiter aims to deliver a subset of these core features at a fraction of the cost, targeting the large and underserved SME segment.

### 3.3 Analysis of Greenhouse Software (Mid-Tier ATS)

**Overview:** Greenhouse is a widely adopted ATS known for its focus on structured hiring and data-driven recruitment. It is popular among technology companies and mid-sized organisations.

**Key Features:**
- Structured interview kits and candidate scorecards
- Customisable hiring pipelines
- Integration marketplace with 400+ third-party tools
- Diversity, Equity, and Inclusion (DEI) analytics
- Candidate nurturing and CRM capabilities

**Strengths:**
- Excellent user interface and user experience
- Strong emphasis on reducing hiring bias
- Comprehensive API for custom integrations
- Robust analytics and reporting

**Limitations:**
- **Subscription Pricing:** Plans start at approximately $6,000 per year for small teams, scaling to $50,000+ for enterprise configurations. Annual subscription model creates recurring costs.
- **No Self-Hosting Option:** Greenhouse is exclusively cloud-hosted, which raises data sovereignty concerns for some organisations.
- **Feature Bloat:** The extensive feature set can be overwhelming for small teams with simple hiring needs.
- **Limited Candidate Portal:** While Greenhouse excels on the recruiter side, its candidate-facing experience is relatively limited compared to the internal tools.

**Relevance to Smart-Cruiter:** Greenhouse's structured pipeline approach (with defined stages and transitions) directly inspires Smart-Cruiter's six-stage applicant pipeline. However, Smart-Cruiter addresses Greenhouse's candidate portal limitation by providing a comprehensive candidate-facing dashboard with notifications and offer response capabilities.

### 3.4 Analysis of BambooHR (SME-Focused ATS)

**Overview:** BambooHR positions itself as an all-in-one HR solution for small to medium businesses. Its ATS module is part of a broader platform that includes onboarding, time tracking, and performance management.

**Key Features:**
- Simple, intuitive interface designed for non-technical HR staff
- Integrated job posting to multiple boards
- Basic applicant tracking with customisable statuses
- Employee self-service portal
- Mobile application for on-the-go management

**Strengths:**
- Designed specifically for SMEs (5–1,000 employees)
- Quick setup with minimal training required
- Affordable compared to enterprise solutions (starting ~$6 per employee per month)
- Good balance of features and simplicity

**Limitations:**
- **Limited Automation:** Basic email templates are available, but there is no event-driven automated communication triggered by pipeline stage changes.
- **No Real-Time Candidate Notifications:** Candidates do not have a self-service dashboard to track their application status in real-time.
- **Basic Analytics:** Reporting is limited to simple metrics without data visualisation charts.
- **No Audit Trail:** Decision history is not maintained for compliance purposes.

**Relevance to Smart-Cruiter:** BambooHR demonstrates that there is a strong market for SME-focused ATS solutions, but it falls short on automation and candidate experience. Smart-Cruiter fills these gaps with event-driven email notifications, a candidate notification inbox, and comprehensive analytics with chart visualisations.

### 3.5 Manual Recruitment Using Spreadsheets

Despite the availability of ATS platforms, a significant number of organisations — particularly in India — continue to rely on manual processes for managing recruitment.

**Common Manual Approach:**
1. Job postings are shared via email, WhatsApp groups, or social media.
2. Applications are received via email as résumé attachments.
3. An Excel spreadsheet is maintained with columns for candidate name, email, phone, position applied, and status.
4. Interview scheduling is done via email or phone.
5. Offer letters are created in Microsoft Word and sent as PDF attachments.
6. Status updates (if any) are sent manually via email.

**Analysis of Limitations:**
- **No Version Control:** Multiple HR staff may update the spreadsheet simultaneously, leading to conflicting data.
- **No Automation:** Every email, every status update, and every offer letter must be manually created and sent.
- **No Security:** Spreadsheets can be easily shared, copied, or deleted, with no access control or audit logging.
- **No Candidate Visibility:** Candidates have absolutely no way to track their application status.
- **Scalability Ceiling:** Beyond approximately 50 concurrent applications, manual processes become unmanageable.

**Relevance to Smart-Cruiter:** This is the baseline that Smart-Cruiter aims to replace. By providing a structured database, automated workflows, and a candidate portal, Smart-Cruiter eliminates every limitation of manual recruitment while maintaining the simplicity that makes spreadsheets attractive.

### 3.6 Gaps Identified and Justification for Smart-Cruiter

Based on the literature review, the following gaps have been identified:

| Gap | Workday | Greenhouse | BambooHR | Manual | Smart-Cruiter |
|:----|:-------:|:----------:|:--------:|:------:|:-------------:|
| Cost-effective for SMEs | ✗ | ✗ | △ | ✓ | ✓ |
| Automated Pipeline Communication | ✓ | ✓ | ✗ | ✗ | ✓ |
| Candidate Self-Service Portal | ✓ | △ | ✗ | ✗ | ✓ |
| Real-Time Notification Inbox | △ | ✗ | ✗ | ✗ | ✓ |
| Immutable Audit Trail | ✓ | △ | ✗ | ✗ | ✓ |
| Self-Hosted / No Vendor Lock-in | ✗ | ✗ | ✗ | ✓ | ✓ |
| Open Source & Zero Licensing Cost | ✗ | ✗ | ✗ | N/A | ✓ |
| Resume Match Scoring | ✓ | ✓ | ✗ | ✗ | ✓ |
| Duplicate Detection | ✓ | △ | ✗ | ✗ | ✓ |
| Export Reports (CSV/PDF) | ✓ | ✓ | △ | ✗ | ✓ |

*Legend: ✓ = Fully Supported, △ = Partially Supported, ✗ = Not Supported*

**Key Justification:** No existing system simultaneously offers enterprise-grade features (automated communication, audit trail, analytics), SME-appropriate pricing (free/open-source), and a genuine dual-portal experience (both recruiter and candidate). Smart-Cruiter uniquely occupies this intersection.

---

---

## CHAPTER 4: PROJECT REQUIREMENTS SPECIFICATION

### 4.1 Feasibility Study

A feasibility study was conducted across four dimensions to assess the viability of the Smart-Cruiter project before development commenced.

#### 4.1.1 Technical Feasibility

The technology stack selected for Smart-Cruiter consists entirely of well-established, widely-adopted open-source technologies:

- **React.js v18** (Frontend): The most popular JavaScript UI library with over 220K GitHub stars and extensive community support. React's component-based architecture enables modular development and code reuse.
- **TypeScript v5.3** (Type Safety): Adds static type checking to JavaScript, reducing runtime errors and improving developer productivity.
- **Node.js with Express.js v4.18** (Backend): A proven combination for building RESTful APIs, used by companies such as Netflix, Uber, and PayPal in production.
- **SQLite v5.1** (Database): An embedded relational database that requires zero configuration and stores all data in a single portable file. Capable of handling databases up to 281 terabytes.
- **Nodemailer v6.9** (Email): The standard Node.js library for SMTP email dispatch, supporting Gmail, Outlook, and custom SMTP servers.
- **Vite** (Build Tool): A next-generation frontend build tool that offers significantly faster development server startup and hot module replacement compared to alternatives.

All selected technologies have extensive documentation, active communities, and proven production track records. The development team has prior experience with the MERN/SERN stack, confirming technical competency. **Conclusion: Technically Feasible.**

#### 4.1.2 Operational Feasibility

The target users of Smart-Cruiter are HR professionals and job candidates.

- **HR Users:** HR professionals routinely use web-based tools (email clients, HRIS systems, job boards). A browser-based ATS with an intuitive glassmorphism UI requires minimal training. The system can be adopted without any software installation on user devices.
- **Candidates:** The candidate portal provides a simple, focused interface similar to email inboxes they already use daily. The application form follows standard web form conventions (text fields, dropdowns, submit buttons).
- **IT Requirements:** The system can be deployed on a single server (or even a laptop for demonstration). No specialised IT infrastructure or DevOps expertise is required for basic deployment.

**Conclusion: Operationally Feasible.**

#### 4.1.3 Economic Feasibility

| Cost Item | Amount (₹) |
|:----------|:-----------|
| Development Tools (VS Code, Git) | 0 (Open Source) |
| Framework & Libraries (React, Express, etc.) | 0 (Open Source) |
| Database (SQLite) | 0 (Embedded, No License) |
| Hosting for Demo (Local / Vercel Free Tier) | 0 |
| Domain Name (Optional) | ~800/year |
| SMTP Email Service (Gmail/Outlook) | 0 (Free Tier) |
| **Total Development Cost** | **~₹0 – ₹800** |

Compared to Workday (~₹8,00,000/month) or Greenhouse (~₹50,000/month), Smart-Cruiter offers **99.9% cost savings** by using open-source technologies and file-based database storage.

**Conclusion: Economically Feasible.**

#### 4.1.4 Schedule Feasibility

The project was planned over a 16-week development timeline:

| Phase | Duration | Activities |
|:------|:---------|:-----------|
| Requirements & Design | Weeks 1–3 | Stakeholder analysis, SRS, system design |
| Backend Development | Weeks 4–7 | Database, API routes, email service |
| Frontend Development | Weeks 8–12 | UI components, pages, state management |
| Integration & Testing | Weeks 13–15 | API integration, testing, bug fixes |
| Documentation & Deployment | Week 16 | Report writing, Vercel deployment |

**Conclusion: Feasible within the academic timeline.**

### 4.2 Functional Requirements (IEEE 830 Standard)

The following functional requirements have been documented in accordance with the IEEE 830 Software Requirements Specification standard:

**Table 4.1: Functional Requirements**

| FR ID | Requirement Title | Description | Priority |
|:------|:-----------------|:------------|:---------|
| FR-01 | Job Lifecycle Management | HR administrators shall be able to create, view, edit, and delete job postings. Each job shall contain fields for title, department, location, type (full-time/part-time/contract), description, requirements, and status (open/closed/draft). | High |
| FR-02 | Job Listing (Public) | The system shall provide a publicly accessible career page listing all jobs with status "open". Users can view detailed descriptions without authentication. | High |
| FR-03 | Online Job Application | Candidates shall be able to apply for open jobs by submitting a form with first name, last name, email, phone, resume URL, and cover letter. The system shall validate required fields and email format. | High |
| FR-04 | Applicant Pipeline Management | HR administrators shall be able to view all applicants and update their pipeline stage. Supported stages: Applied, Shortlisted, Recommended, Hired, Declined, Withdrawn. Bulk stage updates shall be supported. | High |
| FR-05 | Automated Email Notifications | Upon every pipeline stage transition (shortlist, offer, accept, reject), the system shall automatically send a personalised HTML email to the candidate's registered email address. | High |
| FR-06 | Offer Generation and Dispatch | HR shall be able to send job offers containing salary, joining date, notes, and terms/rules. The offer shall be emailed and stored in the candidate's portal. | High |
| FR-07 | Candidate Offer Response | Candidates shall be able to Accept or Decline offers through their portal. The response shall update the pipeline stage (Hired or Declined) and notify the system. | High |
| FR-08 | Dual-Portal Authentication | The system shall support two roles: HR (Admin) and Candidate (Applicant). Each role shall have a separate portal with distinct navigation and access controls. | High |
| FR-09 | Candidate Notification Inbox | Candidates shall have a real-time notification inbox displaying all communications from the system, including status updates, offer letters, and warnings. | Medium |
| FR-10 | Interview Management | HR shall be able to schedule interviews with details including date/time, type (online/in-person/phone), meeting link, and notes. Interviews can be updated or cancelled. | Medium |
| FR-11 | Employee Management | Upon hiring, candidate records shall be convertible to employee records. Employees can be activated or deactivated. | Medium |
| FR-12 | Immutable Audit Trail | Every HR decision (accept, reject, deactivate) shall be logged in the `application_history` table with name, email, job title, status, reason, and timestamp. | High |
| FR-13 | Analytics Dashboard | The HR dashboard shall display cards showing total jobs, open postings, total candidates, new candidates (30 days), and scheduled interviews. A bar chart shall show applicants per job. | Medium |
| FR-14 | Resume Match Score | The system shall compare job description keywords with applicant resume content and generate a match percentage. | Low |
| FR-15 | Duplicate Detection | The system shall detect and flag applicants with duplicate email addresses or identical resume content across multiple applications. | Medium |
| FR-16 | Exportable Reports | HR shall be able to export data as CSV or PDF. Report types: Applicant Database, Active Employees, Application Decisions, Login Activity. | Medium |
| FR-17 | Bulk Email Actions | HR shall be able to send bulk acceptance, rejection, duplicate warning, and identity mismatch warning emails to selected candidates. | Medium |
| FR-18 | Recent Activity Feed | The HR dashboard shall display a feed of recent actions (accepts, rejects, interviews, merges) with timestamps and user attribution. | Low |
| FR-19 | Job Closure Notification | When a job posting is deleted, all applicants for that job shall receive an automated email informing them that the position is no longer available. | Medium |
| FR-20 | Session Management | User sessions shall be managed via localStorage with login/logout timestamps. Login history shall be maintained for audit purposes. | Medium |

### 4.3 Non-Functional Requirements

**Table 4.2: Non-Functional Requirements**

| NFR ID | Category | Requirement | Target |
|:-------|:---------|:------------|:-------|
| NFR-01 | Performance | Core API endpoints shall respond within 500 milliseconds under normal load. | < 500ms |
| NFR-02 | Performance | The candidate notification inbox shall refresh within 3 seconds to deliver near-real-time updates. | < 3 seconds |
| NFR-03 | Security | All database queries shall use parameterised statements to prevent SQL injection attacks. | 100% compliance |
| NFR-04 | Security | Email credentials (SMTP passwords) shall be stored in environment variables (.env files), never hardcoded in source code. | 100% compliance |
| NFR-05 | Security | Role-Based Access Control shall ensure that HR routes are inaccessible to candidate users and vice versa. | Enforced at component level |
| NFR-06 | Usability | The UI shall follow the Glassmorphism design system with frosted glass effects, providing a premium, modern aesthetic. | All pages |
| NFR-07 | Usability | The application shall be responsive and functional on screen widths from 375px (mobile) to 1920px (desktop). | Responsive layout |
| NFR-08 | Scalability | The database schema shall support up to 10,000 applicant records without performance degradation. | 10,000 records |
| NFR-09 | Reliability | The system shall handle database connection failures gracefully, returning appropriate error messages rather than crashing. | Error handling on all routes |
| NFR-10 | Portability | The system shall be deployable on Windows, macOS, and Linux environments without modification. | Cross-platform |
| NFR-11 | Maintainability | The codebase shall use TypeScript for both frontend and backend, ensuring type safety and reducing runtime errors. | TypeScript throughout |
| NFR-12 | Availability | The system shall support deployment on Vercel serverless platform for production hosting with automatic scaling. | Vercel-compatible |

### 4.4 Hardware Requirements

**Table 4.3: Minimum Hardware Requirements**

| Component | Minimum Requirement | Recommended |
|:----------|:-------------------|:------------|
| Processor | Dual-Core 2.0 GHz (Intel i3 / Apple M1) | Quad-Core 2.5 GHz (Intel i5 / Apple M2) |
| Memory (RAM) | 8 GB | 16 GB |
| Disk Space | 500 MB (project files + SQLite database) | 1 GB |
| Display | 1366 × 768 resolution | 1920 × 1080 resolution |
| Network | Broadband internet (for email dispatch) | 10 Mbps or higher |

### 4.5 Software Requirements

**Table 4.4: Software Requirements and Versions**

| Software | Version | Purpose |
|:---------|:--------|:--------|
| Node.js | v18.0.0 or higher | JavaScript runtime for backend |
| NPM | v9.0.0 or higher | Package manager |
| TypeScript | v5.3.3 | Static type checking |
| React.js | v18.x | Frontend UI library |
| Vite | v5.x | Frontend build tool and dev server |
| Express.js | v4.18.2 | Backend web framework |
| SQLite3 | v5.1.6 | Embedded relational database |
| Nodemailer | v6.9.7 | Email dispatch library |
| Axios | Latest | HTTP client for API calls |
| React Router | v6.x | Client-side routing |
| Recharts | Latest | Chart/data visualisation library |
| Lucide React | Latest | Icon library |
| date-fns | v2.30.0 | Date formatting utility |
| UUID | v9.0.1 | Unique identifier generation |
| Git | v2.x | Version control |
| VS Code | Latest | Development IDE (recommended) |
| Chrome / Firefox | Latest | Web browser (must support CSS backdrop-filter) |

### 4.6 Technology Stack Justification

**Table 4.5: Technology Stack Comparison**

| Layer | Chosen Technology | Alternative Considered | Reason for Choice |
|:------|:-----------------|:----------------------|:------------------|
| Frontend Framework | React.js | Angular, Vue.js | Largest ecosystem, component model suits modular ATS design, hooks simplify state management |
| Language | TypeScript | JavaScript | Type safety reduces bugs, improved IDE support, better documentation for team collaboration |
| Build Tool | Vite | Webpack, Create React App | Significantly faster cold start and HMR; modern ESM-based architecture |
| Backend Framework | Express.js | Fastify, NestJS | Minimalist, unopinionated, vast middleware ecosystem, proven at scale |
| Database | SQLite | PostgreSQL, MongoDB | Zero configuration, portable single-file storage, ideal for demo/SME deployment |
| Email | Nodemailer | SendGrid, SES | Open source, zero API cost, supports any SMTP server |
| Hosting | Vercel | AWS, Heroku | Free tier, zero-config deployment, automatic HTTPS |
| State Management | React Context | Redux, Zustand | Sufficient for app complexity, avoids additional dependency |

---

*End of Part 1 — Pages 1 to 20*
*Continue with REPORT_PART_2.md for Chapters 5 through 8.*

