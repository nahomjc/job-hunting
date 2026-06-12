import { Bell } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthUser } from "@/lib/supabase/server";
import { notificationRepository } from "@/lib/repositories/notification-repository";

export default async function NotificationsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  let notifications: Awaited<ReturnType<typeof notificationRepository.findForUser>> = [];
  try {
    notifications = await notificationRepository.findForUser(user.id);
  } catch {
    // DB not configured
  }

  return (
    <>
      <Header title="Notifications" description="Alerts from your job hunting agents" />
      <div className="flex-1 p-4 md:p-8">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You'll be notified when high-match jobs are found, recruiters respond, or interviews are scheduled."
          />
        ) : (
          <div className="space-y-3 max-w-2xl">
            {notifications.map((notification) => (
              <Card key={notification.id} className={notification.read ? "opacity-60" : ""}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {!notification.read && <Badge variant="default" className="text-xs">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {notification.body}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.createdAt).toLocaleString()} · {notification.channel}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
