import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Home() {
	const cookieStore = await cookies();
	const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
	if (token) {
		const { env } = getCloudflareContext();
		const session = await verifySessionToken(token, env.SESSION_SECRET);
		if (session) redirect("/dashboard");
	}
	redirect("/login");
}
