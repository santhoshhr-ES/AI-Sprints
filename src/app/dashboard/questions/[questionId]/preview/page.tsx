import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDashboardUser } from "@/lib/auth/dashboard-session";
import { executeQuery, executeQueryFirst } from "@/lib/d1-client";
import { McqQuestionPreview } from "@/components/mcq/McqQuestionPreview";

export const dynamic = "force-dynamic";

export default async function PreviewQuestionPage({ params }: { params: Promise<{ questionId: string }> }) {
	const user = await getDashboardUser();
	const questionId = Number((await params).questionId);
	if (!Number.isFinite(questionId)) notFound();

	const { env } = getCloudflareContext();
	const row = await executeQueryFirst<{ question_id: number; stem: string }>(
		env.DB,
		`SELECT question_id, stem FROM mcq_questions WHERE question_id = ? AND created_by = ? AND deleted_at IS NULL`,
		[questionId, user.userid],
	);
	if (!row) notFound();

	const optionRows = await executeQuery<{ label: string; is_correct: number }>(
		env.DB,
		`SELECT label, is_correct FROM mcq_options WHERE question_id = ? ORDER BY sort_order ASC`,
		[questionId],
	);

	return (
		<McqQuestionPreview
			questionId={row.question_id}
			stem={row.stem}
			options={optionRows.map((o) => ({
				label: o.label,
				isCorrect: Boolean(o.is_correct),
			}))}
		/>
	);
}
