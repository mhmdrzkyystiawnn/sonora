import { Hono } from "hono";
import {
  genreTracksController,
  genreArtistsController,
} from "./genre.controller.ts";

const router = new Hono();

router.get("/:tag/tracks", genreTracksController);
router.get("/:tag/artists", genreArtistsController);

export default router;
