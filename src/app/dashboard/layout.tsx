import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getDashboardUser } from "@/lib/auth/dashboard-session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const user = await getDashboardUser();
	const displayName = [user.firstname, user.lastname].filter(Boolean).join(" ").trim() || user.username;

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--foreground)_4%,var(--background))_100%)]">
			<header className="sticky top-0 z-20 border-b border-black/10 bg-background/90 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-lg dark:border-white/10 dark:shadow-[0_1px_0_rgba(255,255,255,0.06)]">
				<div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
					<Link
						href="/dashboard"
						className="text-[15px] font-semibold tracking-tight text-foreground hover:opacity-80"
					>
						QuizMaker
					</Link>
					<div className="flex items-center gap-3 sm:gap-4">
						<span className="max-w-[200px] truncate text-sm font-medium text-foreground/90 sm:max-w-none">
							{displayName}
						</span>
						<LogoutButton />
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
		</div>
	);
}
