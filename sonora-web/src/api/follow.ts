import type { AddFollowInput, Follow, Notification } from ".../shared/index";
import { request } from "./client";

export async function getFollows(): Promise<Follow[]> {
  const response = await request<{ data: Follow[] }>("/api/follows");
  return response.data;
}

export async function addFollow(input: AddFollowInput): Promise<Follow> {
  const response = await request<{ data: Follow }>("/api/follows", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function removeFollow(followId: string): Promise<void> {
  await request<{ success: boolean }>(`/api/follows/${followId}`, {
    method: "DELETE",
  });
}

export async function getNotifications(): Promise<Notification[]> {
  const response = await request<{ data: Notification[] }>(
    "/api/notifications",
  );
  return response.data;
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const response = await request<{ data: Notification }>(
    `/api/notifications/${id}/read`,
    { method: "POST" },
  );
  return response.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await request<{ success: boolean }>("/api/notifications/read-all", {
    method: "POST",
  });
}