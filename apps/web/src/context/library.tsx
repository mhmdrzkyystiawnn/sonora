/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AddFavoriteInput, Favorite, FavoriteKind } from "@sonora/shared";
import { favoriteKey } from "@sonora/shared";
import * as libraryApi from "../api/library";
import { useAuth } from "./auth";

type FavoritesState = {
  userId: string;
  items: Favorite[];
};

type LibraryContextValue = {
  favorites: Favorite[];
  loading: boolean;
  isFavorite: (
    kind: FavoriteKind,
    name: string,
    artistName?: string | null,
  ) => boolean;
  toggleFavorite: (input: AddFavoriteInput) => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [favoritesState, setFavoritesState] = useState<FavoritesState | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isMounted = true;

    libraryApi
      .getFavorites()
      .then((data) => {
        if (isMounted) {
          setFavoritesState({ userId, items: data });
        }
      })
      .catch(() => {
        if (isMounted) {
          setFavoritesState({ userId, items: [] });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const favorites = useMemo(
    () => (userId && favoritesState?.userId === userId ? favoritesState.items : []),
    [userId, favoritesState],
  );

  const loading = useMemo(
    () =>
      Boolean(userId) && !(favoritesState && favoritesState.userId === userId),
    [userId, favoritesState],
  );

  const isFavorite = useCallback(
    (kind: FavoriteKind, name: string, artistName?: string | null) => {
      if (!userId) {
        return false;
      }

      const key = favoriteKey(kind, name, artistName);
      return favorites.some((favorite) => favorite.key === key);
    },
    [userId, favorites],
  );

  const toggleFavorite = useCallback(
    async (input: AddFavoriteInput) => {
      if (!userId) {
        return;
      }

      const key = favoriteKey(input.kind, input.name, input.artistName);
      const existing = favorites.find((favorite) => favorite.key === key);

      if (existing) {
        await libraryApi.removeFavorite(existing.id);
        setFavoritesState((prev) =>
          prev && prev.userId === userId
            ? { ...prev, items: prev.items.filter((item) => item.id !== existing.id) }
            : prev,
        );
      } else {
        const added = await libraryApi.addFavorite(input);
        setFavoritesState((prev) =>
          prev && prev.userId === userId
            ? { ...prev, items: [added, ...prev.items] }
            : { userId, items: [added] },
        );
      }
    },
    [userId, favorites],
  );

  return (
    <LibraryContext.Provider
      value={{ favorites, loading, isFavorite, toggleFavorite }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);

  if (!ctx) {
    throw new Error("useLibrary must be used within LibraryProvider");
  }

  return ctx;
}