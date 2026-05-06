"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type OptionRow = { id: string; label: string; isCorrect: boolean };

function newOption(): OptionRow {
	return { id: crypto.randomUUID(), label: "", isCorrect: false };
}

function optionsFromInitial(
	initial: { label: string; isCorrect: boolean }[] | undefined,
): OptionRow[] {
	if (!initial?.length) return [newOption(), newOption()];
	return initial.map((o) => ({
		id: crypto.randomUUID(),
		label: o.label,
		isCorrect: o.isCorrect,
	}));
}

type Props = {
	mode: "create" | "edit";
	questionId?: number;
	initialStem?: string;
	initialOptions?: { label: string; isCorrect: boolean }[];
};

export function McqQuestionForm({ mode, questionId, initialStem = "", initialOptions }: Props) {
	const router = useRouter();
	const [stem, setStem] = useState(initialStem);
	const [options, setOptions] = useState<OptionRow[]>(() => optionsFromInitial(initialOptions));
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	const correctCount = options.filter((o) => o.isCorrect).length;
	const controlHint =
		correctCount <= 1 ? "Learners see a single-choice control." : "Learners see multi-select (select all that apply).";

	function updateOption(id: string, patch: Partial<Pick<OptionRow, "label" | "isCorrect">>) {
		setOptions((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
	}

	function addOption() {
		setOptions((rows) => [...rows, newOption()]);
	}

	function removeOption(id: string) {
		setOptions((rows) => (rows.length <= 2 ? rows : rows.filter((r) => r.id !== id)));
	}

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");
		setSaving(true);
		try {
			const payload = {
				stem: stem.trim(),
				options: options.map((o, i) => ({
					label: o.label.trim(),
					isCorrect: o.isCorrect,
					sortOrder: i,
				})),
			};

			if (mode === "edit" && (questionId == null || !Number.isFinite(questionId))) {
				setError("Invalid question");
				setSaving(false);
				return;
			}

			const url = mode === "create" ? "/api/mcqs" : `/api/mcqs/${questionId}`;
			const res = await fetch(url, {
				method: mode === "create" ? "POST" : "PUT",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = (await res.json()) as { error?: string };
			if (!res.ok) {
				setError(data.error ?? "Could not save");
				return;
			}
			router.push("/dashboard");
			router.refresh();
		} catch {
			setError("Network error");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div>
			<Link
				href="/dashboard"
				className="mb-8 inline-flex text-sm font-medium text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
			>
				← Back to questions
			</Link>

			<div className="mb-6 flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						{mode === "create" ? "Create question" : "Edit question"}
					</h1>
					<p className="mt-1 text-sm text-foreground/65">
						Mark every correct answer — one correct is single-select; several correct is multi-select.
					</p>
				</div>
				<p className="hidden shrink-0 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200 sm:block">
					{controlHint}
				</p>
			</div>

			<form onSubmit={(e) => void onSubmit(e)} className="mx-auto max-w-2xl space-y-6">
				<label className="block">
					<span className="mb-2 block text-sm font-medium text-foreground/80">Question</span>
					<textarea
						value={stem}
						onChange={(e) => setStem(e.target.value)}
						rows={4}
						placeholder="e.g. Which of the following are prime numbers?"
						className="w-full resize-y rounded-xl border border-black/12 bg-background px-4 py-3 text-base leading-relaxed shadow-sm dark:border-white/12"
						required
					/>
				</label>

				<div>
					<div className="mb-3 flex items-center justify-between gap-2">
						<span className="text-sm font-medium text-foreground/80">Answer choices</span>
						<button
							type="button"
							onClick={addOption}
							className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
						>
							+ Add choice
						</button>
					</div>
					<ul className="space-y-3">
						{options.map((o, index) => (
							<li
								key={o.id}
								className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white/40 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]"
							>
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5 text-xs font-mono font-medium dark:bg-white/10">
									{String.fromCharCode(65 + index)}
								</span>
								<input
									type="text"
									value={o.label}
									onChange={(e) => updateOption(o.id, { label: e.target.value })}
									placeholder={`Choice ${index + 1}`}
									className="min-w-0 flex-1 rounded-lg border border-black/10 bg-background px-3 py-2 text-sm dark:border-white/10"
									required
								/>
								<label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={o.isCorrect}
										onChange={(e) => updateOption(o.id, { isCorrect: e.target.checked })}
										className="h-4 w-4 rounded border-black/20 dark:border-white/30"
									/>
									<span className="text-foreground/70">Correct</span>
								</label>
								<button
									type="button"
									onClick={() => removeOption(o.id)}
									disabled={options.length <= 2}
									className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-500/10 disabled:opacity-30 dark:text-red-400"
								>
									Remove
								</button>
							</li>
						))}
					</ul>
					<p className="mt-2 text-xs text-foreground/55 sm:hidden">{controlHint}</p>
				</div>

				{error ? (
					<p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">
						{error}
					</p>
				) : null}

				<div className="flex flex-wrap gap-3">
					<button
						type="submit"
						disabled={saving}
						className="rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-sm hover:opacity-90 disabled:opacity-50"
					>
						{saving ? "Saving…" : mode === "create" ? "Save question" : "Update question"}
					</button>
					<Link
						href="/dashboard"
						className="rounded-xl border border-black/15 px-6 py-3 text-sm font-medium dark:border-white/20"
					>
						Cancel
					</Link>
					{mode === "edit" && questionId != null ? (
						<Link
							href={`/dashboard/questions/${questionId}/preview`}
							className="rounded-xl border border-black/15 px-6 py-3 text-sm font-medium dark:border-white/20"
						>
							Preview
						</Link>
					) : null}
				</div>
			</form>
		</div>
	);
}
