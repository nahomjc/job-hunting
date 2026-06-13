"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/server";
import { notificationRepository } from "@/lib/repositories/notification-repository";

export async function getNotificationInbox() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  try {
    const [items, unreadCount] = await Promise.all([
      notificationRepository.findRecentInApp(user.id, 8),
      notificationRepository.countUnread(user.id),
    ]);
    return { items, unreadCount };
  } catch {
    return { items: [], unreadCount: 0 };
  }
}

export async function markNotificationRead(id: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  await notificationRepository.markRead(user.id, id);
  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsRead() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  await notificationRepository.markAllRead(user.id);
  revalidatePath("/dashboard/notifications");
}
