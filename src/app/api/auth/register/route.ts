import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { GENERIC_REGISTER_CONFLICT } from "@/lib/auth/constants";
import { sessionCookieHeader, requestIsSecure } from "@/lib/auth/http";
import { hashPassword } from "@/lib/auth/password";
import { signSessionToken } from "@/lib/auth/session";
import { validateRegisterBody } from "@/lib/auth/validation";
import { executeMutation, executeQueryFirst } from "@/lib/d1-client";
import { toPublicUser, userExistsByUsernameOrEmail, type UserRow } from "@/lib/auth/user";

export async function POST(request: Request) {
	try {
		const { env } = getCloudflareContext();
		const body = (await request.json()) as Record<string, unknown>;
		const parsed = validateRegisterBody(body);
		if (!parsed.ok) {
			return NextResponse.json({ error: "Validation failed", fields: parsed.errors }, { status: 400 });
		}
		const { firstname, lastname, username, email, password } = parsed.data;

		if (await userExistsByUsernameOrEmail(env.DB, username, email)) {
			return NextResponse.json({ error: GENERIC_REGISTER_CONFLICT }, { status: 409 });
		}

		const passwordHash = await hashPassword(password);
		try {
			await executeMutation(
				env.DB,
				`INSERT INTO users (firstname, lastname, username, password, email) VALUES (?1, ?2, ?3, ?4, ?5)`,
				[firstname, lastname, username, passwordHash, email],
			);
		} catch {
			return NextResponse.json({ error: GENERIC_REGISTER_CONFLICT }, { status: 409 });
		}

		const row = await executeQueryFirst<UserRow>(
			env.DB,
			`SELECT userid, firstname, lastname, username, password, email FROM users WHERE username = ?`,
			[username],
		);

		if (!row) {
			return NextResponse.json({ error: "Registration could not be completed" }, { status: 500 });
		}

		const token = await signSessionToken(row.userid, env.SESSION_SECRET);
		const secure = requestIsSecure(request);
		const res = NextResponse.json({ user: toPublicUser(row) });
		res.headers.append("Set-Cookie", sessionCookieHeader(token, secure));
		return res;
	} catch {
		return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
	}
}
