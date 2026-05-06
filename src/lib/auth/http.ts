import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";

export function sessionCookieHeader(
	token: string,
	secure: boolean,
): string {
	const maxAge = 60 * 60 * 24 * 7;
	const parts = [
		`${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
		"Path=/",
		`Max-Age=${maxAge}`,
		"HttpOnly",
		"SameSite=Lax",
	];
	if (secure) parts.push("Secure");
	return parts.join("; ");
}

export function clearSessionCookieHeader(secure: boolean): string {
	const parts = [`${AUTH_COOKIE_NAME}=`, "Path=/", "Max-Age=0", "HttpOnly", "SameSite=Lax"];
	if (secure) parts.push("Secure");
	return parts.join("; ");
}

export function requestIsSecure(request: Request): boolean {
	return new URL(request.url).protocol === "https:";
}
