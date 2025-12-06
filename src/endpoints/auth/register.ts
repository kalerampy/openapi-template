import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";
import { generateTokenPair } from "../../utils/jwt";
import { HTTPException } from "hono/http-exception";
import { UserRepository } from "../../repositories/userRepository";
import { CreateUserSchema, toUserResponse } from "../../models/user";

export default class Register extends OpenAPIRoute {
	public schema = {
		tags: ["Authentication"],
		summary: "Register a new user account",
		operationId: "register",
		request: {
			body: contentJson(CreateUserSchema),
		},
		responses: {
			"201": {
				description: "User successfully registered",
				...contentJson({
					success: z.boolean(),
					result: z.object({
						message: z.string(),
						accessToken: z.string(),
						refreshToken: z.string(),
						expiresIn: z.number(),
						user: z.object({
							id: z.string(),
							username: z.string(),
							email: z.string(),
							created_at: z.string(),
							updated_at: z.string(),
						}),
					}),
				}),
			},
			"400": {
				description: "Validation error or user already exists",
				...contentJson({
					success: z.boolean(),
					errors: z.array(
						z.object({
							code: z.number(),
							message: z.string(),
						}),
					),
				}),
			},
		},
	};

	public async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { username, email, password } = data.body;

		// Get JWT secret from environment
		const jwtSecret = c.env.JWT_SECRET;
		if (!jwtSecret) {
			throw new HTTPException(500, {
				message: "JWT_SECRET not configured",
			});
		}

		// Initialize user repository
		const userRepo = new UserRepository(c.env.DB);

		// Check if username already exists
		const usernameExists = await userRepo.usernameExists(username);
		if (usernameExists) {
			throw new HTTPException(400, {
				message: "Username already taken",
			});
		}

		// Check if email already exists
		const emailExists = await userRepo.emailExists(email);
		if (emailExists) {
			throw new HTTPException(400, {
				message: "Email already registered",
			});
		}

		// Create the user
		let user;
		try {
			user = await userRepo.createUser(username, email, password);
		} catch (error) {
			throw new HTTPException(500, {
				message: "Failed to create user account",
			});
		}

		// Generate JWT tokens
		const tokens = await generateTokenPair(user.id, user.username, jwtSecret);

		// Return success response with tokens
		return c.json(
			{
				success: true,
				result: {
					message: "Registration successful",
					accessToken: tokens.accessToken,
					refreshToken: tokens.refreshToken,
					expiresIn: 900, // 15 minutes in seconds
					user: toUserResponse(user),
				},
			},
			201,
		);
	}
}
