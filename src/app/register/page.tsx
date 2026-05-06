"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function RegisterPage() {
	const router = useRouter();
	const [firstname, setFirstname] = useState("");
	const [lastname, setLastname] = useState("");
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");
		setFieldErrors({});
		if (password !== confirm) {
			setFieldErrors({ confirm: "Passwords do not match" });
			return;
		}
		setLoading(true);
		try {
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					firstname,
					lastname,
					username,
					email,
					password,
				}),
			});
			const data = (await res.json()) as {
				error?: string;
				fields?: Record<string, string>;
			};
			if (!res.ok) {
				if (data.fields) setFieldErrors(data.fields);
				setError(data.error ?? "Registration failed");
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
				<h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
				<p className="mt-1 text-sm text-foreground/70">
					Already have an account?{" "}
					<Link href="/login" className="font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400">
						Sign in
					</Link>
				</p>

				<form onSubmit={(e) => void onSubmit(e)} className="mt-8 flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3">
						<label className="flex flex-col gap-1 text-sm">
							<span className="text-foreground/80">First name</span>
							<input
								className="rounded-lg border border-black/15 bg-background px-3 py-2 dark:border-white/15"
								value={firstname}
								onChange={(e) => setFirstname(e.target.value)}
								autoComplete="given-name"
								required
							/>
							{fieldErrors.firstname ? (
								<span className="text-xs text-red-600 dark:text-red-400">{fieldErrors.firstname}</span>
							) : null}
						</label>
						<label className="flex flex-col gap-1 text-sm">
							<span className="text-foreground/80">Last name</span>
							<input
								className="rounded-lg border border-black/15 bg-background px-3 py-2 dark:border-white/15"
								value={lastname}
								onChange={(e) => setLastname(e.target.value)}
								autoComplete="family-name"
								required
							/>
							{fieldErrors.lastname ? (
								<span className="text-xs text-red-600 dark:text-red-400">{fieldErrors.lastname}</span>
							) : null}
						</label>
					</div>
					<label className="flex flex-col gap-1 text-sm">
						<span className="text-foreground/80">Username</span>
						<input
							className="rounded-lg border border-black/15 bg-background px-3 py-2 dark:border-white/15"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							autoComplete="username"
							required
						/>
						{fieldErrors.username ? (
							<span className="text-xs text-red-600 dark:text-red-400">{fieldErrors.username}</span>
						) : null}
					</label>
					<label className="flex flex-col gap-1 text-sm">
						<span className="text-foreground/80">Email</span>
						<input
							type="email"
							className="rounded-lg border border-black/15 bg-background px-3 py-2 dark:border-white/15"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							autoComplete="email"
							required
						/>
						{fieldErrors.email ? (
							<span className="text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</span>
						) : null}
					</label>
					<label className="flex flex-col gap-1 text-sm">
						<span className="text-foreground/80">Password</span>
						<input
							type="password"
							className="rounded-lg border border-black/15 bg-background px-3 py-2 dark:border-white/15"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="new-password"
							required
						/>
						{fieldErrors.password ? (
							<span className="text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</span>
						) : null}
					</label>
					<label className="flex flex-col gap-1 text-sm">
						<span className="text-foreground/80">Confirm password</span>
						<input
							type="password"
							className="rounded-lg border border-black/15 bg-background px-3 py-2 dark:border-white/15"
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							autoComplete="new-password"
							required
						/>
						{fieldErrors.confirm ? (
							<span className="text-xs text-red-600 dark:text-red-400">{fieldErrors.confirm}</span>
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
						{loading ? "Creating…" : "Create account"}
					</button>
				</form>
			</div>
			<p className="mt-6 text-center text-xs text-foreground/50">
				<Link href="/login" className="hover:underline">
					← Sign in
				</Link>
			</p>
		</div>
	);
}
