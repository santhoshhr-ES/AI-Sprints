import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/auth/api-session";
import { executeBatch, executeQuery, executeQueryFirst } from "@/lib/d1-client";
import { validateMcqBody } from "@/lib/mcq/validate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const userId = await getAuthedUserIdFromRequest(request);
		if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const { env } = getCloudflareContext();
		const rows = await executeQuery<{
			question_id: number;
			stem: string;
			updated_at: string;
			option_count: number;
		}>(
			env.DB,
			`SELECT q.question_id, q.stem, q.updated_at,
        (SELECT COUNT(*) FROM mcq_options o WHERE o.question_id = q.question_id) AS option_count
       FROM mcq_questions q
       WHERE q.created_by = ? AND q.deleted_at IS NULL
       ORDER BY q.updated_at DESC
       LIMIT 50`,
			[userId],
		);

		return NextResponse.json({ questions: rows });
	} catch {
		return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const userId = await getAuthedUserIdFromRequest(request);
		if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		let json: unknown;
		try {
			json = await request.json();
		} catch {
			return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
		}

		const parsed = validateMcqBody(json);
		if (!parsed.ok) return NextResponse.json({ error: parsed.message }, { status: 400 });

		const { env } = getCloudflareContext();
		const { stem, options } = parsed;

		const inserted = await executeQueryFirst<{ question_id: number }>(
			env.DB,
			`INSERT INTO mcq_questions (stem, created_by, created_at, updated_at)
       VALUES (?1, ?2, datetime('now'), datetime('now'))
       RETURNING question_id`,
			[stem, userId],
		);

		if (!inserted?.question_id) {
			return NextResponse.json({ error: "Could not create question" }, { status: 500 });
		}

		const qid = inserted.question_id;
		const optionStatements = options.map((o) => ({
			sql: `INSERT INTO mcq_options (question_id, label, is_correct, sort_order) VALUES (?1, ?2, ?3, ?4)`,
			params: [qid, o.label, o.isCorrect ? 1 : 0, o.sortOrder],
		}));

		await executeBatch(env.DB, optionStatements);

		return NextResponse.json({
			question: {
				question_id: qid,
				stem,
				optionCount: options.length,
			},
		});
	} catch {
		return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
	}
}
