import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/session";
import { executeQueryFirst } from "@/lib/d1-client";
import { toPublicUser, type UserRow } from "@/lib/auth/user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const { env } = getCloudflareContext();
		const cookie = request.headers.get("cookie");
		const raw = cookie
			?.split(";")
			.map((p) => p.trim())
			.find((p) => p.startsWith(`${AUTH_COOKIE_NAME}=`))
			?.slice(AUTH_COOKIE_NAME.length + 1);
		const token = raw ? decodeURIComponent(raw) : null;
		if (!token) {
			return NextResponse.json({ user: null }, { status: 200 });
		}

		const session = await verifySessionToken(token, env.SESSION_SECRET);
		if (!session) {
			return NextResponse.json({ user: null }, { status: 200 });
		}

		const user = await executeQueryFirst<UserRow>(
			env.DB,
			`SELECT userid, firstname, lastname, username, password, email FROM users WHERE userid = ?`,
			[session.userid],
		);
		if (!user) {
			return NextResponse.json({ user: null }, { status: 200 });
		}

		return NextResponse.json({ user: toPublicUser(user) });
	} catch {
		return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
	}
}
