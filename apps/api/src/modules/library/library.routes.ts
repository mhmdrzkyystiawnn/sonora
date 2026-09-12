import { Hono } from "hono";
import { requireAuth } from "../../lib/auth/middleware.ts";
import {
  addFavoriteController,
  addPlaylistTrackController,
  createPlaylistController,
  deletePlaylistController,
  getPlaylistController,
  listFavoritesController,
  listHistoryController,
  listPlaylistsController,
  logHistoryController,
  removeFavoriteController,
  removePlaylistTrackController,
  sharePlaylistController,
  unsharePlaylistController,
  updatePlaylistController,
} from "./library.controller.ts";

const router = new Hono();

router.use("*", requireAuth);

router.get("/favorites", listFavoritesController);
router.post("/favorites", addFavoriteController);
router.delete("/favorites/:id", removeFavoriteController);

router.get("/playlists", listPlaylistsController);
router.post("/playlists", createPlaylistController);
router.get("/playlists/:id", getPlaylistController);
router.patch("/playlists/:id", updatePlaylistController);
router.delete("/playlists/:id", deletePlaylistController);
router.post("/playlists/:id/tracks", addPlaylistTrackController);
router.delete("/playlists/:id/tracks/:trackId", removePlaylistTrackController);

router.get("/history", listHistoryController);
router.post("/history", logHistoryController);
router.post("/playlists/:id/share", sharePlaylistController);
router.post("/playlists/:id/unshare", unsharePlaylistController);

export default router;
