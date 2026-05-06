import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { GENERIC_LOGIN_ERROR } from "@/lib/auth/constants";
import { sessionCookieHeader, requestIsSecure } from "@/lib/auth/http";
import { LoginRateLimitedError, clientBucketKey, consumeLoginAttempt } from "@/lib/auth/rate-limit";
import { signSessionToken } from "@/lib/auth/session";
import { validateLoginBody } from "@/lib/auth/validation";
import { toPublicUser, verifyLoginCredentials } from "@/lib/auth/user";

export async function POST(request: Request) {
	try {
		const { env } = getCloudflareContext();
		const bucket = clientBucketKey(request);
		try {
			await consumeLoginAttempt(env.DB, bucket);
		} catch (e) {
			if (e instanceof LoginRateLimitedError) {
				return NextResponse.json({ error: e.message }, { status: 429 });
			}
			throw e;
		}

		const body = (await request.json()) as Record<string, unknown>;
		const parsed = validateLoginBody(body);
		if (!parsed.ok) {
			return NextResponse.json({ error: "Validation failed", fields: parsed.errors }, { status: 400 });
		}

		const { identifier, password } = parsed.data;
		const user = await verifyLoginCredentials(env.DB, identifier, password);
		if (!user) {
			return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 });
		}

		const token = await signSessionToken(user.userid, env.SESSION_SECRET);
		const secure = requestIsSecure(request);
		const res = NextResponse.json({ user: toPublicUser(user) });
		res.headers.append("Set-Cookie", sessionCookieHeader(token, secure));
		return res;
	} catch {
		return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
	}
}
