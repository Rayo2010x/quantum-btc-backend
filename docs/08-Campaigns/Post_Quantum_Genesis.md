# Campaign: Quantum Genesis (Post-Quantum BTC Registry)

> **ID:** Post_Quantum_Genesis
> **Version:** 1.2 (FAQ Strategic Overhaul)
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

**Q: What exactly are the "Post-Quantum Rewards"?**
A: They are verifiable cryptographic claims recognizing your role as an early protector of the network. As we finalize and deploy our Post-Quantum protocols, you aren't just earning a badge—you are securing prioritized access to our proprietary tools, early node deployments, and targeted airdrops from our development fund. Your rank dictates your standing in the new Citadel.

**Q: How do I contribute?**
A: Your standing is measured strictly by your **Stress-Test Volume (STV)**—the total throughput of Satoshis you route through our Lightning infrastructure. Whether you end your session with massive profits or take a loss, every single satoshi processed generates vital entropy and pushes our nodes to their limits. You are rewarded for the velocity and volume of your interactions, never for your losses.

**Q: If the protocol is provably fair and anonymous, why must I register an address?**
A: Unregistered sessions generate ephemeral entropy. Once your browser clears or your session expires, your cryptographic proof of work vanishes. The **Quantum Genesis Registry** permanently anchors your accumulated STV to a Sovereign Address of your choosing. This ensures your legacy, rank, and future rewards are preserved immutably across devices and time.

**Q: Should I secure my rank using a Layer 1 (On-Chain) or a Lightning Network (LN) address?**
A: While the entire stress-testing protocol operates at lightning speed on Layer 2, the Registry defines your historically permanent identity. For this reason, we highly recommend anchoring your session to a **Layer 1 "Vault" address** (ideally from cold storage). It is the most robust and indisputable cryptographic identity in the Bitcoin ecosystem with which to claim your future Genesis rewards.
