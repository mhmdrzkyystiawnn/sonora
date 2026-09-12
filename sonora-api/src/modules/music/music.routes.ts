import { Hono } from "hono";
import {
  searchMusicController,
  getSimilarTracksController,
  getTrackController,
} from "./music.controller.ts";

const musicRouter = new Hono();

musicRouter.get("/search", searchMusicController);
musicRouter.get("/:artist/:track/similar", getSimilarTracksController);
musicRouter.get("/:artist/:track", getTrackController);

export default musicRouter;
