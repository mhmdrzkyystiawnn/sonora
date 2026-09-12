/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AddFollowInput, Follow, Notification } from ".../shared/index";
import * as followApi from "../api/follow";
import { useAuth } from "./auth";

type FollowsState = {
  userId: string;
  items: Follow[];
};

type NotificationsState = {
  userId: string;
  items: Notification[];
};

type FollowContextValue = {
  follows: Follow[];
  followsLoading: boolean;
  isFollowing: (name: string) => boolean;
  toggleFollow: (input: AddFollowInput) => Promise<void>;
  notifications: Notification[];
  unreadCount: number;
  notificationsLoading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const FollowContext = createContext<FollowContextValue | null>(null);

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [followsState, setFollowsState] = useState<FollowsState | null>(null);
  const [notificationsState, setNotificationsState] =
    useState<NotificationsState | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isMounted = true;

    followApi
      .getFollows()
      .then((data) => {
        if (isMounted) {
          setFollowsState({ userId, items: data });
        }
      })
      .catch(() => {
        if (isMounted) {
          setFollowsState({ userId, items: [] });
        }
      });

    followApi
      .getNotifications()
      .then((data) => {
        if (isMounted) {
          setNotificationsState({ userId, items: data });
        }
      })
      .catch(() => {
        if (isMounted) {
          setNotificationsState({ userId, items: [] });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const follows = useMemo(
    () => (userId && followsState?.userId === userId ? followsState.items : []),
    [userId, followsState],
  );

  const notifications = useMemo(
    () =>
      userId && notificationsState?.userId === userId
        ? notificationsState.items
        : [],
    [userId, notificationsState],
  );

  const followsLoading = useMemo(
    () => Boolean(userId) && !(followsState && followsState.userId === userId),
    [userId, followsState],
  );

  const notificationsLoading = useMemo(
    () =>
      Boolean(userId) &&
      !(notificationsState && notificationsState.userId === userId),
    [userId, notificationsState],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const isFollowing = useCallback(
    (name: string) => {
      if (!userId) {
        return false;
      }

      const key = `artist:${name}`.toLowerCase().trim();
      return follows.some((follow) => follow.name.toLowerCase() === key);
    },
    [userId, follows],
  );

  const toggleFollow = useCallback(
    async (input: AddFollowInput) => {
      if (!userId) {
        return;
      }

      const existing = follows.find(
        (follow) => follow.name.toLowerCase() === input.name.toLowerCase(),
      );

      if (existing) {
        await followApi.removeFollow(existing.id);
        setFollowsState((prev) =>
          prev && prev.userId === userId
            ? {
                ...prev,
                items: prev.items.filter((item) => item.id !== existing.id),
              }
            : prev,
        );
      } else {
        const added = await followApi.addFollow(input);
        setFollowsState((prev) =>
          prev && prev.userId === userId
            ? { ...prev, items: [added, ...prev.items] }
            : { userId, items: [added] },
        );
      }
    },
    [userId, follows],
  );

  const markRead = useCallback(
    async (id: string) => {
      await followApi.markNotificationRead(id);
      setNotificationsState((prev) =>
        prev && prev.userId === userId
          ? {
              ...prev,
              items: prev.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
            }
          : prev,
      );
    },
    [userId],
  );

  const markAllRead = useCallback(async () => {
    await followApi.markAllNotificationsRead();
    setNotificationsState((prev) =>
      prev && prev.userId === userId
        ? { ...prev, items: prev.items.map((n) => ({ ...n, read: true })) }
        : prev,
    );
  }, [userId]);

  return (
    <FollowContext.Provider
      value={{
        follows,
        followsLoading,
        isFollowing,
        toggleFollow,
        notifications,
        unreadCount,
        notificationsLoading,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  const ctx = useContext(FollowContext);

  if (!ctx) {
    throw new Error("useFollow must be used within FollowProvider");
  }

  return ctx;
}