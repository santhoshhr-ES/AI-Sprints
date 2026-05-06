-- MCQ authoring (BRD-MCQ-001) — questions + options
CREATE TABLE IF NOT EXISTS mcq_questions (
	question_id INTEGER PRIMARY KEY AUTOINCREMENT,
	stem TEXT NOT NULL,
	created_by INTEGER REFERENCES users(userid),
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS mcq_options (
	option_id INTEGER PRIMARY KEY AUTOINCREMENT,
	question_id INTEGER NOT NULL REFERENCES mcq_questions(question_id) ON DELETE CASCADE,
	label TEXT NOT NULL,
	is_correct INTEGER NOT NULL DEFAULT 0,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_mcq_questions_created_by ON mcq_questions(created_by);
CREATE INDEX IF NOT EXISTS idx_mcq_options_question ON mcq_options(question_id);
