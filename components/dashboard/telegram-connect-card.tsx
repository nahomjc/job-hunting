"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  generateTelegramLinkAction,
  getNotificationSettingsAction,
} from "@/app/actions/notifications";
import type { NotificationSettingsDisplay } from "@/lib/services/notification-settings-display";
import { toast } from "sonner";

interface TelegramConnectCardProps {
  initial: NotificationSettingsDisplay;
}

export function TelegramConnectCard({ initial }: TelegramConnectCardProps) {
  const [settings, setSettings] = useState(initial);
  const [linkData, setLinkData] = useState<{
    deepLink: string | null;
    manualCommand: string;
  } | null>(
    initial.deepLink && initial.linkCode
      ? {
          deepLink: initial.deepLink,
          manualCommand: `/start ${initial.linkCode}`,
        }
      : null
  );
  const [polling, setPolling] = useState(Boolean(initial.deepLink && initial.linkCode));
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const next = await getNotificationSettingsAction();
    setSettings(next);
    if (next.telegramConnected) {
      setLinkData(null);
      setPolling(false);
    }
    return next;
  }, []);

  useEffect(() => {
    if (!polling) return;
    const id = setInterval(() => {
      void refresh();
    }, 2500);
    return () => clearInterval(id);
  }, [polling, refresh]);

  if (!settings.telegramConfigured) {
    return null;
  }

  if (settings.telegramConnected) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {settings.telegramEnabled
                ? "Telegram alerts are on"
                : "Telegram connected"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {settings.telegramEnabled
                ? "You'll get high-match jobs, interview updates, and weekly hunt reports in Telegram."
                : "Turn on Telegram notifications in settings to receive job hunt alerts."}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/dashboard/settings?tab=notifications">
            {settings.telegramEnabled ? "Manage alerts" : "Enable alerts"}
          </Link>
        </Button>
      </div>
    );
  }

  async function handleConnect() {
    startTransition(async () => {
      try {
        const result = await generateTelegramLinkAction();
        setLinkData({
          deepLink: result.deepLink,
          manualCommand: result.manualCommand,
        });
        setPolling(true);
        toast.success("Open Telegram and tap Start to finish connecting");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to generate link");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border/80 bg-gradient-to-br from-[#229ED9]/10 via-card/50 to-card/30 overflow-hidden">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#229ED9]/15 text-[#229ED9]">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">Get job hunt alerts on Telegram</h3>
              <Badge variant="secondary" className="text-[10px]">
                <Bell className="h-3 w-3 mr-1" />
                Recommended
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              Connect Telegram to be notified when high-match jobs are found, recruiters respond,
              interviews are scheduled, and your weekly hunt report is ready.
            </p>
          </div>
        </div>

        <div className="shrink-0 w-full lg:w-auto">
          {!linkData ? (
            <Button
              type="button"
              onClick={handleConnect}
              disabled={pending}
              variant="premium"
              className="w-full lg:w-auto"
            >
              <MessageCircle className="h-4 w-4" />
              Connect Telegram
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-border/60 bg-background/60 p-4 lg:min-w-[280px]">
              <p className="text-xs text-muted-foreground">
                Open Telegram and tap <strong>Start</strong>. This page detects the connection
                automatically.
              </p>
              {linkData.deepLink ? (
                <Button asChild variant="premium" className="w-full">
                  <Link href={linkData.deepLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open in Telegram
                  </Link>
                </Button>
              ) : (
                <p className="text-xs">
                  Message{" "}
                  {settings.botUsername ? (
                    <code>@{settings.botUsername}</code>
                  ) : (
                    "the bot"
                  )}{" "}
                  with{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5">{linkData.manualCommand}</code>
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className={`h-3.5 w-3.5 ${polling ? "animate-spin" : ""}`} />
                {polling ? "Waiting for connection…" : "Need a new link?"}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={handleConnect}
                  disabled={pending}
                >
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
