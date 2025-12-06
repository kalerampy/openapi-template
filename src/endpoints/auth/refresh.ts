import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";
import { generateTokenPair, verifyTokenType } from "../../utils/jwt";
import { HTTPException } from "hono/http-exception";

export default class RefreshToken extends OpenAPIRoute {
	public schema = {
		tags: ["Authentication"],
		summary: "Refresh access token using refresh token",
		operationId: "refresh-token",
		request: {
			body: contentJson(
				z.object({
					refreshToken: z.string().min(1, "Refresh token is required"),
				}),
			),
		},
		responses: {
			"200": {
				description: "New access token generated",
				...contentJson({
					success: z.boolean(),
					result: z.object({
						message: z.string(),
						accessToken: z.string(),
						refreshToken: z.string(),
						expiresIn: z.number(),
					}),
				}),
			},
			"401": {
				description: "Invalid or expired refresh token",
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
		const { refreshToken } = data.body;

		// Get JWT secret from environment
		const jwtSecret = c.env.JWT_SECRET;
		if (!jwtSecret) {
			throw new HTTPException(500, {
				message: "JWT_SECRET not configured",
			});
		}

		// Verify the refresh token
		const payload = await verifyTokenType(
			refreshToken,
			jwtSecret,
			"refresh",
		);

		if (!payload) {
			throw new HTTPException(401, {
				message: "Invalid or expired refresh token",
			});
		}

		// Generate new token pair
		const tokens = await generateTokenPair(
			payload.userId,
			payload.username,
			jwtSecret,
		);

		return {
			success: true,
			result: {
				message: "Token refreshed successfully",
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
				expiresIn: 900, // 15 minutes in seconds
			},
		};
	}
}
