
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

&nbsp;

---

## ABSTRACT

Recruitment is a mission-critical function in every organisation, yet the processes that underpin it are frequently manual, inconsistent, and opaque for candidates. This project presents **Smart-Cruiter**, a full-stack **Automated Applicant Tracking System (ATS)** engineered to digitalise and automate the entire employee acquisition lifecycle — from vacancy publication to offer acceptance.

The system is built upon a three-tier web architecture utilising **React.js (v18)** for a responsive and dynamic client interface, **Node.js** with the **Express.js** framework for a RESTful API backend, and **SQLite** as an embedded, portable relational database engine. The key modules delivered include: a **Job Management Engine** enabling HR administrators to create, publish, and archive vacancies; an **Applicant Pipeline Manager** that tracks candidates across the stages of *Applied → Shortlisted → Interviewed → Offered → Hired/Rejected*; an **Automated Communication Centre** that dispatches personalised HTML-formatted emails via the **Nodemailer SMTP** library upon every pipeline stage transition; and a **Candidate Self-Service Dashboard** where job-seekers can view their real-time application status and respond to job offers electronically.

The system further incorporates an immutable **Audit Trail** that logs every HR decision with a timestamp and rationale, providing complete accountability and enabling post-hoc review. A **Glassmorphism-styled** user interface, adhering to modern UX principles, ensures a premium and accessible experience across all device sizes. Security is enforced through parameterised SQL queries, environment-variable credential management, and role-based access control implemented at the middleware level.

Testing was conducted using an Incremental Integration approach. The system successfully passed all defined test cases, demonstrating correct status transitions, real-time notification delivery (within 3 seconds), and a 100% pass rate for core functional requirements. The project validates that open-source, lightweight technologies can be combined to deliver enterprise-grade HR functionality at near-zero infrastructure cost — making Smart-Cruiter a compelling, scalable alternative to costly proprietary systems such as Workday and Greenhouse.

**Keywords:** *Applicant Tracking System (ATS), Recruitment Automation, React.js, Node.js, Express.js, SQLite, Nodemailer, RESTful API, Glassmorphism, Role-Based Access Control, Human Resource Management (HRM), Full-Stack Web Development.*

---

&nbsp;

---

## TABLE OF CONTENTS

| Chapter No. | Title | Page No. |
|:-----------:|:------|:--------:|
| | **ABSTRACT** | i |
| | **TABLE OF CONTENTS** | ii |
| | **LIST OF FIGURES** | iii |
| | **LIST OF TABLES** | iv |
| **1** | **INTRODUCTION** | 1 |
| | 1.1 Overview | 1 |
| | 1.2 Problem Statement | 2 |
| | 1.3 Motivation | 3 |
| | 1.4 Objectives | 3 |
| | 1.5 Project Scope | 4 |
| | 1.6 Organisation of the Report | 4 |
| **2** | **LITERATURE SURVEY** | 5 |
| | 2.1 Evolution of Recruitment Systems | 5 |
| | 2.2 Study of Existing Systems | 6 |
| | 2.3 Analysis of Current Limitations | 7 |
| | 2.4 Gaps Identified for Smart-Cruiter | 8 |
| **3** | **SYSTEM ANALYSIS (SOFTWARE REQUIREMENTS SPECIFICATION)** | 9 |
| | 3.1 Feasibility Study | 9 |
| | &nbsp;&nbsp;&nbsp;&nbsp;3.1.1 Technical Feasibility | 9 |
| | &nbsp;&nbsp;&nbsp;&nbsp;3.1.2 Operational Feasibility | 10 |
| | &nbsp;&nbsp;&nbsp;&nbsp;3.1.3 Economic Feasibility | 10 |
| | 3.2 Functional Requirements (IEEE Standards) | 11 |
| | 3.3 Non-Functional Requirements | 12 |
| | 3.4 Hardware Requirements | 13 |
| | 3.5 Software Requirements | 13 |
| **4** | **SYSTEM DESIGN** | 14 |
| | 4.1 High-Level System Architecture | 14 |
| | 4.2 Database Design & Schema | 15 |
| | &nbsp;&nbsp;&nbsp;&nbsp;4.2.1 Entity Relationship Diagram (ERD) | 15 |
| | &nbsp;&nbsp;&nbsp;&nbsp;4.2.2 Data Dictionary | 16 |
| | 4.3 Data Flow Diagrams (DFD) | 17 |
| | &nbsp;&nbsp;&nbsp;&nbsp;4.3.1 DFD Level 0 – Context Diagram | 17 |
| | &nbsp;&nbsp;&nbsp;&nbsp;4.3.2 DFD Level 1 – Process Breakdown | 18 |
| | 4.4 UML Diagrams | 19 |
| | &nbsp;&nbsp;&nbsp;&nbsp;4.4.1 Use Case Diagram | 19 |
| | &nbsp;&nbsp;&nbsp;&nbsp;4.4.2 Sequence Diagram | 20 |
| | 4.5 Deployment Diagram | 21 |
| **5** | **SYSTEM IMPLEMENTATION AND CODING** | 22 |
| | 5.1 Recruitment Workflow Logic | 22 |
| | 5.2 Front-End Development (React & Hooks) | 23 |
| | 5.3 Back-End Development (Node.js & Express.js) | 25 |
| | 5.4 Communication Engine (Nodemailer & SMTP) | 27 |
| | 5.5 Security Implementation | 28 |
| **6** | **TESTING AND QUALITY ASSURANCE** | 30 |
| | 6.1 Testing Methodology | 30 |
| | 6.2 Unit Testing | 31 |
| | 6.3 Integration Testing | 32 |
| | 6.4 Detailed Test Case Tables (TC01 – TC07) | 33 |
| **7** | **RESULTS AND USER INTERFACE** | 35 |
| | 7.1 UI/UX Design Philosophy (Glassmorphism) | 35 |
| | 7.2 HR Portal Screens | 36 |
| | 7.3 Candidate Portal Screens | 37 |
| | 7.4 Analytics Highlights | 38 |
| **8** | **USER MANUAL & OPERATIONS GUIDE** | 39 |
| | 8.1 HR / Admin Operations | 39 |
| | 8.2 Candidate Operations | 40 |
| | 8.3 Installation & Deployment Guide | 41 |
| **9** | **CONCLUSION AND FUTURE SCOPE** | 43 |
| | 9.1 Summary of Work | 43 |
| | 9.2 Limitations | 44 |
| | 9.3 Future Enhancements | 44 |
| | 9.4 Strategic Business Impact | 45 |
| | **REFERENCES / BIBLIOGRAPHY** | 46 |
| | **APPENDIX A – Project Directory Structure** | 47 |
| | **APPENDIX B – Core Code Snippets** | 48 |
| | **APPENDIX C – Glossary of Terms & Abbreviations** | 50 |

---

&nbsp;

---

## LIST OF FIGURES

| Figure No. | Title | Page No. |
|:----------:|:------|:--------:|
| Figure 4.1 | High-Level Three-Tier System Architecture Diagram | 14 |
| Figure 4.2 | Entity Relationship Diagram (ERD) of the Smart-Cruiter Database | 15 |
| Figure 4.3 | DFD Level 0 – System Context Diagram | 17 |
| Figure 4.4 | DFD Level 1 – Detailed Data Flow Diagram | 18 |
| Figure 4.5 | Use Case Diagram – HR Admin and Candidate Roles | 19 |
| Figure 4.6 | Sequence Diagram – Application Submission and Status Update Flow | 20 |
| Figure 4.7 | Sequence Diagram – Job Offer Dispatch and Candidate Response Flow | 20 |
| Figure 4.8 | Deployment Diagram – Node and Software Configuration | 21 |
| Figure 5.1 | Recruitment Pipeline State-Transition Workflow Flowchart | 22 |
| Figure 5.2 | Security Architecture and Middleware Layer Illustration | 28 |
| Figure 7.1 | Smart-Cruiter Landing Page and HR Portal UI Mockup | 35 |

---

&nbsp;

---

## LIST OF TABLES

| Table No. | Title | Page No. |
|:---------:|:------|:--------:|
| Table 3.1 | Functional Requirements as per IEEE Standards | 11 |
| Table 3.2 | Non-Functional Requirements | 12 |
| Table 3.3 | Minimum Hardware Requirements | 13 |
| Table 3.4 | Software Requirements and Versions | 13 |
| Table 4.1 | Data Dictionary – Database Tables and Attributes | 16 |
| Table 6.1 | Test Case Table – TC01 to TC07 (Core Functional Tests) | 33 |

---

&nbsp;
