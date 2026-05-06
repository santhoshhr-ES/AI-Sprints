import {
	EMAIL_PATTERN,
	MIN_PASSWORD_LENGTH,
	USERNAME_PATTERN,
} from "@/lib/auth/constants";

export type FieldErrors = Record<string, string>;

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function validateRegisterBody(input: {
	firstname?: unknown;
	lastname?: unknown;
	username?: unknown;
	email?: unknown;
	password?: unknown;
}): { ok: true; data: RegisterPayload } | { ok: false; errors: FieldErrors } {
	const errors: FieldErrors = {};
	const firstname = typeof input.firstname === "string" ? input.firstname.trim() : "";
	const lastname = typeof input.lastname === "string" ? input.lastname.trim() : "";
	const username = typeof input.username === "string" ? input.username.trim() : "";
	const emailRaw = typeof input.email === "string" ? input.email.trim() : "";
	const password = typeof input.password === "string" ? input.password : "";

	if (!firstname) errors.firstname = "First name is required";
	if (!lastname) errors.lastname = "Last name is required";
	if (!username) errors.username = "Username is required";
	else if (!USERNAME_PATTERN.test(username))
		errors.username = "Username must be 3–32 characters (letters, numbers, underscore)";

	const email = normalizeEmail(emailRaw);
	if (!email) errors.email = "Email is required";
	else if (!EMAIL_PATTERN.test(email)) errors.email = "Invalid email format";

	if (!password) errors.password = "Password is required";
	else if (password.length < MIN_PASSWORD_LENGTH)
		errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;

	if (Object.keys(errors).length > 0) return { ok: false, errors };

	return {
		ok: true,
		data: { firstname, lastname, username, email, password },
	};
}

export type RegisterPayload = {
	firstname: string;
	lastname: string;
	username: string;
	email: string;
	password: string;
};

export function validateLoginBody(input: {
	identifier?: unknown;
	password?: unknown;
}): { ok: true; data: LoginPayload } | { ok: false; errors: FieldErrors } {
	const errors: FieldErrors = {};
	const identifierRaw = typeof input.identifier === "string" ? input.identifier.trim() : "";
	const password = typeof input.password === "string" ? input.password : "";

	if (!identifierRaw) errors.identifier = "Username or email is required";
	if (!password) errors.password = "Password is required";

	if (Object.keys(errors).length > 0) return { ok: false, errors };

	const identifier = identifierRaw.includes("@")
		? normalizeEmail(identifierRaw)
		: identifierRaw;

	return { ok: true, data: { identifier, password } };
}

export type LoginPayload = {
	identifier: string;
	password: string;
};
