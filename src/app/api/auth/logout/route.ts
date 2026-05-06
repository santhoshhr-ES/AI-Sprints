import { NextResponse } from "next/server";
import { clearSessionCookieHeader, requestIsSecure } from "@/lib/auth/http";

export async function POST(request: Request) {
	try {
		const secure = requestIsSecure(request);
		const res = NextResponse.json({ ok: true });
		res.headers.append("Set-Cookie", clearSessionCookieHeader(secure));
		return res;
	} catch {
		return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
	}
}
