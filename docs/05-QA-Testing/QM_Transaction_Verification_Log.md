# Transaction Flow Verification Log

> **ID:** QM_Transaction_Verification_Log
> **Version:** 1.1
> **Last Updated:** 2026-04-08
> **Status:** APPROVED

## Summary
Executed `scripts/smoke-test-transactions.ts` to verify the core transaction lifecycle and populate the database.

## Test Results
- **Script**: `scripts/smoke-test-transactions.ts`
- **Execution Time**: 2026-01-31
- **Outcome**: ✅ SUCCESS

### Detailed Flow
1. **Session Creation**:
   - Created Session ID: `b78e5502-8d28-4baa-836a-3205009551c2`
   - Initial Balance: 0 sats

2. **Deposit Simulation**:
   - Amount: 5000 sats
   - Transaction ID: `fd305585-1ad2-4867-8912-6b05eb3bd456`
   - Status: PENDING -> PAID
   - **Verification**: Balance updated to 5000 sats.

3. **Withdrawal Simulation**:
   - Amount: 2000 sats
   - Deducted Balance: 5000 - 2000 = 3000 sats.
   - Token Created: `e3b0e313-2bd7-44e9-a9c6-4b2d21557cf4`
   - **Verification**: Final balance confirmed at 3000 sats.

## Conclusion
The database schema and logic for Transactions and Withdrawals are functioning correctly. The `transactions` and `withdrawal_tokens` tables are now populated with test data.

## Recommendations
- **Next Step**: Verify the **Webhook API Endpoint** (`/api/v1/webhooks/opennode`).
  - The current smoke test bypassed the API layer and updated the DB directly.
  - We need to ensure the HTTP handler correctly receives the OpenNode payload, verifies the signature, and triggers the DB update.

### Webhook Verification (Added)
- **Script**: `scripts/test-webhook-endpoint.ts`
- **Result**: ✅ SUCCESS
- **Endpoint**: `http://localhost:3000/v1/webhooks/opennode`
- **Details**:
    - Validated HMAC-SHA256 Signature verification.
    - Verified `PENDING` -> `PAID` state transition triggered by HTTP POST.
    - Confirmed Session balance credited (mock deposit).
