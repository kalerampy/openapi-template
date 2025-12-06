import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { tasksRouter } from "./endpoints/tasks/router";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { DummyEndpoint } from "./endpoints/dummyEndpoint";
import { authRouter } from "./endpoints/auth";
import { HTTPException } from "hono/http-exception";
import { authMiddleware } from "./middleware/auth";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Conditionally protect the documentation endpoint in production only
app.use("/documentation", async (c, next) => {
	// Only require authentication in production
	if (c.env.ENVIRONMENT === "production") {
		return authMiddleware(c, next);
	}
	await next();
});

app.onError((err, c) => {
	if (err instanceof ApiException) {
		// If it's a Chanfana ApiException, let Chanfana handle the response
		return c.json(
			{ success: false, errors: err.buildResponse() },
			err.status as ContentfulStatusCode,
		);
	}

	if (err instanceof HTTPException) {
		// Handle Hono HTTPException (used by auth middleware)
		return c.json(
			{
				success: false,
				errors: [{ code: err.status, message: err.message }],
			},
			err.status as ContentfulStatusCode,
		);
	}

	console.error("Global error handler caught:", err); // Log the error if it's not known

	// For other errors, return a generic 500 response
	return c.json(
		{
			success: false,
			errors: [{ code: 7000, message: "Internal Server Error" }],
		},
		500,
	);
});

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/documentation",
	schema: {
		info: {
			title: "My Awesome API",
			version: "2.0.0",
			description: "This is the documentation for my awesome API with JWT authentication.",
		},
	},
});

// Register Tasks Sub router
openapi.route("/tasks", tasksRouter);

openapi.route("/auth", authRouter)
// Register other endpoints
openapi.post("/dummy/:slug", DummyEndpoint);

// Export the Hono app
export default app;
