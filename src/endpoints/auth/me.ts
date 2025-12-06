import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";
import { getAuthUser } from "../../middleware/auth";
import { UserRepository } from "../../repositories/userRepository";
import { HTTPException } from "hono/http-exception";
import { toUserResponse } from "../../models/user";

export default class Me extends OpenAPIRoute {
	public schema = {
		tags: ["Authentication"],
		summary: "Get current authenticated user information",
		operationId: "me",
		security: [{ BearerAuth: [] }],
		responses: {
			"200": {
				description: "Current user information",
				...contentJson({
					success: z.boolean(),
					result: z.object({
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
				description: "Unauthorized - Invalid or missing token",
			},
		},
	};

	public async handle(c: AppContext) {
		// Get authenticated user from context (set by auth middleware)
		const authUser = getAuthUser(c);

		// Fetch full user details from database
		const userRepo = new UserRepository(c.env.DB);
		const user = await userRepo.findById(authUser.userId);

		if (!user) {
			throw new HTTPException(404, {
				message: "User not found",
			});
		}

		return {
			success: true,
			result: {
				user: toUserResponse(user),
			},
		};
	}
}
