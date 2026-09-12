import { Hono } from "hono";
import { requireAuth } from "../../lib/auth/middleware.ts";
import {
  forYouController,
  moodController,
  playlistDraftController,
  similarToController,
} from "./recommendation.controller.ts";

const router = new Hono();

router.get("/for-you", requireAuth, forYouController);
router.get("/similar-to/:artist", similarToController);
router.post("/mood", requireAuth, moodController);
router.post("/playlist-draft", requireAuth, playlistDraftController);

export default router;
