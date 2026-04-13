\# Event Registration System - Backend API



A complete backend API for an event registration system built with Node.js, Express, and PostgreSQL.



\## 🚀 Features



\- \*\*User Management\*\*: Registration and authentication

\- \*\*Event Management\*\*: Create, read, update, delete events

\- \*\*Cart System\*\*: Add/remove events before checkout

\- \*\*Payment Simulation\*\*: Mock payment processing

\- \*\*Admin Dashboard\*\*: Event statistics and management

\- \*\*PL/pgSQL Implementation\*\*: Functions, procedures, triggers, cursors



\## 📋 Business Rules



\- ✅ Maximum 3 registrations per user

\- ✅ No time conflicts between events

\- ✅ Seats allocated only after successful payment

\- ✅ 50% rule - can exceed limit if event is less than half full

\- ✅ No duplicate registrations



\## 🛠️ Tech Stack



\- \*\*Runtime\*\*: Node.js

\- \*\*Framework\*\*: Express.js

\- \*\*Database\*\*: PostgreSQL 17

\- \*\*PL/SQL\*\*: PL/pgSQL (Functions, Procedures, Triggers, Cursors)



\## 📊 Database Schema



| Table | Purpose |

|-------|---------|

| users | User information |

| events | Event details |

| registrations | User-event registrations |

| cart | Temporary cart items |

| registration\_audit | Audit log for registrations |



\## 🔧 Installation



\### Prerequisites

\- Node.js (v16+)

\- PostgreSQL (v14+)



\### Steps



1\. Clone the repository

```bash

git clone https://github.com/Devika-101/event-registration-backend.git

cd event-registration-backend

