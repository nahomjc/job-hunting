"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getNotificationInbox,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notification-inbox";
import {
  formatNotificationTime,
  notificationAccent,
  notificationIcon,
} from "@/lib/notifications/display";
import type { Notification } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface NotificationInboxPanelProps {
  onNavigate?: () => void;
}

export function NotificationInboxPanel({ onNavigate }: NotificationInboxPanelProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotificationInbox();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="max-h-[320px] overflow-y-auto">
        {loading && items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/60">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              High-match jobs and interview alerts will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {items.map((notification) => {
              const Icon = notificationIcon(notification.type);
              const accent = notificationAccent(notification.type);

              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!notification.read) handleMarkRead(notification.id);
                    }}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                      !notification.read && "bg-primary/3"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        accent
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm leading-snug truncate",
                            !notification.read && "font-medium"
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.body}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1">
                        {formatNotificationTime(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-border/60 p-2">
        <Button asChild variant="ghost" size="sm" className="w-full text-xs">
          <Link href="/dashboard/notifications" onClick={onNavigate}>
            View all notifications
          </Link>
        </Button>
      </div>
    </>
  );
}

export function useNotificationUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getNotificationInbox()
      .then((data) => {
        if (!cancelled) setUnreadCount(data.unreadCount);
      })
      .catch(() => {
        if (!cancelled) setUnreadCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return unreadCount;
}
