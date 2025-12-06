import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";
import { generateTokenPair } from "../../utils/jwt";
import { HTTPException } from "hono/http-exception";
import { UserRepository } from "../../repositories/userRepository";
import { LoginSchema, toUserResponse } from "../../models/user";

export default class Login extends OpenAPIRoute {
	public schema = {
		tags: ["Authentication"],
		summary: "Login with username and password",
		operationId: "login",
		request: {
			body: contentJson(LoginSchema),
		},
		responses: {
			"200": {
				description: "Successful login with JWT tokens",
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
			"401": {
				description: "Invalid credentials",
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
		const { username, password } = data.body;

		// Get JWT secret from environment
		const jwtSecret = c.env.JWT_SECRET;
		if (!jwtSecret) {
			throw new HTTPException(500, {
				message: "JWT_SECRET not configured",
			});
		}

		// Initialize user repository
		const userRepo = new UserRepository(c.env.DB);

		// Authenticate user
		const user = await userRepo.authenticate(username, password);

		if (!user) {
			throw new HTTPException(401, {
				message: "Invalid username or password",
			});
		}

		// Generate JWT access and refresh tokens
		const tokens = await generateTokenPair(user.id, user.username, jwtSecret);

		return {
			success: true,
			result: {
				message: "Login successful",
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
				expiresIn: 900, // 15 minutes in seconds
				user: toUserResponse(user),
			},
		};
	}
}
