import { z } from "zod";

// Database user model
export interface User {
	id: string;
	username: string;
	email: string;
	password_hash: string;
	created_at: string;
	updated_at: string;
}

// User response (without password)
export interface UserResponse {
	id: string;
	username: string;
	email: string;
	created_at: string;
	updated_at: string;
}

// Validation schemas
export const CreateUserSchema = z.object({
	username: z
		.string()
		.min(3, "Username must be at least 3 characters")
		.max(50, "Username must be at most 50 characters")
		.regex(
			/^[a-zA-Z0-9_-]+$/,
			"Username can only contain letters, numbers, underscores, and hyphens",
		),
	email: z.string().email("Invalid email address"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(100, "Password must be at most 100 characters"),
});

export const LoginSchema = z.object({
	username: z.string().min(1, "Username is required"),
	password: z.string().min(1, "Password is required"),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Convert a database user to a safe user response (removes password)
 */
export function toUserResponse(user: User): UserResponse {
	return {
		id: user.id,
		username: user.username,
		email: user.email,
		created_at: user.created_at,
		updated_at: user.updated_at,
	};
}
