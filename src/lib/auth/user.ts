import { executeQueryFirst } from "@/lib/d1-client";
import { DUMMY_PASSWORD_HASH } from "@/lib/auth/constants";
import { verifyPassword } from "@/lib/auth/password";

export type UserRow = {
	userid: number;
	firstname: string;
	lastname: string;
	username: string;
	password: string;
	email: string;
};

export type PublicUser = Omit<UserRow, "password">;

export function toPublicUser(row: UserRow): PublicUser {
	return {
		userid: row.userid,
		firstname: row.firstname,
		lastname: row.lastname,
		username: row.username,
		email: row.email,
	};
}

export async function findUserByIdentifier(
	db: D1Database,
	identifier: string,
): Promise<UserRow | null> {
	if (identifier.includes("@")) {
		return executeQueryFirst<UserRow>(
			db,
			`SELECT userid, firstname, lastname, username, password, email FROM users WHERE email = ?`,
			[identifier],
		);
	}
	return executeQueryFirst<UserRow>(
		db,
		`SELECT userid, firstname, lastname, username, password, email FROM users WHERE username = ?`,
		[identifier],
	);
}

export async function verifyLoginCredentials(
	db: D1Database,
	identifier: string,
	password: string,
): Promise<UserRow | null> {
	const user = await findUserByIdentifier(db, identifier);
	const hash = user?.password ?? DUMMY_PASSWORD_HASH;
	const ok = await verifyPassword(password, hash);
	if (!ok || !user) return null;
	return user;
}

export async function userExistsByUsernameOrEmail(
	db: D1Database,
	username: string,
	email: string,
): Promise<boolean> {
	const row = await executeQueryFirst<{ c: number }>(
		db,
		`SELECT COUNT(*) as c FROM users WHERE username = ?1 OR email = ?2`,
		[username, email],
	);
	return Number(row?.c ?? 0) > 0;
}
