# Bankroll Risk & Maximum Bet Strategy

> **ID:** QM_Bankroll_Risk_Analysis
> **Version:** 2.0
> **Last Updated:** 2026-05-14
> **Status:** APPROVED

## 1. The "Risk of Ruin" (RoR) Problem
Currently in the local system, the `MAX_BET_SATS` constant is roughly defined as `BANKROLL_FLOOR_SATS / 50` (**2%** of the Bankroll). 
For a roulette game (*straight* bets paying 36 times the wager), this represents an imminent mathematical risk of bankruptcy:
- **Current Bankroll:** 400,000 Sats
- **Current Maximum Allowed Bet:** 8,000 Sats (2%)
- **If the player wins:** They win 8,000 * 35 = **280,000 Sats.**
  
> [!CAUTION]
> This means the Casino (us) would lose **70% of its total liquidity** in a single lucky spin by a user! Two users winning simultaneously would irremediably bankrupt the house and the platform couldn't honor LNURL withdrawals, destroying its reputation and trust in the Provably Fair model.

## 2. Statistical Analysis (The Casino Kelly Criterion)

To mitigate the bankruptcy risk (Risk of Ruin) to statistically irrelevant values (< 1%), modern casinos apply formulas derived from Variance and Mathematical Expectation.

* **Probability of House losing (Player wins):** $p_w = 1 / 37 \approx 2.7\%$
* **Probability of House winning (Player loses):** $p_l = 36 / 37 \approx 97.29\%$
* **House Edge:** $E = 2.70\%$

Using a derivation of the **Kelly Criterion for Casinos**, the maximum exposure (Maximum Payout) for a high volatility bet (Straight/36x) must never exceed between **1% and 3%** of the Total Available Bankroll, depending on corporate risk tolerance.

## 3. Proposed Strategy: "Dynamic Maximum Payout Limits"
Instead of flatly limiting *the bet*, we must limit the **exposure risk (Maximum Payout)**. This way we protect liquidity, whether it's for a *Straight (36x)* bet or *Red/Black (2x)* in the future.

### 3.1 Core Formula
For MVP purposes, we will set a strict tolerance: no individual bet should be able to drain more than **2% of the Bankroll**.

1. **Allowed Max Payout:** `Bankroll * 0.02`
   - Local example (400k): `400,000 * 0.02 = 8,000 liquid Sats`
2. **Bet Limiter (Max Bet):** `Allowed Max Payout / Bet Multiplier`
   - Example (Straight 36x): `8,000 / 35 = 228 Sats` maximum bet.

> [!TIP]
> If we integrate *Red/Black* bets in the future (2x multiplier), this same formula would allow the player to bet up to 8,000 Sats at once, since the negative impact on our treasury would still be confined to the 2% mathematical limit.

### 3.2 Multi-Run (Batch Betting) Exposure
With multi-run support (runsCount = 1, 2, 5, or 10), the worst-case exposure calculation remains mathematically equivalent to a single-run bet:

$$maxExposure = \frac{totalBet}{runsCount} \times maxMultiplier \times runsCount = totalBet \times maxMultiplier$$

The `runsCount` cancels itself. Therefore, **no additional multiplication is needed** in the bankroll protection formula — the existing check already covers multi-run bets correctly.

### 3.3 Plinko Maximum Multiplier Constraints
With configurable Plinko rows (8, 12, 16) and risk levels (low, medium, high), the maximum multiplier varies dramatically:

| Rows | Risk | Max Multiplier | Max Bet (400K bankroll, 2%) |
| :--- | :--- | :--- | :--- |
| 8 | Low | 5.6× | 1,428 sats |
| 8 | Medium | 14× | 571 sats |
| 8 | High | 29× | 275 sats |
| 12 | Low | 10× | 800 sats |
| 12 | Medium | 33× | 242 sats |
| 12 | High | 170× | 47 sats |
| 16 | Low | 16× | 500 sats |
| 16 | Medium | 110× | 72 sats |
| 16 | High | 1000× | **8 sats** |

> [!WARNING]
> **Plinko 16-row High Risk** has a 1000× max multiplier, resulting in a maximum allowed bet of only 8 sats. Combined with the minimum bet enforcement (5 sats × runsCount), multi-run configurations above 1 become impossible on this specific tier. This is an inherent constraint of offering extreme payouts under a conservative bankroll risk tolerance.

**Per-Run Rounding Strategy:** Per-run payouts are computed as precise floats. Only the aggregate total payout across all runs is floored (`Math.floor`) once at the end. This eliminates cumulative rounding losses that would unfairly penalize the player in high-run configurations.

## 4. Liquidity Monitoring and Bankruptcy Alerts (OpenNode)

For the 2% cross limit to be mathematically effective, the `Bankroll` variable cannot be static. It must reflect the live available liquidity in the OpenNode account.

### 4.1 Verification Frequency (Polling vs Webhooks)
* **Withdrawal-Based Webhook:** Every time the server processes and authorizes a withdrawal invoice payment (`withdrawal_token`), we know with absolute certainty that our liquidity has decreased (or increased in the case of deposits). Therefore, we will update the global variable (or Redis/Postgres cache) immediately in that flow.
* **Synchronization Polling (Suggested Frequency):** As a precaution against imbalances (extra on-chain OpenNode fees, surprise charges), I propose implementing an asynchronous `setInterval` that queries the OpenNode `GET /v1/account` endpoint every **10 Minutes**. 
  * *Rationale:* 10 minutes is the average rate of a Bitcoin block and is spaced enough so the OpenNode API rate limits don't block us.

### 4.2 Critical Alerts to Administrator
It is proposed to implement an Emergency Notification system via **NodeMailer (SMTP) or a dedicated Discord/Telegram Webhook** exclusively for the General Administrator.

**Alert Triggers:**
1. **Yellow Alert (Low Bankroll Warning):** When the OpenNode account balance drops below 50% of the initial target balance or `< 100,000 Sats`.
2. **Red Alert (Operational Halt):** If liquidity drops below `20,000 Sats` (or insufficient to pay a $1 USD minimum straight bet), the backend will transition to "Under Maintenance" state, issuing the critical alert and automatically rejecting incoming bets to appease the game engine.

## 5. Implementation Plan (Added Backlog)
1. Approve this expanded strategy.
2. Refactor the initial calculation in `src/routes/bet.ts` to intercept incoming bets based on the cached dynamic balance.
3. Create `src/services/bankroll_worker.ts` that starts the 10-minute OpenNode polling and configures alert channels (Email/Telegram).
4. Proceed to modify Frontend controls so they reject invalid bets before executing the HTTP Post.
