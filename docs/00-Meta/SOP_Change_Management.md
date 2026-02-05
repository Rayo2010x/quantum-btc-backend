# Standard Operating Procedure (SOP): Change Management
> **Artifact ID:** SOP_Change_Management
> **Status:** ACTIVE
> **Compliance:** MANDATORY

## The "Doc-First" Protocol
To comply with `.antigravityrules` and `SOP_Document_Control.md`, every change to the system must follow this strict 3-phase cycle. **Skipping Phase 1 is a violation of project rules.**

### Phase 1: Documentation (AUTHORIZATION)
*Before writing a single line of code:*
1.  **Identity:** Which document in `docs/` governs the component I'm about to touch?
    *   *System Logic?* -> `02-Architecture/`
    *   *Data Structure?* -> `03-Database/`
    *   *API Contract?* -> `04-API/`
    *   *Config/Secrets?* -> `06-Operations/`
2.  **Verify:** Does the document accurately reflect the *future state* I am about to build?
    *   *If NO:* **Update the document first.**
    *   *If YES:* Proceed to Phase 2.
3.  **Deliverable:** A committed update to a `.md` file in `docs/`.

### Phase 2: Implementation (EXECUTION)
*Only after Phase 1 is marked done:*
1.  Write code that strictly implements the specification from Phase 1.
2.  Do not add "extra features" not documented. If you think of an improvement, go back to Phase 1.

### Phase 3: Verification (AUDIT)
1.  Update `walkthrough.md` with proof of work.
2.  Verify `DOCUMENT_INDEX.md` is up to date (version bumps).

---

## Example Scenario: "Adding a new betting limit"
1.  ❌ **BAD:** Edit `src/config.ts` to change the limit.
2.  ✅ **GOOD:**
    *   Edit `docs/01-Requirements/Manual_Tecnico.md` to define the new business rule.
    *   Edit `src/config.ts` to implement it.
