import { Hono } from "hono";
import { fromHono } from "chanfana";
import Login from "./login";
import RefreshToken from "./refresh";
import Register from "./register";
import Me from "./me";
import { authMiddleware } from "../../middleware/auth";

const app = new Hono();

export const authRouter = fromHono(app);

// Public routes (no authentication required)
authRouter.post("/register", Register);
authRouter.post("/login", Login);
authRouter.post("/refresh", RefreshToken);

// Protected routes (authentication required)
app.use("/me", authMiddleware);
authRouter.get("/me", Me);

