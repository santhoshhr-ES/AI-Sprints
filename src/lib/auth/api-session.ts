import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/session";

function parseSessionCookie(cookieHeader: string | null): string | null {
	if (!cookieHeader) return null;
	const part = cookieHeader
		.split(";")
		.map((p) => p.trim())
		.find((p) => p.startsWith(`${AUTH_COOKIE_NAME}=`));
	if (!part) return null;
	return decodeURIComponent(part.slice(AUTH_COOKIE_NAME.length + 1));
}

/** Resolves authenticated user id from request cookie, or null. */
export async function getAuthedUserIdFromRequest(request: Request): Promise<number | null> {
	try {
		const raw = parseSessionCookie(request.headers.get("cookie"));
		if (!raw) return null;
		const { env } = getCloudflareContext();
		const session = await verifySessionToken(raw, env.SESSION_SECRET);
		return session?.userid ?? null;
	} catch {
		return null;
	}
}
