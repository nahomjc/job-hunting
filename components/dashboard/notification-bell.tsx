"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NotificationInboxPanel,
  useNotificationUnreadCount,
} from "@/components/dashboard/notification-inbox-panel";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Standalone bell trigger — prefer HeaderUserMenu on dashboard header. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unreadCount = useNotificationUnreadCount();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <NotificationInboxPanel onNavigate={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
