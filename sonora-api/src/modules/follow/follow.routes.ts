import { Hono } from "hono";
import { requireAuth } from "../../lib/auth/middleware.ts";
import {
  addFollowController,
  listFollowsController,
  removeFollowController,
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
} from "./follow.controller.ts";

const router = new Hono();

router.get("/follows", requireAuth, listFollowsController);
router.post("/follows", requireAuth, addFollowController);
router.delete("/follows/:id", requireAuth, removeFollowController);

router.get("/notifications", requireAuth, listNotificationsController);
router.post("/notifications/read-all", requireAuth, markAllNotificationsReadController);
router.post("/notifications/:id/read", requireAuth, markNotificationReadController);

export default router;
