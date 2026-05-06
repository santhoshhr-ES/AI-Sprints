import { McqQuestionForm } from "@/components/mcq/McqQuestionForm";
import { getDashboardUser } from "@/lib/auth/dashboard-session";

export const dynamic = "force-dynamic";

export default async function NewQuestionPage() {
	await getDashboardUser();
	return <McqQuestionForm mode="create" />;
}
