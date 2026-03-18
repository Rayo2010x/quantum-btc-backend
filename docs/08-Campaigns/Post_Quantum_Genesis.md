# Campaign: Quantum Genesis (Post-Quantum BTC Registry)

> **ID:** Post_Quantum_Genesis
> **Version:** 1.1 (Unified History & Rank Relocation)
> **Date:** 2026-03-17
> **Status:** STRATEGIC_ALIGNMENT_APPROVED

## 1. The Hook: "Build the Post-Quantum Citadel"

The Quantum Threat isn't just a prediction; it's a countdown. At Quantum BTC, we aren't just HODLing; we are fortifying. We invite our early contributors to join the **Quantum Genesis** registry.

**Message:** "Initialize your session, contribute entropy to our stress-test protocols, and secure your place in the first generation of Post-Quantum Bitcoin rewards."

## 2. Campaign Mechanics

### 2.1 The Post-Quantum Registry
To ensure contributors are recognized and progress is preserved:
- **Registry Prompt:** Upon session initialization, the frontend will check if the `Session ID` has an associated address. If not, a subtle non-intrusive banner will offer to "Register for PQ-Rewards".
- **Contribution Aggregation:** Users can link different sessions to the same **Sovereign Address (L1 or LN)**. The system will aggregate the **Stress-Test Volume (STV)** across all sessions linked to that specific address.
- **Privacy First:** Users are informed that linking a session associates their interaction history with the provided address. No KYC, no email—just cryptographic proof of participation.
- **Sovereignty Tip:** We recommend using a Layer 1 (On-Chain) address for the registry if you intend to hold your rewards for the long term (The Vault), while utilizing your LN wallet for the stress-test itself (The Pocket).

### 2.2 Contribution Tiers (Research Status)
Recognition is based on the total entropy volume (Satoshis) processed through the protocol during your tests. Higher volume represents more critical data for our stress-testing protocols.

| Status | Contribution (Total Sats) | Reward Potential | Status |
| :--- | :--- | :--- | :--- |
| **Quantum Scout** | 1,000 - 10,000 | Genesis Badge + Priority PQ-Airdrop | Active |
| **Sentinel** | 10,001 - 100,000 | Sentinel Badge + 1.5x Research Multiplier | Active |
| **Guardian** | 100,001+ | Genesis Guardian Rank + Early Node Access | Active |

## 3. Technical Implementation

### 3.1 Backend Requirement
A new table `reward_registrations` will store the mapping:
- `session_id`: Unique identifier from the browser.
- `reward_address`: User-provided Sovereign Address (BTC L1 or LN).
- **Aggregated Calculation:** The system will calculate the `total_contributed_sats` by summing `amount_sat` for **all sessions** registered under the same `reward_address`.

### 3.2 Security & Verification
- **Anti-Sybil:** System monitors session initialization metadata to ensure authentic research data.
- **Rank Verification:** The total volume (STV) and Tier status are visualized at the top of the "Verify & History" tab.
- **Unified History:** For registered sessions, the bet history is unified across all sessions sharing the same `reward_address` (limited to the last 20 bets to optimize performance while accepting a minor information disclosure risk for UX simplicity).
- **Hash Auditing:** Individual validation of Provably Fair hashes for each bet is done in the "Verify & History" tab.

## 4. FAQ (The Strategy)

**Q: What exactly is a "Post-Quantum Bitcoin"?**
A: It is a cryptographic claim on our development fund. As we deploy our Post-Quantum protocols, these rewards represent your status as an early protector of the network.

**Q: Do I lose my sats by contributing?**
A: No. You are interacting with the Lightning Network protocol as part of the stress-test. Your "contribution" is the volume of satoshis you process, regardless of individual settlement outcomes.

**Q: Why do I need to register?**
A: Without registration, your research contribution is ephemeral. Registration locks your STV to your Sovereign Address, ensuring recognition and rewards when the Post-Quantum transition begins.

**Q: Should I use an L1 or LN address?**
A: For day-to-day interaction, LN is faster. However, for a registry that marks your place in history (and rewards), we suggest using an address from your "Vault" (Cold Storage/L1) as it is the most permanent identity in the Bitcoin ecosystem.
