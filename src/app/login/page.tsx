"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
	const router = useRouter();
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");
		setFieldErrors({});
		setLoading(true);
		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ identifier, password }),
			});
			const data = (await res.json()) as {
				error?: string;
				fields?: Record<string, string>;
			};
			if (!res.ok) {
				if (data.fields) setFieldErrors(data.fields);
				setError(data.error ?? "Sign in failed");
				return;
			}
			router.push("/dashboard");
			router.refresh();
		} catch {
			setError("Network error");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
			<div className="rounded-2xl border border-black/10 bg-white/50 p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
				<h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
				<p className="mt-2 text-xs text-foreground/60">Use your username or email and password.</p>

				<form onSubmit={(e) => void onSubmit(e)} className="mt-8 flex flex-col gap-4">
					<label className="flex flex-col gap-1 text-sm">
						<span className="text-foreground/80">Username or email</span>
						<input
							className="rounded-lg border border-black/15 bg-background px-3 py-2 dark:border-white/15"
							value={identifier}
							onChange={(e) => setIdentifier(e.target.value)}
							autoComplete="username"
							required
						/>
						{fieldErrors.identifier ? (
							<span className="text-xs text-red-600 dark:text-red-400">{fieldErrors.identifier}</span>
						) : null}
					</label>
					<label className="flex flex-col gap-1 text-sm">
						<span className="text-foreground/80">Password</span>
						<input
							type="password"
							className="rounded-lg border border-black/15 bg-background px-3 py-2 dark:border-white/15"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="current-password"
							required
						/>
						{fieldErrors.password ? (
							<span className="text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</span>
						) : null}
					</label>

					{error ? (
						<p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">
							{error}
						</p>
					) : null}

					<button
						type="submit"
						disabled={loading}
						className="mt-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
					>
						{loading ? "Signing in…" : "Sign in"}
					</button>
					<p className="mt-5 text-center text-sm text-foreground/70">
						New here?{" "}
						<Link
							href="/register"
							className="font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
						>
							Create an account
						</Link>
					</p>
				</form>
			</div>
			<p className="mt-6 text-center text-xs text-foreground/50">QuizMaker</p>
		</div>
	);
}
