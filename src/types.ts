import type { Context } from "hono";
import type { AuthVariables } from "./middleware/auth";

export type AppContext = Context<{ Bindings: Env; Variables: AuthVariables }>;
export type HandleArgs = [AppContext];
