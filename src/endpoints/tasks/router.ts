import { Hono } from "hono";
import { fromHono } from "chanfana";
import { TaskList } from "./taskList";
import { TaskCreate } from "./taskCreate";
import { TaskRead } from "./taskRead";
import { TaskUpdate } from "./taskUpdate";
import { TaskDelete } from "./taskDelete";
import { authMiddleware } from "../../middleware/auth";

const app = new Hono();

// Apply authentication middleware to all task routes
app.use("/*", authMiddleware);

export const tasksRouter = fromHono(app);

tasksRouter.get("/", TaskList);
tasksRouter.post("/", TaskCreate);
tasksRouter.get("/:id", TaskRead);
tasksRouter.put("/:id", TaskUpdate);
tasksRouter.delete("/:id", TaskDelete);
