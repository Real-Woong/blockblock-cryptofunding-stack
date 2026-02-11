# Architecture

This repository contains a full-stack crypto crowdfunding platform built on **Sui**.

## Components

- **Smart Contract (Sui Move)**
  - Defines core on-chain objects and entry functions for:
    - Project creation / update
    - Funding contributions
    - State transitions and validations
  - Located under: `CF-Contract/` (Move package)

- **Backend API (Node.js)**
  - Provides REST API used by the frontend.
  - Responsible for:
    - DB persistence (PostgreSQL via Prisma)
    - Business logic layer (controllers/services/repositories)
    - (Optional/Planned) on-chain sync / digest handling for indexing
    - File upload handling (runtime artifacts; not committed)
  - Located under: (backend root project folder)

- **Frontend (React + Vite + TS)**
  - User-facing web app.
  - Responsible for:
    - Wallet connection and transaction flow UI
    - Project browse/detail/manage pages
    - API integration with backend
  - Located under: `CF-FE/`

## High-level Data Flow

1. **User** interacts with the **Frontend**.
2. For on-chain actions:
   - Frontend builds Sui transactions and signs via wallet.
   - Contract validates and updates on-chain state.
3. For off-chain data and indexing:
   - Frontend calls **Backend API**.
   - Backend reads/writes **PostgreSQL** (Prisma).
4. Screenshots of key pages are stored in:
   - `docs/screenshots/`

## Pages (Frontend)

- LandingPage
- ExplorePage
- ProjectDetailPage
- ProjectManagePage
- FundingFullPage
- StartProjectWizard
- UserPage

## Notes

- Secrets/keys are **never committed**. See `docs/infra-notes.md` for environment setup and operational notes.
