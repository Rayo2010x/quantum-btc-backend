# Operations Manual - Quantum BTC

> **Artifact ID:** 20260320_Operations_Manual_v1.2
> **Version:** 1.2
> **Date:** 2026-03-20
> **Status:** VIGENTE

## 1. Deployment Requirements
*   **Node.js:** v18 LTS or higher.
*   **Database:** PostgreSQL 15+.
*   **Redis:** (Optional) For rate limiting/caching.

### Docker Compose
```yaml
version: '3.8'
services:
  api:
    build: .
    env_file: .env
    ports:
      - "3000:3000"
    depends_on:
      - output_db
  
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: quantum_user
      POSTGRES_DB: quantum_db
    volumes:
      - pgdata:/var/lib/postgresql/data
```

## 2. Configuration Reference (.env)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | API Port | `3000` |
| `DATABASE_URL` | Postgres Connection | `postgresql://user:pass@localhost:5432/db` |
| `OPENNODE_API_KEY` | Admin Key (Invoices) | `ebd8...` |
| `OPENNODE_HASHED_SECRET` | **MUST match `OPENNODE_API_KEY`** (for Signature verification) | `ebd8...` |
| `PUBLIC_URL` | Application URL for Webhooks (No trailing slash) | `https://...` |
| `ANU_API_KEY` | Quantum API Key (Optional, triggers fallback if missing) | `...` |
| `BANKROLL_FLOOR_SATS` | Safety Stop Limit | `400000` |

## 3. Disaster Recovery (DR)

### 3.1 Scenario: Balance Mismatch
If `OpenNode Balance` < `System Internal Balance`:
1.  **STOP THE BETTING:** Set `MAINTENANCE_MODE=true`.
2.  **Audit Transactions:** Run `scripts/audit-ledger.ts` to sum all Deposits - Withdrawals + Wins - Losses.
3.  **Resync:** Identify the missing webhook or failed withdrawal.

### 3.2 Scenario: OpenNode Outage
1.  **Inbound:** Invoices will fail to generate. UI should show "Service Unavailable".
2.  **Outbound:** Withdrawals will queue. Increase retry backoff to 1h.

---

## 4. Third-Party Integrations & Security Policies

### 4.1 Principle of Least Privilege (GitHub & Vercel)
To minimize the supply chain attack surface, the project follows a strict **Least Privilege** policy for third-party application permissions.

*   **Vercel GitHub App:** As of March 2026, Vercel requested "Write" access to GitHub Workflows.
*   **Decision:** The request was **DECLINED/IGNORED**.
*   **Rationale:** The project does not currently utilize GitHub Actions for its core CI/CD pipeline, and granting write access to workflows poses an unnecessary security risk without immediate functional benefit.
*   **Review Policy:** Any request for elevated permissions from third-party apps must be audited and documented before approval.
