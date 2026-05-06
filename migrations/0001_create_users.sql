-- Basic authentication: users + login rate limiting (BRD-AUTH-001)
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

CREATE TABLE IF NOT EXISTS auth_login_rate (
	bucket_key TEXT NOT NULL,
	window_id INTEGER NOT NULL,
	attempt_count INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (bucket_key, window_id)
);
