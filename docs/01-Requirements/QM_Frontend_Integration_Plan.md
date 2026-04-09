# Frontend V1.0 Premium Integration Plan

> **ID:** QM_Frontend_Integration_Plan
> **Version:** 1.1
> **Last Updated:** 2026-04-08
> **Status:** APPROVED

The MVP Backend is completed and protected. Focus now shifts 100% to User Experience (UI/UX) and connecting the new server defenses with the client view.

Based on the `QM_UI_UX_Guidelines.md` document and our `QM_Backlog.md`, this is the tactical plan for Phase 2 (Frontend):

## 1. Logic and Defenses Integration (Backend Connection)
The frontend must react elegantly to the new rules we implemented:
* **Exposure Limit Handling (HTTP 400):** Catch the error when a bet exceeds 2% of the dynamic Bankroll and display a *Toast* or Premium visual alert explaining the maximum payout limit to the player, instead of a generic technical error.
* **Bankruptcy / Maintenance Handling (HTTP 503):** If the server enters Red Alert (< 20k Sats), the UI must lock betting controls (disable buttons) and display an *Overlay* or Banner (e.g., "Liquidity Maintenance System").
* **WebSockets Synchronization:** Ensure the roulette animation and *Provably Fair* results land smoothly on the UI without post-payment desynchronization.

## 2. Aesthetic Refinement (Premium UI/UX)
Following the "Anti-Generic" guidelines:
* **Palette and Theme:** Ensure a cohesive Dark Mode, avoiding browser default colors. Use vibrant accent colors (e.g., subtle neons) contrasted with deep, legible dark backgrounds.
* **Deliberate Typography:** Implement a distinctive Display font for balances/prizes (e.g., *Outfit*, *Space Grotesk*, or *Orbitron* for a cyber/quantum vibe) and a refined reading font.
* **Micro-interactions and Flow:** 
    * Smooth transitions when displaying deposit and withdrawal QR codes (LNURL).
    * Interactive *Hover* states on the betting mat.
    * Subtle _Glassmorphism_ on modals and cards to provide depth.

## 3. Frontend Security (Secure by Design)
* **Sanitization:** Validate local inputs.
* **Armored Error Handling:** Avoid printing raw API errors in the interface, translating them into friendly messages for the end user.

## 4. Work Structuring (Atomic Execution)
To kickstart development, provide the agent with the following structure:
1. **Step A:** Visual audit of the current frontend state (spin up frontend and map design debt).
2. **Step B:** Injection of Premium typography, colors, and Base interactions (CSS / Tailwind).
3. **Step C:** Connection of HTTP Error States (Betting Limits) and end-to-end experience testing.
