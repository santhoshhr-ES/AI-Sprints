import { executeMutation, executeQueryFirst } from "@/lib/d1-client";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS_PER_WINDOW = 20;

export class LoginRateLimitedError extends Error {
	constructor() {
		super("Too many login attempts. Try again later.");
		this.name = "LoginRateLimitedError";
	}
}

export async function consumeLoginAttempt(db: D1Database, bucketKey: string): Promise<void> {
	const windowId = Math.floor(Date.now() / WINDOW_MS);
	const row = await executeQueryFirst<{ attempt_count: number }>(
		db,
		`SELECT attempt_count FROM auth_login_rate WHERE bucket_key = ? AND window_id = ?`,
		[bucketKey, windowId],
	);
	if (row && row.attempt_count >= MAX_ATTEMPTS_PER_WINDOW) {
		throw new LoginRateLimitedError();
	}
	await executeMutation(
		db,
		`INSERT INTO auth_login_rate (bucket_key, window_id, attempt_count) VALUES (?1, ?2, 1)
     ON CONFLICT(bucket_key, window_id) DO UPDATE SET attempt_count = attempt_count + 1`,
		[bucketKey, windowId],
	);
}

export function clientBucketKey(request: Request): string {
	const cf = request.headers.get("cf-connecting-ip");
	if (cf) return `ip:${cf}`;
	const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
	if (fwd) return `ip:${fwd}`;
	const realIp = request.headers.get("x-real-ip");
	if (realIp) return `ip:${realIp}`;
	return "ip:unknown";
}
