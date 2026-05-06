import type { McqOptionPayload } from "@/lib/mcq/types";

export function validateMcqBody(body: unknown): { ok: true; stem: string; options: McqOptionPayload[] } | { ok: false; message: string } {
	if (!body || typeof body !== "object") return { ok: false, message: "Invalid JSON" };
	const stem = typeof (body as { stem?: unknown }).stem === "string" ? (body as { stem: string }).stem.trim() : "";
	const rawOpts = (body as { options?: unknown }).options;
	if (!stem) return { ok: false, message: "Question text is required" };
	if (!Array.isArray(rawOpts)) return { ok: false, message: "Options must be an array" };
	const options: McqOptionPayload[] = [];
	for (let i = 0; i < rawOpts.length; i++) {
		const o = rawOpts[i];
		if (!o || typeof o !== "object") continue;
		const label = typeof (o as { label?: unknown }).label === "string" ? (o as { label: string }).label.trim() : "";
		if (!label) continue;
		const isCorrect = Boolean((o as { isCorrect?: unknown }).isCorrect);
		options.push({ label, isCorrect, sortOrder: i });
	}
	if (options.length < 2) return { ok: false, message: "Add at least two answer choices" };
	if (!options.some((o) => o.isCorrect)) return { ok: false, message: "Mark at least one correct answer" };
	return { ok: true, stem, options };
}
