"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, MessageCircle, RefreshCw, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  disconnectTelegramAction,
  generateTelegramLinkAction,
  getNotificationSettingsAction,
  sendTelegramTestAction,
  updateNotificationSettingsAction,
} from "@/app/actions/notifications";
import { toast } from "sonner";

type SettingsState = Awaited<ReturnType<typeof getNotificationSettingsAction>>;

interface NotificationSettingsFormProps {
  initial: SettingsState;
}

function PrefRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

export function NotificationSettingsForm({ initial }: NotificationSettingsFormProps) {
  const [settings, setSettings] = useState(initial);
  const [linkData, setLinkData] = useState<{
    deepLink: string | null;
    manualCommand: string;
    expiresAt: string;
  } | null>(
    initial.deepLink && initial.linkCode
      ? {
          deepLink: initial.deepLink,
          manualCommand: `/start ${initial.linkCode}`,
          expiresAt: initial.linkExpiresAt ?? "",
        }
      : null
  );
  const [polling, setPolling] = useState(false);
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

  function patch(partial: Partial<SettingsState>) {
    setSettings((s) => ({ ...s, ...partial }));
  }

  function save(partial: Parameters<typeof updateNotificationSettingsAction>[0]) {
    startTransition(async () => {
      try {
        await updateNotificationSettingsAction(partial);
        await refresh();
        toast.success("Preferences saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
        await refresh();
      }
    });
  }

  async function handleConnect() {
    startTransition(async () => {
      try {
        const result = await generateTelegramLinkAction();
        setLinkData({
          deepLink: result.deepLink,
          manualCommand: result.manualCommand,
          expiresAt: result.expiresAt,
        });
        setPolling(true);
        toast.success("Link generated — open Telegram to connect");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to generate link");
      }
    });
  }

  async function handleDisconnect() {
    startTransition(async () => {
      try {
        await disconnectTelegramAction();
        setLinkData(null);
        setPolling(false);
        await refresh();
        toast.success("Telegram disconnected");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to disconnect");
      }
    });
  }

  async function handleTest() {
    startTransition(async () => {
      try {
        await sendTelegramTestAction();
        toast.success("Test message sent");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Test failed");
      }
    });
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <section>
        <h3 className="text-sm font-medium mb-1">Email notifications</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Sent via Brevo when <code className="text-[11px]">BREVO_API_KEY</code> is configured.
        </p>
        <div className="divide-y divide-border/60 rounded-lg border border-border/60 px-4">
          <PrefRow
            label="Email enabled"
            description="Master toggle for all email alerts"
            checked={settings.emailEnabled}
            onCheckedChange={(v) => {
              patch({ emailEnabled: v });
              save({ emailEnabled: v });
            }}
            disabled={pending}
          />
          <PrefRow
            label="High match jobs"
            checked={settings.notifyHighMatch}
            onCheckedChange={(v) => {
              patch({ notifyHighMatch: v });
              save({ notifyHighMatch: v });
            }}
            disabled={pending}
          />
          <PrefRow
            label="Recruiter responses"
            checked={settings.notifyRecruiterResponse}
            onCheckedChange={(v) => {
              patch({ notifyRecruiterResponse: v });
              save({ notifyRecruiterResponse: v });
            }}
            disabled={pending}
          />
          <PrefRow
            label="Interview scheduled"
            checked={settings.notifyInterviewScheduled}
            onCheckedChange={(v) => {
              patch({ notifyInterviewScheduled: v });
              save({ notifyInterviewScheduled: v });
            }}
            disabled={pending}
          />
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="threshold">High match threshold</Label>
          <Input
            id="threshold"
            type="number"
            min={50}
            max={100}
            className="max-w-[120px]"
            value={settings.highMatchThreshold}
            onChange={(e) => patch({ highMatchThreshold: Number(e.target.value) })}
            onBlur={() => save({ highMatchThreshold: settings.highMatchThreshold })}
            disabled={pending}
          />
          <p className="text-xs text-muted-foreground">Only notify when match score is at or above this value.</p>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Telegram</h3>
          {settings.telegramConnected && (
            <Badge variant="secondary" className="text-[10px]">
              Connected
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Get job alerts and reports in Telegram. Requires{" "}
          <code className="text-[11px]">TELEGRAM_BOT_TOKEN</code> on the server.
        </p>

        {!settings.telegramConfigured ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            Telegram is not configured on this deployment. Add{" "}
            <code className="text-xs">TELEGRAM_BOT_TOKEN</code> and{" "}
            <code className="text-xs">TELEGRAM_BOT_USERNAME</code> to your environment.
          </div>
        ) : settings.telegramConnected ? (
          <div className="space-y-4 rounded-lg border border-border/60 p-4">
            <PrefRow
              label="Telegram notifications"
              description="Send alerts to your linked Telegram chat"
              checked={settings.telegramEnabled}
              onCheckedChange={(v) => {
                patch({ telegramEnabled: v });
                save({ telegramEnabled: v });
              }}
              disabled={pending}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleTest} disabled={pending}>
                Send test
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={pending}
              >
                <Unplug className="h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 rounded-lg border border-border/60 p-4">
            {!linkData ? (
              <Button type="button" onClick={handleConnect} disabled={pending}>
                Connect Telegram
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Open the link below in Telegram and tap <strong>Start</strong>. This page will
                  detect the connection automatically.
                </p>
                {linkData.deepLink ? (
                  <Button asChild variant="premium" className="w-full sm:w-auto">
                    <Link href={linkData.deepLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open in Telegram
                    </Link>
                  </Button>
                ) : (
                  <p className="text-sm">
                    Message{" "}
                    {settings.botUsername ? (
                      <code>@{settings.botUsername}</code>
                    ) : (
                      "your bot"
                    )}{" "}
                    with:
                    <br />
                    <code className="mt-2 inline-block rounded bg-muted px-2 py-1 text-xs">
                      {linkData.manualCommand}
                    </code>
                  </p>
                )}
                {!settings.botUsername && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Set TELEGRAM_BOT_USERNAME in .env for one-click deep links.
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw className={`h-3.5 w-3.5 ${polling ? "animate-spin" : ""}`} />
                  {polling ? "Waiting for connection…" : "Link expired?"}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={handleConnect}
                    disabled={pending}
                  >
                    New link
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {settings.telegramConfigured && (
          <details className="mt-4 text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">Webhook setup (admin)</summary>
            <p className="mt-2 leading-relaxed">
              Register your webhook once (replace token and URL):
              <br />
              <code className="mt-1 block break-all rounded bg-muted p-2 text-[10px]">
                {`curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=${typeof window !== "undefined" ? window.location.origin : "https://your-app.com"}/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"`}
              </code>
            </p>
          </details>
        )}
      </section>
    </div>
  );
}
