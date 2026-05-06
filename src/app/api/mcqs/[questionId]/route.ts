import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/auth/api-session";
import { executeBatch, executeMutation, executeQuery, executeQueryFirst } from "@/lib/d1-client";
import { validateMcqBody } from "@/lib/mcq/validate";

export const dynamic = "force-dynamic";

async function assertOwner(
	db: D1Database,
	questionId: number,
	userId: number,
): Promise<boolean> {
	const row = await executeQueryFirst<{ question_id: number }>(
		db,
		`SELECT question_id FROM mcq_questions WHERE question_id = ? AND created_by = ? AND deleted_at IS NULL`,
		[questionId, userId],
	);
	return !!row;
}

export async function GET(request: Request, ctx: { params: Promise<{ questionId: string }> }) {
	try {
		const userId = await getAuthedUserIdFromRequest(request);
		if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const questionId = Number((await ctx.params).questionId);
		if (!Number.isFinite(questionId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

		const { env } = getCloudflareContext();
		if (!(await assertOwner(env.DB, questionId, userId))) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		const question = await executeQueryFirst<{ question_id: number; stem: string }>(
			env.DB,
			`SELECT question_id, stem FROM mcq_questions WHERE question_id = ?`,
			[questionId],
		);
		const options = await executeQuery<{ label: string; is_correct: number; sort_order: number }>(
			env.DB,
			`SELECT label, is_correct, sort_order FROM mcq_options WHERE question_id = ? ORDER BY sort_order ASC`,
			[questionId],
		);

		return NextResponse.json({
			question: {
				question_id: question?.question_id,
				stem: question?.stem ?? "",
				options: options.map((o, i) => ({
					label: o.label,
					isCorrect: Boolean(o.is_correct),
					sortOrder: o.sort_order ?? i,
				})),
			},
		});
	} catch {
		return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
	}
}

export async function PUT(request: Request, ctx: { params: Promise<{ questionId: string }> }) {
	try {
		const userId = await getAuthedUserIdFromRequest(request);
		if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const questionId = Number((await ctx.params).questionId);
		if (!Number.isFinite(questionId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

		let json: unknown;
		try {
			json = await request.json();
		} catch {
			return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
		}

		const parsed = validateMcqBody(json);
		if (!parsed.ok) return NextResponse.json({ error: parsed.message }, { status: 400 });

		const { env } = getCloudflareContext();
		if (!(await assertOwner(env.DB, questionId, userId))) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		const { stem, options } = parsed;

		const batchOps = [
			{
				sql: `UPDATE mcq_questions SET stem = ?1, updated_at = datetime('now') WHERE question_id = ?2 AND created_by = ?3`,
				params: [stem, questionId, userId],
			},
			{
				sql: `DELETE FROM mcq_options WHERE question_id = ?1`,
				params: [questionId],
			},
			...options.map((o) => ({
				sql: `INSERT INTO mcq_options (question_id, label, is_correct, sort_order) VALUES (?1, ?2, ?3, ?4)`,
				params: [questionId, o.label, o.isCorrect ? 1 : 0, o.sortOrder],
			})),
		];

		await executeBatch(env.DB, batchOps);

		return NextResponse.json({ ok: true, question_id: questionId });
	} catch {
		return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
	}
}

export async function DELETE(request: Request, ctx: { params: Promise<{ questionId: string }> }) {
	try {
		const userId = await getAuthedUserIdFromRequest(request);
		if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const questionId = Number((await ctx.params).questionId);
		if (!Number.isFinite(questionId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

		const { env } = getCloudflareContext();
		if (!(await assertOwner(env.DB, questionId, userId))) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		await executeMutation(
			env.DB,
			`UPDATE mcq_questions SET deleted_at = datetime('now'), updated_at = datetime('now')
       WHERE question_id = ?1 AND created_by = ?2`,
			[questionId, userId],
		);

		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
	}
}
