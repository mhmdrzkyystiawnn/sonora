import { Hono } from "hono";
import {
  searchArtistController,
  getArtistController,
  getArtistTopTracksController,
  getSimilarArtistsController,
} from "./artist.controller.ts";

const artistRouter = new Hono();

artistRouter.get("/search", searchArtistController);
artistRouter.get("/:artist", getArtistController);
artistRouter.get("/:artist/tracks", getArtistTopTracksController);
artistRouter.get("/:artist/similar", getSimilarArtistsController);

export default artistRouter;
