# Project Backlog & Roadmap

> **ID:** QM_Backlog
> **Version:** 1.3
> **Last Updated:** 2026-04-08
> **Status:** APPROVED

This document centralizes the technical pending tasks, technical debt, and roadmap for the QuantumBTC project.

## 1. Backend Core (v0.1.0)
- [x] **Initial Setup:** Configured server, DB, and environment (Completed).
- [x] **Betting Logic:** European Roulette MVP (Completed).
- [x] **ANU QRNG Integration:** Quantum entropy worker (Completed - Prod Fix 2026-02-04).
- [x] **`drand` Integration:** Added public randomness beacon for temporal auditing (Completed - 2026-03-02).
- [x] **Websockets:** Real-time notifications for the frontend (Completed).
- [x] **Risk & Bankroll Management:** Dynamic betting limit, OpenNode monitoring, and liquidity alerts (Completed - 2026-03-03).

## 2. Frontend (v0.1.0)
- [x] **Initialization:** Setup Next.js/React + Vite (Completed).
- [x] **UI Design:** Implement "Premium" interface (Functional MVP with BetControls).
- [x] **LNURL Integration:** Display withdrawal QRs (Completed).
- [x] **Roulette Animation:** Visual result representation (Completed - Verified in Prod).

## 3. QA & Testing
- [x] **Smoke Tests:** Basic full-flow scripts (Verified Locally with `auto_simulate.ts`).
- [x] **Load Testing:** Load tests for Entropy Worker (Completed - 2026-03-02, performance finding detected and resolving).
- [x] **Security Audit:** Dependencies and secrets review (Completed - 2026-03-02).

## 4. Documentation
- [x] **Complete DRAFTs:** Finalize Architecture and Security documents (Completed v1.1).
- [x] **API Registry:** Document final endpoints with Request/Response examples (Completed in API Spec v1.1).

## 5. Technical Debt
- [x] **Cleanup Debug Routes:** Remove `/admin/debug/routes`, `/admin/debug/requests`, and detailed logs in `lnurl.ts`.
- [x] **Cleanup Scripts:** Remove manual test scripts (`manual_withdrawal_qr.ts`, `debug_opennode.ts`) from the main branch.

## 6. Security & Critical Fixes
- [x] **LNURL-Withdraw Amount Validation (HIGH):** Validate that the invoice amount (`pr`) received in the callback DOES NOT exceed the amount authorized in `withdrawal_tokens`. Prevents theft via inflated invoices.
- [x] **LNURL-Withdraw Expiration Check (HIGH):** Implement `metrics.expires_at > NOW()` validation in step 2 (Callback/Payment) as well, not just step 1.

## 8. Post-Release & Maintenance (Pending)
- [x] **Frontend VITE_API_URL:** Remember to switch `API_URL` in `frontend/src/lib/api.ts` back to Production (Railway) or configure real environment variables in Vercel before the next deployment.

## 7. Compliance & Geo-Blocking
- [x] **IP Tracking & Audit:** Record `ip_address` on session creation (POST `/session/init`) and remove redundant `updated_at` column.
- [x] **Geo-Blocking (US/EU):** Implement middleware to block access from IPs in the United States and European Union.
    - Use a local library (e.g., `fast-geoip`) to minimize latency.
    - Return `403 Forbidden` with message "Service Not Available in your Region".
- [x] **Geo-Blocking Logging (Medium):** Permanently record the blocked IP in Supabase (evaluate whether to create a new `geo_block_logs` table or add a boolean flag to the sessions table) to maintain audit consistency (Completed - 2026-03-03).
- [x] **Geo-Blocking UX Fix (Medium):** Review execution order and logic (e.g., CORS vs GeoBlock) to ensure the *"403 Access Denied / Service not available in your region"* error takes precedence and reaches the frontend correctly, preventing it from crashing prematurely and showing a generic "Network Error".

## 9. Next Steps (Geo-Blocking & Traceability) - Completed
- [x] **Regional Restriction Extension (UK):** Include `GB` (United Kingdom) in the list of blocked countries by the `geoBlock.ts` middleware to comply with post-Brexit local regulations.
- [x] **Geographic Traceability in Sessions:**
    - Modify the `public.sessions` table to add the `country` column (varchar).
    - Update the `/session/init` logic so that upon recording the IP, the country code is also captured and stored as it is in the `public.geo_block_logs` table.

## 10. Campaigns & Rewards (Completed)
- [x] **"Quantum Genesis" Implementation:** Execute post-quantum rewards registration according to `QM_Post_Quantum_Genesis.md`.
    - **Backend (DB):** Create `reward_registrations` table (`session_id` UNIQUE, `reward_address` NOT NULL).
    - **API Logic:**
        - Implement `POST /v1/campaign/register` with address validation (RegEx for BTC L1 and Lightning Address).
        - Implement `/v1/campaign/check?sessionId=...` to return registration status and aggregated volume (STV) by address.
    - **Frontend (UX):**
        - Initialization hook to detect unregistered sessions and trigger the invitation banner.
        - Registration modal with privacy warning.
        - "Investigator Status" indicator (Sovereign Rank) in the Statistics/Audit tab and FAQ based on STV Tiers.

## 11. Donations (Completed)
- [x] **Donations Implementation:** Give the user the possibility to donate to the platform.
    - **Backend (DB):** Create `donations` table with: `id`, `amount_sat`, `address`, `created_at`.
    - **Frontend (UX):**
        - At the end of the "White Paper" tab, after "Regulatory Notice", add a "Donate to the project" button opening a modal with a donation QR.
        - The user must have the option to register their Bitcoin or LN address (same as `reward_address`).

## 12. Statistics for Geo-Blocked IPs (Completed)
- [x] **Access to "Statistics" tab for Geo-Blocked IPs:** Allow users to access the "Statistics" tab even if their IP is blocked.
