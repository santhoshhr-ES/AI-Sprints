/** Valid bcrypt hash used when no user exists so verify still runs (timing, FR-AUTH-11). */
export const DUMMY_PASSWORD_HASH =
	"$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export const AUTH_COOKIE_NAME = "auth_session";

export const MIN_PASSWORD_LENGTH = 8;

export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,32}$/;

/** Loose RFC 5322–style check; normalize email to lowercase for storage. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const GENERIC_LOGIN_ERROR = "Invalid username or password";

export const GENERIC_REGISTER_CONFLICT = "Username or email already in use";
