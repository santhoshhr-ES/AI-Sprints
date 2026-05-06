/**
 * Centralized D1 access. Normalizes `?` → `?1`, `?2`, … for Wrangler/D1 binding compatibility.
 */

export function normalizePlaceholders(sql: string): string {
	let n = 0;
	return sql.replace(/\?(?!\d)/g, () => {
		n += 1;
		return `?${n}`;
	});
}

export async function executeQuery<T extends Record<string, unknown>>(
	db: D1Database,
	sql: string,
	params: unknown[] = [],
): Promise<T[]> {
	const normalized = normalizePlaceholders(sql);
	const stmt = db.prepare(normalized);
	const bound = params.length > 0 ? stmt.bind(...params) : stmt;
	const { results } = await bound.all<T>();
	return results ?? [];
}

export async function executeQueryFirst<T extends Record<string, unknown>>(
	db: D1Database,
	sql: string,
	params: unknown[] = [],
): Promise<T | null> {
	const rows = await executeQuery<T>(db, sql, params);
	return rows[0] ?? null;
}

export async function executeMutation(
	db: D1Database,
	sql: string,
	params: unknown[] = [],
): Promise<D1Result> {
	const normalized = normalizePlaceholders(sql);
	const stmt = db.prepare(normalized);
	const bound = params.length > 0 ? stmt.bind(...params) : stmt;
	return bound.run();
}

export async function executeBatch(
	db: D1Database,
	statements: { sql: string; params?: unknown[] }[],
): Promise<D1Result[]> {
	const batch = statements.map(({ sql, params = [] }) => {
		const normalized = normalizePlaceholders(sql);
		const stmt = db.prepare(normalized);
		return params.length > 0 ? stmt.bind(...params) : stmt;
	});
	return db.batch(batch);
}
