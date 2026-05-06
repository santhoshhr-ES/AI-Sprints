import { SignJWT, jwtVerify } from "jose";

const SESSION_DAYS = 7;

export async function signSessionToken(userid: number, secret: string): Promise<string> {
	const key = new TextEncoder().encode(secret);
	return new SignJWT({ sub: String(userid) })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(`${SESSION_DAYS}d`)
		.sign(key);
}

export async function verifySessionToken(
	token: string,
	secret: string,
): Promise<{ userid: number } | null> {
	try {
		const key = new TextEncoder().encode(secret);
		const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
		const sub = payload.sub;
		if (!sub) return null;
		const userid = Number(sub);
		if (!Number.isFinite(userid)) return null;
		return { userid };
	} catch {
		return null;
	}
}
