export type McqListItem = {
	question_id: number;
	stem: string;
	updated_at: string;
	option_count: number;
};

export type McqOptionPayload = {
	label: string;
	isCorrect: boolean;
	sortOrder: number;
};
