"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { McqListItem } from "@/lib/mcq/types";

export function McqQuestionsGrid({ initialQuestions }: { initialQuestions: McqListItem[] }) {
	const router = useRouter();
	const [questions, setQuestions] = useState(initialQuestions);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	useEffect(() => {
		setQuestions(initialQuestions);
	}, [initialQuestions]);

	async function removeQuestion(id: number) {
		if (!confirm("Delete this question? It will be removed from your list.")) return;
		setDeletingId(id);
		try {
			const res = await fetch(`/api/mcqs/${id}`, { method: "DELETE", credentials: "include" });
			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				alert(data.error ?? "Could not delete");
				return;
			}
			setQuestions((q) => q.filter((x) => x.question_id !== id));
			router.refresh();
		} finally {
			setDeletingId(null);
		}
	}

	return (
		<div>
			<div className="mb-8 flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-lg font-semibold tracking-tight">Your questions</h2>
					<p className="text-sm text-foreground/60">{questions.length} total</p>
				</div>
				<Link
					href="/dashboard/questions/new"
					className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-sm hover:opacity-90"
				>
					Create question
				</Link>
			</div>

			{questions.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-black/15 px-6 py-16 text-center dark:border-white/15">
					<p className="text-foreground/70">No questions yet.</p>
					<Link
						href="/dashboard/questions/new"
						className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
					>
						Create your first question
					</Link>
				</div>
			) : (
				<ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{questions.map((q) => (
						<li
							key={q.question_id}
							className="flex flex-col rounded-2xl border border-black/10 bg-white/50 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]"
						>
							<p className="line-clamp-4 min-h-[5.5rem] text-sm leading-relaxed">{q.stem}</p>
							<p className="mt-3 text-xs text-foreground/50">
								{Number(q.option_count)} choices · {formatUpdated(q.updated_at)}
							</p>
							<div className="mt-4 flex flex-wrap gap-2 border-t border-black/8 pt-4 dark:border-white/8">
								<Link
									href={`/dashboard/questions/${q.question_id}/preview`}
									className="rounded-lg border border-black/12 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/12 dark:hover:bg-white/10"
								>
									Preview
								</Link>
								<Link
									href={`/dashboard/questions/${q.question_id}/edit`}
									className="rounded-lg border border-black/12 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/12 dark:hover:bg-white/10"
								>
									Edit
								</Link>
								<button
									type="button"
									onClick={() => void removeQuestion(q.question_id)}
									disabled={deletingId === q.question_id}
									className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
								>
									{deletingId === q.question_id ? "Deleting…" : "Delete"}
								</button>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function formatUpdated(raw: string): string {
	if (!raw) return "";
	const s = raw.slice(0, 16).replace("T", " ");
	return s;
}
