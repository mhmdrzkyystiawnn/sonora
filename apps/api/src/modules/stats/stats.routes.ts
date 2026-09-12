import { Hono } from "hono";
import { requireAuth } from "../../lib/auth/middleware.ts";
import { getStatsController } from "./stats.controller.ts";

const router = new Hono();

router.use("*", requireAuth);
router.get("/me", getStatsController);

export default router;
