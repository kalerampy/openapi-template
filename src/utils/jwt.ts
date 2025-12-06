import jwt from "@tsndr/cloudflare-worker-jwt";

export interface JWTPayload {
	userId: string;
	username: string;
	exp: number;
	iat: number;
	type: "access" | "refresh";
}

export interface TokenPair {
	accessToken: string;
	refreshToken: string;
}

// Token expiration times
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

/**
 * Generate both access and refresh tokens for a user
 */
export async function generateTokenPair(
	userId: string,
	username: string,
	secret: string,
): Promise<TokenPair> {
	const now = Math.floor(Date.now() / 1000);

	const accessPayload: JWTPayload = {
		userId,
		username,
		type: "access",
		iat: now,
		exp: now + ACCESS_TOKEN_EXPIRY,
	};

	const refreshPayload: JWTPayload = {
		userId,
		username,
		type: "refresh",
		iat: now,
		exp: now + REFRESH_TOKEN_EXPIRY,
	};

	const [accessToken, refreshToken] = await Promise.all([
		jwt.sign(accessPayload, secret),
		jwt.sign(refreshPayload, secret),
	]);

	return {
		accessToken,
		refreshToken,
	};
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(
	token: string,
	secret: string,
): Promise<JWTPayload | null> {
	try {
		const isValid = await jwt.verify(token, secret);
		if (!isValid) {
			return null;
		}

		const decoded = jwt.decode(token);
		return decoded.payload as JWTPayload;
	} catch (error) {
		return null;
	}
}

/**
 * Verify that a token is of the expected type
 */
export async function verifyTokenType(
	token: string,
	secret: string,
	expectedType: "access" | "refresh",
): Promise<JWTPayload | null> {
	const payload = await verifyToken(token, secret);

	if (!payload || payload.type !== expectedType) {
		return null;
	}

	return payload;
}
