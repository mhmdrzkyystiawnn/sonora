import { Hono } from "hono";
import {
  getPopularTracks,
  getPopularArtists,
} from "./discovery.controller.ts";

const discoveryRoutes = new Hono();

discoveryRoutes.get("/popular-tracks", getPopularTracks);
discoveryRoutes.get("/popular-artists", getPopularArtists);

export default discoveryRoutes;
