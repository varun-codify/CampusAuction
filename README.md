# 🎓 Campus Auction Platform

> A production-minded, responsive campus marketplace where verified students list items for auction, compete through transparent real-time bidding with anti-sniping protection, and complete transactions through verified physical campus handovers.

---

## ⚡ Quick Start (Run Locally in 60 Seconds)

### Prerequisites
- **Node.js**: v18+ (tested on Node v22 and v24)
- **npm**: v9+
- Zero external database required to start (automatically boots embedded local PostgreSQL via PGlite, or connects to external PostgreSQL / Supabase if `DATABASE_URL` is configured in `.env`).

### 1. Installation
```bash
# Clone the repository and install dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Run Local Development Server
```bash
# Concurrently runs both the Express + Socket.IO backend (port 5000) and the React + Vite frontend (port 5173)
npm run dev
```

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

### 3. Run Test Suite
```bash
npm run test
```
Runs the automated Vitest suite verifying the transactional bidding engine, minimum bid boundaries, anti-sniping 30s/60s extensions, seller restrictions, and idempotent closing lifecycle.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Rationale & Responsibility |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS | Modular, responsive SPA supporting laptop and mobile views. Faithfully implements Google Stitch design tokens (Indigo `#4338ca`, Plus Jakarta Sans, JetBrains Mono, bento cards). |
| **Backend** | Node.js, Express, TypeScript | Authoritative server, REST API, request validation, transaction isolation. |
| **Database & ORM** | PostgreSQL (PGlite embedded fallback / Supabase PostgreSQL) + Drizzle ORM | 100% ACID transaction guarantees, row serialization, reproducible schema. |
| **Real-time Sync** | Socket.IO | Instant bid broadcast, clock extensions, and live outbid/seller alerts. |
| **Lifecycle Worker** | Node Background Worker (5s interval) | Authoritative idempotent finalization, provisional winner determination. |
| **AI Assistant** | Controlled Tool-Calling Engine | Student marketplace search, fair campus valuation, and anti-sniping rule explanations without bypassing authorization. |
| **Campus Handover** | 4-Digit PIN Physical Verification | Guarantees safe item inspection at campus landmarks before release. |

---

## ⚖️ Campus Auction Fair-Play Engine Rules

1. **Authoritative Minimum Bids**:
   - The first bid must equal or exceed the listing's **starting price**.
   - Subsequent bids must meet or exceed `currentLeadingPrice + minIncrement` (default ₹50).
2. **Anti-Sniping Clock Extension (Exact 30s / 60s Rule)**:
   - If any verified bid is placed within the **final 30 seconds** (`<= 30s`) before closing, the countdown automatically extends by **+60 seconds**.
   - Gives all student contenders a fair opportunity to react, rendering automated sniper bots ineffective.
3. **Seller Protection & Restrictions**:
   - Sellers are strictly prohibited from bidding on their own listings.
4. **Idempotent Auction Closing**:
   - When an auction closes, if no bids were received, it is marked **`UNSOLD`**.
   - If bids exist, the highest bidder is declared **`PROVISIONAL_WINNER`** and the status transitions to **`PENDING_SELLER_DECISION`**.
5. **Seller Approval & Reserve Handover**:
   - The seller reviews the final bid and selects **Approve** (transitions to **`RESERVED`**) or **Reject** with a recorded reason.
6. **Campus Handover Verification**:
   - Physical handover takes place at designated campus hubs (e.g. *Central Library Steps* or *Hostel Gate*).
   - The winner receives a private 4-digit PIN. Once the buyer inspects and receives the item in person, they hand the PIN to the seller to finalize the transaction (**`COMPLETED`**), which increments both students' peer trust scores (+1).

---

## 👥 Demo Student Test Accounts (One-Click Switcher)

An instant account switcher is built directly into the header avatar menu:

| Student Name | Roll / Student ID | Hostel Hall | Role | Typical Test Perspective |
|---|---|---|---|---|
| **Rohan Sharma** | `2021ME10482` | Nehru Hall | Student | Seller of Hero Sprint 26T Bicycle |
| **Ananya Patel** | `2022CS10214` | Sarojini Naidu Hall | Student | Active bidder & seller of Casio fx-991EX |
| **Vikram Das** | `2020EE10931` | Patel Hall | Student | Contending bidder |
| **Priya Kumari** | `2023AE10018` | Mother Teresa Hall | Student | Seller of Study Chair |
| **Proctor Verma** | `ADMIN-2024-PROCTOR` | Admin Office | Admin | Campus Moderator & Audit Log Viewer |

---

## 📂 Project Structure

```
├── client/                     # Frontend SPA (React + TypeScript + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Reusable Navbar, Sidebar, Layout containers
│   │   ├── context/            # AuthContext (session state, quick-switcher, real-time unread)
│   │   ├── pages/              # 15 Complete Screens (Marketplace, Details, Handover, Q&A, etc.)
│   │   ├── services/           # Typed API client & Socket.IO instance
│   │   └── index.css           # Stitch design tokens & scrollbars
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                     # Backend API & Lifecycle Engine (Node + Express + TypeScript)
│   ├── src/
│   │   ├── auth/               # JWT & Campus session middleware
│   │   ├── db/                 # Drizzle ORM schema, dual PostgreSQL/PGlite connection, seeder
│   │   ├── engine/             # Transactional Bidding Engine & Background Worker
│   │   ├── routes/             # REST endpoints (Auctions, Bids, Handover, Q&A, Users, AI)
│   │   ├── tests/              # Vitest automated test suite (7/7 passing)
│   │   └── index.ts            # Server entry point & Socket.IO channels
│   ├── package.json
│   └── tsconfig.json
├── shared/                     # Shared TypeScript types, enums, payloads
│   └── types.ts
├── screens/                    # Downloaded Stitch screens, screenshots, and metadata
├── index.html                  # Stitch visual gallery viewer
├── package.json                # Monorepo root scripts
└── README.md
```

---

## 🧪 Verification & Test Results

The backend bidding engine has been validated with automated test runs (`npx vitest run`):

```
✓ 1. Rejects a first bid below starting price
✓ 2. Accepts a valid first bid at or above starting price
✓ 3. Rejects subsequent bids that do not meet currentPrice + minIncrement
✓ 4. Rejects a bid from the seller on their own listing
✓ 5. Triggers anti-sniping extension when bid placed in final 30 seconds (+60s clock push)
✓ 6. Rejects bids after closing timestamp
✓ 7. Idempotently finalizes expired auction and designates Provisional Winner
```
**Test Files: 1 passed (1) | Tests: 7 passed (7)**
