import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/session";
import { executeQueryFirst } from "@/lib/d1-client";
import type { UserRow } from "@/lib/auth/user";

export const getDashboardUser = cache(async (): Promise<UserRow> => {
	const cookieStore = await cookies();
	const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
	if (!token) redirect("/login");

	const { env } = getCloudflareContext();
	const session = await verifySessionToken(token, env.SESSION_SECRET);
	if (!session) redirect("/login");

	const user = await executeQueryFirst<UserRow>(
		env.DB,
		`SELECT userid, firstname, lastname, username, password, email FROM users WHERE userid = ?`,
		[session.userid],
	);
	if (!user) redirect("/login");

	return user;
});
