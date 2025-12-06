import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { verifyTokenType, JWTPayload } from "../utils/jwt";

export interface AuthVariables {
	user: {
		userId: string;
		username: string;
	};
}

/**
 * JWT Authentication Middleware
 * Verifies the Bearer token in the Authorization header
 * and adds user information to the context
 */
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
	// Get Authorization header
	const authHeader = c.req.header("Authorization");

	if (!authHeader) {
		throw new HTTPException(401, {
			message: "Missing Authorization header",
		});
	}

	// Check if it's a Bearer token
	if (!authHeader.startsWith("Bearer ")) {
		throw new HTTPException(401, {
			message: "Invalid Authorization header format. Use: Bearer <token>",
		});
	}

	// Extract the token
	const token = authHeader.substring(7); // Remove 'Bearer ' prefix

	if (!token) {
		throw new HTTPException(401, {
			message: "Missing access token",
		});
	}

	// Get JWT secret from environment
	const jwtSecret = c.env.JWT_SECRET;
	if (!jwtSecret) {
		throw new HTTPException(500, {
			message: "JWT_SECRET not configured",
		});
	}

	// Verify the token
	const payload = await verifyTokenType(token, jwtSecret, "access");

	if (!payload) {
		throw new HTTPException(401, {
			message: "Invalid or expired access token",
		});
	}

	// Add user info to context
	c.set("user", {
		userId: payload.userId,
		username: payload.username,
	});

	await next();
}

/**
 * Helper to get authenticated user from context
 */
export function getAuthUser(c: Context): { userId: string; username: string } {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}
	return user;
}
