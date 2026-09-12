import { Hono } from "hono";
import {
  registerController,
  loginController,
  logoutController,
  meController,
} from "./auth.controller.ts";
import { requireAuth } from "../../lib/auth/middleware.ts";

const router = new Hono();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/logout", logoutController);
router.get("/me", requireAuth, meController);

export default router;
