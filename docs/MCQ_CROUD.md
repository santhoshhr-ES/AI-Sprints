# Technical BRD: MCQ Module (CRUD, Preview, Attempts, Responses)

| Field | Value |
|--------|--------|
| Document ID | BRD-MCQ-001 |
| Document type | Technical Business Requirements Document (BRD) |
| Feature | Multiple-choice questions (MCQ) with multi-select, author CRUD, learner preview, per-attempt responses |
| Version | 1.0 |
| Status | Draft |
| Related documents | [BASIC_AUTHENTICATION.md](./BASIC_AUTHENTICATION.md) — Technical BRD: Basic Authentication (**BRD-AUTH-001**) |

*Note: Filename `MCQ_CROUD.md` is retained; scope is full MCQ **CRUD** and learner flows.*

---

## Document map (preview)

| Section | Contents |
|---------|----------|
| §1 Executive summary | Author CRUD for MCQs; one or more correct options; learner attempts with persisted responses; preview aligned to live UI. |
| §2 Scope | In scope: options with multiple correct flags, author CRUD, attempt lifecycle, preview modes, multi-select scoring. Out: question banks/randomization, proctoring, rich media (unless extended), formal versioning. |
| §3–§5 | Stakeholders, definitions (stem, option, attempt, response, preview), assumptions (`userid` from Basic Authentication BRD). |
| §6 Functional requirements | **FR-MCQ-01–14** — question/options model, create/list/detail/update/delete, radio/checkbox UX, preview (FR-MCQ-10), attempts, responses, submit, multi-attempt, scoring. |
| §7 Non-functional | **NFR-MCQ-01–04** — transactional writes, authorization, durable submit, delete/orphan policy. |
| §8 Data model | `mcq_questions`, `mcq_options`, `mcq_attempts`, `mcq_responses`, selected options (normalized or JSON). |
| §9 Preview | Author preview vs learner practice; no persistence vs `attempt_type = preview` (product choice). |
| §10 Workflows | Author create/edit/delete; learner start attempt, save responses, submit, new `attempt_id` per try. |
| §11 | Acceptance criteria **AC-MCQ-01–05**. |
| §12 | Logical interfaces (technical outline): question CRUD, preview, attempts, responses. |
| §13 | Requirements traceability (FR/NFR → AC). |
| §14 | Dependencies, related BRDs, open items. |
| §15 | Revision history. |
| §16 | Implementation checklist (delivery). |

**Highlights:** Multi-select MCQ, transactional author CRUD, per-attempt response storage, exact-set scoring default, preview reuses learner MCQ component.

---

## 1. Executive summary

The product shall allow **authors** to create, read, update, and delete MCQ content where each question supports **one or more correct options** (multi-select / “select all that apply”). **Learners** shall answer questions within **attempts**; the system shall **persist each attempt** and **each question response**. A **preview** capability shall let authors (and optionally learners in practice mode) view question rendering consistent with the live learner experience.

**Business objectives**

- Centralize MCQ content with auditable CRUD.
- Support both single-answer and multi-correct MCQ in one model.
- Record learner responses per attempt for reporting, scoring, and compliance.
- Reduce authoring errors via preview before publish.

---

## 2. Scope

### 2.1 In scope

- Question and option persistence with multiple correct flags.
- Author flows: create, list, detail, edit, delete (with policy for existing attempts).
- Learner attempt lifecycle: start attempt, save/update responses, submit attempt.
- Preview modes as defined in §6 and §9.
- Scoring rules for multi-select (exact-set default; partial credit as optional policy).

### 2.2 Out of scope (unless added by a future BRD)

- Question banks, randomization, or adaptive testing algorithms.
- Proctoring, plagiarism, or time-limit enforcement (time limits may be a separate BRD).
- Rich media in stems (images/audio) unless extended in technical design.
- Peer review or versioning of question content beyond `updated_at`.

---

## 3. Stakeholders and consumers

| Role | Interest |
|------|----------|
| Author / admin | CRUD MCQs, preview, manage correctness and options. |
| Learner | Take quizzes, see appropriate UI (radio vs checkbox), submit attempts. |
| Product / analytics | Per-attempt response data for scores and exports. |

---

## 4. Definitions

| Term | Definition |
|------|------------|
| **Stem** | The question prompt text. |
| **Option** | One selectable answer line item. |
| **Multi-select MCQ** | More than one option may be marked correct; learner may select multiple. |
| **Attempt** | One bounded learner session (e.g. one quiz try), identified by `attempt_id`. |
| **Response** | The set of option(s) selected for one question within one attempt. |
| **Preview** | Rendering of the MCQ UI without affecting graded attempt data, or with a non-graded attempt type per §9. |

---

## 5. Assumptions and constraints

- User identity for attempts aligns with **Basic Authentication BRD** (`userid`) when the learner is logged in; anonymous attempts may use nullable `userid` if product allows.
- Database supports SQL, transactions, and foreign keys (or equivalent application-enforced integrity).
- Author vs learner permissions are enforced by application layer (RBAC detail out of scope).

---

## 6. Functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-MCQ-01** | The system shall store each MCQ as a **question** entity with a **stem** and one-to-many **options**. | Must |
| **FR-MCQ-02** | Each option shall have display **label**, **sort order**, and **is_correct**; **multiple** options may be `is_correct` for the same question. | Must |
| **FR-MCQ-03** | On create, the system shall require a non-empty stem, **at least two** options, and **at least one** option marked correct. | Must |
| **FR-MCQ-04** | Authors shall **create** new questions with options in a single logical operation (transaction). | Must |
| **FR-MCQ-05** | Authors shall **list** questions with pagination and stem preview and metadata (e.g. created/updated). | Must |
| **FR-MCQ-06** | Authors shall **view detail** including full stem, all options, and which options are correct (author-only visibility for correctness in graded learner mode). | Must |
| **FR-MCQ-07** | Authors shall **update** stem, options (add/remove/reorder), and correct flags; updates shall be transactional and shall update `updated_at` where modeled. | Must |
| **FR-MCQ-08** | Authors shall **delete** questions per product policy: **soft delete** (recommended for data with attempts) or **hard delete** with explicit rules for historical responses. | Must |
| **FR-MCQ-09** | The learner UI shall use **radio** controls when exactly one option is correct and **checkbox** when more than one is correct (or product may always use checkboxes if documented). | Should |
| **FR-MCQ-10** | The system shall provide **preview** that reuses the same MCQ presentation component as the live learner view (§9). | Must |
| **FR-MCQ-11** | Starting a graded flow shall create an **attempt** row with `started_at` and associate responses to `attempt_id`. | Must |
| **FR-MCQ-12** | The system shall persist **one response record** per (`attempt_id`, `question_id`), storing the **set of selected option id(s)**. | Must |
| **FR-MCQ-13** | On submit, the system shall set `submitted_at` on the attempt and shall support **multiple attempts** as distinct `attempt_id` values. | Must |
| **FR-MCQ-14** | The system shall compute score per question using the **default rule**: full credit only if the selected option set **exactly equals** the set of correct option ids; **partial credit** is optional and shall be documented if enabled. | Must (default) / Should (partial) |

---

## 7. Non-functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| **NFR-MCQ-01** | CRUD operations that touch question + options shall complete in a **single transaction** to avoid partial writes. | Must |
| **NFR-MCQ-02** | List and detail endpoints shall enforce **authorization** (authors only for edit/delete and for viewing correct answers in author contexts). | Must |
| **NFR-MCQ-03** | Attempt and response writes shall be **durable** before reporting “submitted” success to the learner. | Must |
| **NFR-MCQ-04** | Delete policy shall be documented and tested: no orphaned options; historical attempts either preserved or explicitly purged per compliance. | Must |

---

## 8. Logical data model

### 8.1 `mcq_questions`

| Attribute | Type | Rules |
|-----------|------|--------|
| `question_id` | INTEGER | PK, auto-increment. |
| `stem` | TEXT | NOT NULL. |
| `created_by` | INTEGER | Optional FK → `users.userid`. |
| `created_at` | DATETIME/TEXT | Optional per implementation. |
| `updated_at` | DATETIME/TEXT | Optional per implementation. |
| `deleted_at` | DATETIME/TEXT | Optional; for soft delete (§FR-MCQ-08). |

### 8.2 `mcq_options`

| Attribute | Type | Rules |
|-----------|------|--------|
| `option_id` | INTEGER | PK. |
| `question_id` | INTEGER | FK → `mcq_questions`. |
| `label` | TEXT | NOT NULL. |
| `is_correct` | BOOLEAN/INTEGER | NOT NULL. |
| `sort_order` | INTEGER | Display order. |

**Rule:** Multi-select when **count** of options with `is_correct = 1` for a question is **greater than 1**.

### 8.3 `mcq_attempts`

| Attribute | Type | Rules |
|-----------|------|--------|
| `attempt_id` | INTEGER | PK. |
| `userid` | INTEGER | FK → `users.userid`, nullable if anonymous allowed. |
| `started_at` | DATETIME/TEXT | NOT NULL. |
| `submitted_at` | DATETIME/TEXT | Nullable until submit. |
| `context` | TEXT | Optional JSON (quiz id, assignment id, etc.). |
| `attempt_type` | TEXT | Optional: e.g. `graded` vs `preview` for analytics. |

### 8.4 `mcq_responses` and selected options

**Normalized (preferred for reporting):**

- `mcq_responses`: `response_id` (PK), `attempt_id` (FK), `question_id` (FK), `answered_at`.
- `mcq_response_options`: (`response_id`, `option_id`) composite uniqueness.

**Alternative:** `selected_option_ids` JSON array on `mcq_responses` — acceptable if query/report needs are met.

---

## 9. Preview (business rules)

| Mode | Behavior |
|------|----------|
| **Author preview** | Render stem + options; may reveal correct answers after interaction in author-only context. |
| **Learner practice / preview** | Same UI as graded attempt; shall **not** write to `mcq_attempts` / `mcq_responses` **or** shall write with `attempt_type = 'preview'` and exclude from graded reports — **product shall choose one** and document in technical design. |

**FR trace:** FR-MCQ-10.

---

## 10. Workflows

### 10.1 Author: create / edit / delete

- **Create:** Enter stem and options; validate §FR-MCQ-03; insert question then options (§FR-MCQ-04, NFR-MCQ-01).
- **Edit:** Load entities; apply changes; replace or upsert options in one transaction (§FR-MCQ-07); warn in UI if attempts exist (policy).
- **Delete:** Confirm; soft-delete recommended if attempts reference question (§FR-MCQ-08, NFR-MCQ-04).

### 10.2 Learner: attempt and responses

1. Start graded attempt → insert `mcq_attempts` (§FR-MCQ-11).
2. For each question, persist or upsert response and selected options (§FR-MCQ-12).
3. Submit → `submitted_at` set; score per §FR-MCQ-14.
4. New try → new `attempt_id` (§FR-MCQ-13).

---

## 11. Acceptance criteria (summary)

| Criterion | Verification |
|-----------|----------------|
| AC-MCQ-01 | Created question has ≥2 options and ≥1 correct; multi-correct stored correctly. |
| AC-MCQ-02 | Author can list, open, edit, and delete (or soft-delete) per policy; no partial option sets after failed save. |
| AC-MCQ-03 | Preview uses same MCQ UI component as learner graded view. |
| AC-MCQ-04 | Two attempts for same user produce two `attempt_id` values with distinct response rows. |
| AC-MCQ-05 | Submitted attempt has `submitted_at` and scoring matches documented rule (exact set by default). |

---

## 12. Logical interfaces (technical outline)

*The implementation may expose these as HTTP routes, RPCs, or server actions; this section defines required capabilities, not URL paths.*

| Operation | Intent | Primary FR/NFR |
|-----------|--------|----------------|
| **CreateQuestion** | Persist stem and options in one transaction; enforce §FR-MCQ-03. | FR-MCQ-01–04, NFR-MCQ-01 |
| **ListQuestions** | Paginated list with stem preview and metadata. | FR-MCQ-05, NFR-MCQ-02 |
| **GetQuestion** | Detail for author (include correctness) or learner view (suppress correctness when graded). | FR-MCQ-06, NFR-MCQ-02 |
| **UpdateQuestion** | Transactional stem/option replace or upsert; update `updated_at`. | FR-MCQ-07, NFR-MCQ-01 |
| **DeleteQuestion** | Soft or hard delete per policy; no orphaned options. | FR-MCQ-08, NFR-MCQ-04 |
| **PreviewQuestion** | Render via same component as learner MCQ; optional reveal for author. | FR-MCQ-10, §9 |
| **StartAttempt** | Create `mcq_attempts` for graded (or typed preview) flow. | FR-MCQ-11 |
| **SaveResponse** | Upsert response + selected option ids for (`attempt_id`, `question_id`). | FR-MCQ-12, NFR-MCQ-03 |
| **SubmitAttempt** | Set `submitted_at`; compute score per §FR-MCQ-14. | FR-MCQ-13–14, NFR-MCQ-03 |

---

## 13. Requirements traceability (FR / NFR → AC)

| AC ID | Supported by (representative) |
|-------|-------------------------------|
| **AC-MCQ-01** | FR-MCQ-01–03 |
| **AC-MCQ-02** | FR-MCQ-04–08, NFR-MCQ-01 |
| **AC-MCQ-03** | FR-MCQ-10, §9 |
| **AC-MCQ-04** | FR-MCQ-11–13 |
| **AC-MCQ-05** | FR-MCQ-13–14, NFR-MCQ-03 |

---

## 14. Dependencies and related documents

- **Depends on:** User identity for attributed attempts — **BRD-AUTH-001** ([BASIC_AUTHENTICATION.md](./BASIC_AUTHENTICATION.md)), `users.userid` where not anonymous.
- **Feeds:** Reporting, grade export, dashboards (out of scope for this BRD).
- **Open items:** Soft vs hard delete default; preview persistence policy (§9); partial credit on/off.

---

## 15. Revision history

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | — | Initial technical BRD: MCQ model, author/learner workflows, preview, FR/NFR/AC, logical interfaces. |

---

## 16. Implementation checklist (delivery)

- [ ] Schema supports §8 (questions, options, attempts, responses, selected options).
- [ ] §6 FR-MCQ-01–08 satisfied for authors.
- [ ] §6 FR-MCQ-09–14 satisfied for learners.
- [ ] §11 acceptance criteria testable in staging.
- [ ] Delete and preview policies documented and aligned with NFR-MCQ-04.
- [ ] Logical interfaces in §12 implemented or mapped in technical design document.
