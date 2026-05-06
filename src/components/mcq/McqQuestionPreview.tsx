"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type PreviewOption = {
	label: string;
	isCorrect: boolean;
};

type Props = {
	questionId: number;
	stem: string;
	options: PreviewOption[];
};

function correctIndexSet(opts: PreviewOption[]): Set<number> {
	const s = new Set<number>();
	opts.forEach((o, i) => {
		if (o.isCorrect) s.add(i);
	});
	return s;
}

function setsEqual(a: Set<number>, b: Set<number>): boolean {
	if (a.size !== b.size) return false;
	for (const x of a) if (!b.has(x)) return false;
	return true;
}

export function McqQuestionPreview({ questionId, stem, options }: Props) {
	const correctCount = useMemo(() => options.filter((o) => o.isCorrect).length, [options]);
	const singleSelect = correctCount === 1;
	const correctSet = useMemo(() => correctIndexSet(options), [options]);

	const [pickedSingle, setPickedSingle] = useState<number | null>(null);
	const [pickedMulti, setPickedMulti] = useState<Set<number>>(() => new Set());
	const [submitted, setSubmitted] = useState(false);
	const [submitError, setSubmitError] = useState("");

	function toggleMulti(i: number) {
		if (submitted) return;
		setPickedMulti((prev) => {
			const next = new Set(prev);
			if (next.has(i)) next.delete(i);
			else next.add(i);
			return next;
		});
	}

	const userCorrect = useMemo(() => {
		if (!submitted) return null;
		if (singleSelect) {
			if (pickedSingle === null) return false;
			return Boolean(options[pickedSingle]?.isCorrect);
		}
		return setsEqual(pickedMulti, correctSet);
	}, [submitted, singleSelect, pickedSingle, pickedMulti, correctSet, options]);

	function optionClass(i: number, isCorrect: boolean): string {
		const base =
			"flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors";
		const selectedSingle = singleSelect && pickedSingle === i;
		const selectedMulti = !singleSelect && pickedMulti.has(i);

		if (!submitted) {
			if (selectedSingle || selectedMulti) return `${base} border-foreground/25 bg-foreground/5`;
			return `${base} border-black/10 bg-white/40 hover:border-black/20 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/20`;
		}

		const userPicked = selectedSingle || selectedMulti;
		if (isCorrect) return `${base} border-emerald-500/60 bg-emerald-500/10 dark:border-emerald-400/50`;
		if (userPicked && !isCorrect) return `${base} border-red-500/50 bg-red-500/10 dark:border-red-400/50`;
		return `${base} border-black/8 opacity-70 dark:border-white/10`;
	}

	function handleSubmit() {
		if (singleSelect) {
			if (pickedSingle === null) {
				setSubmitError("Please select an answer.");
				return;
			}
		} else if (pickedMulti.size === 0) {
			setSubmitError("Select at least one answer.");
			return;
		}
		setSubmitError("");
		setSubmitted(true);
	}

	function handleTryAgain() {
		setSubmitted(false);
		setPickedSingle(null);
		setPickedMulti(new Set());
		setSubmitError("");
	}

	return (
		<div>
			<Link
				href="/dashboard"
				className="mb-6 inline-flex text-sm font-medium text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
			>
				← Back to questions
			</Link>

			<div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
				<strong className="font-semibold">Author preview.</strong> This is how learners see the question. Nothing
				here is stored as a quiz attempt.
			</div>

			<div className="mx-auto max-w-2xl rounded-2xl border border-black/10 bg-white/60 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
				<p className="text-xs font-medium uppercase tracking-wide text-foreground/45">Question #{questionId}</p>
				<h1 className="mt-2 text-lg font-semibold leading-snug">{stem}</h1>
				<p className="mt-3 text-xs text-foreground/55">
					{singleSelect ? "Select one answer." : "Select all that apply."}
				</p>

				{submitted && userCorrect !== null ? (
					<p
						className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${
							userCorrect
								? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-100"
								: "bg-red-500/10 text-red-800 dark:text-red-200"
						}`}
						role="status"
					>
						{userCorrect ? "Correct — nice work." : "Not quite — review the highlighted answers."}
					</p>
				) : null}

				<div className="mt-6 space-y-3" role={singleSelect ? "radiogroup" : undefined}>
					{options.map((opt, i) => (
						<label
							key={i}
							className={`${optionClass(i, opt.isCorrect)} ${submitted ? "cursor-default" : ""}`}
						>
							{singleSelect ? (
								<input
									type="radio"
									name={`mcq-preview-${questionId}`}
									checked={pickedSingle === i}
									disabled={submitted}
									onChange={() => setPickedSingle(i)}
									className="mt-1 h-4 w-4 shrink-0 border-black/20 disabled:opacity-60 dark:border-white/30"
								/>
							) : (
								<input
									type="checkbox"
									checked={pickedMulti.has(i)}
									disabled={submitted}
									onChange={() => toggleMulti(i)}
									className="mt-1 h-4 w-4 shrink-0 rounded border-black/20 disabled:opacity-60 dark:border-white/30"
								/>
							)}
							<span className="text-sm leading-relaxed">
								<span className="mr-2 font-mono text-xs text-foreground/45">{String.fromCharCode(65 + i)}.</span>
								{opt.label}
							</span>
						</label>
					))}
				</div>

				{submitError ? (
					<p className="mt-4 text-sm text-red-700 dark:text-red-300" role="alert">
						{submitError}
					</p>
				) : null}

				<div className="mt-8 flex flex-wrap items-center gap-3 border-t border-black/8 pt-6 dark:border-white/8">
					{!submitted ? (
						<button
							type="button"
							onClick={handleSubmit}
							className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
						>
							Submit
						</button>
					) : (
						<button
							type="button"
							onClick={handleTryAgain}
							className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium dark:border-white/20"
						>
							Try again
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
