import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDashboardUser } from "@/lib/auth/dashboard-session";
import { executeQuery } from "@/lib/d1-client";
import { McqQuestionsGrid } from "@/components/mcq/McqQuestionsGrid";
import type { McqListItem } from "@/lib/mcq/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
	const user = await getDashboardUser();
	const { env } = getCloudflareContext();

	let questions: McqListItem[] = [];
	try {
		questions = await executeQuery<McqListItem>(
			env.DB,
			`SELECT q.question_id, q.stem, q.updated_at,
        (SELECT COUNT(*) FROM mcq_options o WHERE o.question_id = q.question_id) AS option_count
       FROM mcq_questions q
       WHERE q.created_by = ? AND q.deleted_at IS NULL
       ORDER BY q.updated_at DESC
       LIMIT 50`,
			[user.userid],
		);
	} catch {
		questions = [];
	}

	return <McqQuestionsGrid initialQuestions={questions} />;
}
