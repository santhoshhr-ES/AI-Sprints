# Technical BRD: Basic Authentication

| Field | Value |
|--------|--------|
| Document ID | BRD-AUTH-001 |
| Document type | Technical Business Requirements Document (BRD) |
| Feature | Basic authentication — registration and login |
| Version | 1.1 |
| Status | Draft |
| Related documents | [MCQ_CROUD.md](./MCQ_CROUD.md) — Technical BRD: MCQ module |

---

## Document map (preview)

| Section | Contents |
|---------|----------|
| §1 Executive summary | Self-service registration, credential login, one-way password hashing, session/token after login. |
| §2 Scope | In scope: registration model, sign-up/login, session issuance, security NFRs. Out: OAuth/SSO, MFA, magic links, email verification, RBAC beyond authenticated user. |
| §3–§5 | Stakeholders, definitions, assumptions (SQL store, HTTPS, fixed login identifier strategy). |
| §6 Functional requirements | **FR-AUTH-01–13** — `users` attributes, uniqueness, validation, hash-only storage, generic errors, login, no plaintext passwords. |
| §7 Non-functional | **NFR-AUTH-01–04**; **§7.2 Security** — **SEC-AUTH-01–10** (transport, secrets, cookies/tokens, CSRF, fixation, dependencies). |
| §8 Data model | `users` table: `userid`, `firstname`, `lastname`, `username`, `password` (hash), `email`; reference DDL (SQLite / D1). |
| §9 Workflows | Sign-up and login business steps cross-referenced to FR/NFR IDs. |
| §10 | Acceptance criteria **AC-AUTH-01–16** (functional, security, operational). |
| §11 | Dependencies, related BRDs, open items. |
| §12 | Logical interfaces (technical outline): registration, login, session validation. |
| §13 | Requirements traceability (FR / NFR / SEC → AC). |
| §14 | Revision history. |
| §15 | Implementation checklist (delivery). |

**Core registration attributes:** `userid` (PK), `firstname`, `lastname`, `username` (unique), `password` (hash only), `email` (unique).

---

## 1. Executive summary

The product shall provide **self-service user registration** and **credential-based login** so that learners and authors can access protected capabilities. Passwords must be stored using one-way hashing only; sessions or tokens shall establish authenticated context after successful login.

**Business objectives**

- Enable account creation with a consistent user profile (`userid`, name, username, email).
- Reduce credential risk via standard hashing and transport security.
- Support a clear path from registration to an authenticated application state.

---

## 2. Scope

### 2.1 In scope

- Registration data model and persistence for the attributes specified in §8.
- Sign-up and login user journeys with validation and error handling.
- Post-login session or token issuance (implementation choice recorded in §7).
- Security and operational requirements in §7 and §7.2.

### 2.2 Out of scope (unless added by a future BRD)

- Social login (OAuth), SSO, or enterprise IdP federation.
- Multi-factor authentication (MFA).
- Passwordless magic links.
- Email verification workflow (optional extension; not specified in this BRD).
- Role-based access control (RBAC) beyond “authenticated user.”

---

## 3. Stakeholders and consumers

| Role | Interest |
|------|----------|
| Product / engineering | Implement and operate auth flows and storage. |
| Security / compliance | Password handling, logging, rate limits, HTTPS. |
| End users | Register and sign in with minimal friction. |

---

## 4. Definitions

| Term | Definition |
|------|------------|
| **Registration** | Creation of a new row in the user store after successful sign-up. |
| **Credential** | Username (or email as identifier) plus password supplied at login. |
| **Password hash** | Output of a one-way password hashing function; not reversible to plaintext. |

---

## 5. Assumptions and constraints

- Persistent store supports SQL (e.g. SQLite / Cloudflare D1) with unique constraints.
- Application is served over **HTTPS** in production.
- A single **identifier strategy** for login is chosen and fixed (username only, email only, or username **or** email); this BRD requires that choice to be documented in the technical design.

---

## 6. Functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-AUTH-01** | The system shall persist each registered user with attributes: `userid` (primary key), `firstname`, `lastname`, `username`, `password` (hash only), `email`. | Must |
| **FR-AUTH-02** | `username` and `email` shall be **unique** across all users. | Must |
| **FR-AUTH-03** | Sign-up shall collect first name, last name, username, email, password, and password confirmation (confirmation may be UI-only; server re-validates password policy). | Must |
| **FR-AUTH-04** | Sign-up shall reject empty or whitespace-only fields after trim for all required attributes. | Must |
| **FR-AUTH-05** | Sign-up shall validate email format and normalize email for lookup (e.g. lowercase) per product policy. | Must |
| **FR-AUTH-06** | Sign-up shall enforce username format and length policy (documented in technical design). | Must |
| **FR-AUTH-07** | Sign-up shall enforce password policy (minimum length; optional complexity per product policy). | Must |
| **FR-AUTH-08** | Before insert, the system shall hash the password with an approved algorithm (e.g. bcrypt, Argon2, scrypt) and store **only** the hash in `password`. | Must |
| **FR-AUTH-09** | Sign-up shall not reveal whether username or email collided; a single generic message shall be used (e.g. “Username or email already in use”). | Should |
| **FR-AUTH-10** | Login shall accept the chosen identifier (username and/or email per §5) plus password. | Must |
| **FR-AUTH-11** | On failed login (unknown user or wrong password), the system shall return a **generic** error (e.g. “Invalid username or password”) and should use a constant-time verification path to limit user enumeration. | Must / Should |
| **FR-AUTH-12** | On successful login, the system shall establish an authenticated session (HTTP-only cookie or JWT per §7) and redirect or return success per API contract. | Must |
| **FR-AUTH-13** | The system shall not log plaintext passwords or write them to persistent storage. | Must |

---

## 7. Non-functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| **NFR-AUTH-01** | Login attempts shall be **rate-limited** per IP and/or per account identifier to mitigate brute force. | Must |
| **NFR-AUTH-02** | Server errors shall be logged for operations; stack traces and internal details shall not be exposed to clients. | Must |
| **NFR-AUTH-03** | If server-side sessions are used, session identifier shall be **regenerated** on successful login. | Should |
| **NFR-AUTH-04** | Session/token approach shall be compatible with deployment topology (e.g. Workers: signed cookies or KV-backed sessions). | Must |

### 7.1 Session and token (design decision record)

| Approach | Fit |
|----------|-----|
| HTTP-only session cookie | Simple revocation; may need shared session store when scaled horizontally. |
| JWT access (+ refresh if needed) | Stateless APIs; rotation and revocation require explicit design. |

**Implementation shall document the chosen approach and align with NFR-AUTH-04.**

### 7.2 Security requirements

These requirements complement §6 and §7. They are owned by engineering and security review; verification is reflected in §10 (acceptance criteria).

| ID | Requirement | Priority |
|----|-------------|----------|
| **SEC-AUTH-01** | Production endpoints for registration, login, and session establishment shall be served only over **TLS 1.2+** (HTTPS). HTTP → HTTPS redirect is allowed; cleartext credential submission in production is forbidden. | Must |
| **SEC-AUTH-02** | Password hashing shall use a **current, memory-hard or adaptive** algorithm (e.g. Argon2id, bcrypt, scrypt) with **per-password salt** (or equivalent) and a **documented work factor** or cost parameter; parameters shall meet or exceed project baseline at implementation time. | Must |
| **SEC-AUTH-03** | **Secrets** (session signing keys, JWT secrets, encryption keys) shall not be committed to source control; they shall be supplied via environment or a secrets manager. Rotation procedure shall be documented if long-lived keys are used. | Must |
| **SEC-AUTH-04** | If **HTTP-only cookies** carry session or tokens: `Secure` and `HttpOnly` shall be set in production; `SameSite` shall be **Lax** or **Strict** unless a documented cross-site use case requires otherwise (then mitigations such as CSRF tokens apply). | Must |
| **SEC-AUTH-05** | For **cookie-based** sessions on state-changing requests, **CSRF protection** shall be implemented (synchronizer token, double-submit cookie, or framework equivalent) per technical design. | Must |
| **SEC-AUTH-06** | Authenticated responses shall not include the password hash or other credential material; user profile APIs shall expose only fields intended for the client. | Must |
| **SEC-AUTH-07** | **Security event logging** (without secrets): failed logins, rate-limit triggers, and session issuance may be logged with correlation IDs; logs must not contain passwords, reset tokens, or raw session identifiers at high verbosity in shared sinks. | Should |
| **SEC-AUTH-08** | Dependencies that perform cryptography, parsing of credentials, or session handling shall be **kept patched**; known-critical CVEs in those dependencies shall be addressed per project SLA. | Must |
| **SEC-AUTH-09** | If **JWTs** are used: signing algorithm shall not be **none**; validation shall enforce **issuer** and **audience** (or equivalent binding) where applicable; expiry shall be enforced; refresh or rotation strategy shall be documented if long-lived access is required. | Must |
| **SEC-AUTH-10** | **Content Security Policy** and other baseline HTTP security headers (as required by deployment platform) shall be applied to pages that render login or registration forms, unless exempted with documented rationale. | Should |

---

## 8. Logical data model

### 8.1 Entity: `users` (registration table)

| Attribute | Type | Rules |
|-----------|------|--------|
| `userid` | INTEGER | Primary key; auto-increment; stable internal id. |
| `firstname` | TEXT | NOT NULL; max length per policy (e.g. 100). |
| `lastname` | TEXT | NOT NULL; max length per policy (e.g. 100). |
| `username` | TEXT | NOT NULL; UNIQUE. |
| `password` | TEXT | NOT NULL; **password hash only**. |
| `email` | TEXT | NOT NULL; UNIQUE; normalized for lookup. |

Optional future attributes (not required by this BRD): `created_at`, `updated_at`, `email_verified_at`, `last_login_at`, `is_active`.

### 8.2 Physical schema (reference DDL — SQLite / Cloudflare D1)

```sql
CREATE TABLE IF NOT EXISTS users (
  userid INTEGER PRIMARY KEY AUTOINCREMENT,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

---

## 9. Workflows (business process)

### 9.1 Sign-up

1. Present registration form (§FR-AUTH-03).
2. Client validates inputs; server re-validates (§FR-AUTH-04–07).
3. Server checks uniqueness of username and email (§FR-AUTH-02).
4. Hash password and insert row (§FR-AUTH-08, FR-AUTH-01).
5. Post-registration: auto sign-in **or** redirect to login with success message; email verification is **out of scope** unless a follow-on BRD adds it.
6. On conflict or error, apply §FR-AUTH-09 and NFR-AUTH-02.

### 9.2 Login

1. Present login form (§FR-AUTH-10).
2. Resolve user by documented identifier strategy; verify password (§FR-AUTH-11).
3. Issue session/token (FR-AUTH-12, §7).
4. Enforce NFR-AUTH-01, NFR-AUTH-03, and applicable controls in §7.2 (e.g. cookie flags, CSRF when using cookies).

---

## 10. Acceptance criteria

Acceptance is satisfied when each criterion below is demonstrable in a test or staging environment (automated tests preferred), with evidence recorded for audit (e.g. test run output, checklist sign-off).

### 10.1 Functional and data integrity

| ID | Criterion | Verification |
|----|-----------|--------------|
| **AC-AUTH-01** | New user row exists with all six attributes; `password` is a non-plaintext hash. | Inspect DB row after sign-up; confirm hash format matches chosen algorithm (e.g. bcrypt/Argon2 prefix or length). |
| **AC-AUTH-02** | Duplicate username or duplicate email is rejected without leaking which field matched. | Attempt sign-up with existing username only, existing email only, and both; observe identical user-facing message (per FR-AUTH-09). |
| **AC-AUTH-03** | Valid credentials yield authenticated state; invalid credentials do not. | E2E or API tests: success path sets session/cookie or returns token; wrong password and unknown user both fail with generic error. |
| **AC-AUTH-04** | No plaintext password in DB, logs, or API responses. | DB inspection, log scrape of sign-up/login flows, and response body checks confirm absence of plaintext password. |
| **AC-AUTH-05** | Required field validation matches FR-AUTH-03–07 (empty/whitespace, email format, username policy, password policy). | Negative tests for each rule; server rejects invalid payloads. |
| **AC-AUTH-06** | Email normalization for lookup is consistent (e.g. case policy documented and applied on sign-up and login). | Same logical email with different casing cannot register twice; login resolves per documented policy. |

### 10.2 Security and abuse resistance

| ID | Criterion | Verification |
|----|-----------|--------------|
| **AC-AUTH-07** | Login is rate-limited per NFR-AUTH-01 (IP and/or identifier). | Exceed threshold of failed attempts; observe throttle, delay, or block; document limit values in runbook or config. |
| **AC-AUTH-08** | Failed login does not distinguish unknown user vs wrong password (message and, where feasible, comparable response timing). | Review implementation for constant-time compare or dummy hash path; manual or automated checks of messages. |
| **AC-AUTH-09** | Session fixation mitigated: on successful login, session id is regenerated when using server-side sessions (NFR-AUTH-03). | Capture pre-login session cookie if applicable; after login, session identifier differs or binding is invalidated per design. |
| **AC-AUTH-10** | Cookie security attributes meet SEC-AUTH-04 when cookies are used. | Browser devtools or Set-Cookie inspection in staging over HTTPS: `Secure`, `HttpOnly`, `SameSite` as specified. |
| **AC-AUTH-11** | CSRF protection is present for state-changing requests when using cookie sessions (SEC-AUTH-05). | Attempt cross-site forged POST without token; request rejected; happy path with token succeeds. |
| **AC-AUTH-12** | TLS is enforced for auth endpoints in production configuration (SEC-AUTH-01). | Production or prod-like deploy: auth URLs use HTTPS; optional scan of redirect from HTTP. |
| **AC-AUTH-13** | JWT usage meets SEC-AUTH-09 if JWT is the chosen mechanism. | Token inspection: algorithm not `none`; exp validated; iss/aud checked per design; no sensitive claims beyond need. |
| **AC-AUTH-14** | Secrets are not in repository; app starts only with configured secrets (SEC-AUTH-03). | Repo scan (e.g. no keys in `.env` committed); deployment checklist confirms secret injection. |

### 10.3 Operational and resilience

| ID | Criterion | Verification |
|----|-----------|--------------|
| **AC-AUTH-15** | Server errors do not expose stack traces or internal details to clients (NFR-AUTH-02). | Force a controlled 5xx or misconfiguration in test; client sees generic error; logs retain detail server-side. |
| **AC-AUTH-16** | Session/token approach works in target deployment (NFR-AUTH-04). | Deploy to representative environment; login persists across expected load balancer/instance behavior per design. |

---

## 11. Dependencies and related documents

- **Depends on:** Database migration capability, HTTPS termination, chosen password-hashing and session/JWT libraries.
- **Feeds:** Features that require a stable user key — see **BRD-MCQ-001** ([MCQ_CROUD.md](./MCQ_CROUD.md)) and future BRDs referencing `userid`.
- **Open items:** Login identifier strategy (username vs email vs both); exact password/username length rules; email verification if required by compliance.

---

## 12. Logical interfaces (technical outline)

*The implementation may expose these as HTTP routes, RPCs, or server actions; this section defines required capabilities, not URL paths.*

| Operation | Intent | Primary FR/NFR |
|-----------|--------|----------------|
| **Register** | Accept sign-up payload; validate; hash password; insert `users`; return success or generic conflict. | FR-AUTH-01–09, FR-AUTH-08, NFR-AUTH-02 |
| **Authenticate** | Accept identifier + password; verify hash; issue session/token on success; generic failure. | FR-AUTH-10–12, FR-AUTH-11, NFR-AUTH-01 |
| **Establish session** | Bind authenticated `userid` to client (cookie or token) per §7. | FR-AUTH-12, NFR-AUTH-04 |
| **Validate session** | Resolve current user from session/token for protected resources (detailed in technical design). | FR-AUTH-12, NFR-AUTH-03 |

---

## 13. Requirements traceability (FR / NFR / SEC → AC)

| AC ID | Supported by |
|-------|----------------|
| **AC-AUTH-01** | FR-AUTH-01, FR-AUTH-08 |
| **AC-AUTH-02** | FR-AUTH-02, FR-AUTH-09 |
| **AC-AUTH-03** | FR-AUTH-10–12, FR-AUTH-11 |
| **AC-AUTH-04** | FR-AUTH-08, FR-AUTH-13, NFR-AUTH-02 |
| **AC-AUTH-05** | FR-AUTH-03–07 |
| **AC-AUTH-06** | FR-AUTH-05, FR-AUTH-10 |
| **AC-AUTH-07** | NFR-AUTH-01 |
| **AC-AUTH-08** | FR-AUTH-11 |
| **AC-AUTH-09** | NFR-AUTH-03 |
| **AC-AUTH-10** | SEC-AUTH-04 |
| **AC-AUTH-11** | SEC-AUTH-05 |
| **AC-AUTH-12** | SEC-AUTH-01 |
| **AC-AUTH-13** | SEC-AUTH-09 |
| **AC-AUTH-14** | SEC-AUTH-03 |
| **AC-AUTH-15** | NFR-AUTH-02 |
| **AC-AUTH-16** | NFR-AUTH-04 |

| SEC ID | Related AC (primary) |
|--------|----------------------|
| **SEC-AUTH-01** | AC-AUTH-12 |
| **SEC-AUTH-02** | AC-AUTH-01, AC-AUTH-04 |
| **SEC-AUTH-03** | AC-AUTH-14 |
| **SEC-AUTH-04** | AC-AUTH-10 |
| **SEC-AUTH-05** | AC-AUTH-11 |
| **SEC-AUTH-06** | AC-AUTH-04 |
| **SEC-AUTH-07** | (operational; optional evidence in runbooks) |
| **SEC-AUTH-08** | (process / dependency audit) |
| **SEC-AUTH-09** | AC-AUTH-13 |
| **SEC-AUTH-10** | (manual security review or DAST baseline) |

---

## 14. Revision history

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | — | Initial technical BRD: registration model, sign-up/login workflows, FR/NFR/AC, logical interfaces. |
| 1.1 | — | Added §7.2 security requirements (SEC-AUTH-01–10); expanded §10 acceptance criteria (AC-AUTH-01–16) and traceability. |

---

## 15. Implementation checklist (delivery)

- [ ] `users` table matches §8 including unique `username` and `email`.
- [ ] Sign-up satisfies §6 FR-AUTH-01–09 and §10 (AC-AUTH-01, -02, -04–06).
- [ ] Login satisfies FR-AUTH-10–12, NFR-AUTH-01, and §10 AC-AUTH-03, -07, -08, -09.
- [ ] Session/token documented per §7 and NFR-AUTH-04; §10 AC-AUTH-09, -10, -13, -16 as applicable.
- [ ] §7.2 SEC-AUTH satisfied with evidence mapped to §10 (especially AC-AUTH-10–14).
- [ ] Logical interfaces in §12 implemented or mapped in technical design document.
- [ ] §10 acceptance criteria AC-AUTH-01–16 signed off or tracked in test suite.
