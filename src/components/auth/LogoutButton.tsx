"use client";

export function LogoutButton() {
	async function logout() {
		await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
		window.location.href = "/login";
	}

	return (
		<button
			type="button"
			onClick={() => void logout()}
			className="shrink-0 rounded-lg border border-black/12 bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
		>
			Log out
		</button>
	);
}
