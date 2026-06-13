"use client";

import { useState, useTransition } from "react";
import { Loader2, ShieldBan, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { setUserBlocked, updateUserRole } from "@/app/actions/admin-users";
import type { UserRole } from "@/lib/db/schema";
import { toast } from "sonner";

interface UserAdminActionsProps {
  userId: string;
  currentRole: UserRole;
  blocked: boolean;
  blockedReason?: string | null;
}

export function UserAdminActions({
  userId,
  currentRole,
  blocked,
  blockedReason,
}: UserAdminActionsProps) {
  const [role, setRole] = useState<UserRole>(currentRole);
  const [reason, setReason] = useState(blockedReason ?? "");
  const [pending, startTransition] = useTransition();

  function handleRoleSave() {
    startTransition(async () => {
      try {
        await updateUserRole(userId, role);
        toast.success(`Role updated to ${role}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update role");
      }
    });
  }

  function handleBlockToggle() {
    startTransition(async () => {
      try {
        if (blocked) {
          await setUserBlocked(userId, false);
          toast.success("User unblocked");
        } else {
          await setUserBlocked(userId, true, reason.trim() || undefined);
          toast.success("User blocked");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update access");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="user-role">Role</Label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            id="user-role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={pending}
            className="flex h-9 rounded-lg border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-bg))] px-3 text-sm text-[hsl(var(--admin-foreground))]"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || role === currentRole}
            onClick={handleRoleSave}
            className="border-[hsl(var(--admin-border))]"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save role"}
          </Button>
        </div>
        <p className="text-[11px] text-[hsl(var(--admin-muted))]">
          Admins can access the admin dashboard. Users with admin role or emails in ADMIN_EMAILS
          env can open /admin.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Account access</Label>
        {blocked && (
          <Textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Block reason (optional)"
            disabled={pending}
            className="text-sm bg-[hsl(var(--admin-bg))] border-[hsl(var(--admin-border))]"
          />
        )}
        <Button
          type="button"
          size="sm"
          variant={blocked ? "outline" : "destructive"}
          disabled={pending}
          onClick={handleBlockToggle}
          className={blocked ? "border-[hsl(var(--admin-border))]" : undefined}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : blocked ? (
            <>
              <ShieldCheck className="h-4 w-4" />
              Unblock user
            </>
          ) : (
            <>
              <ShieldBan className="h-4 w-4" />
              Block user
            </>
          )}
        </Button>
        <p className="text-[11px] text-[hsl(var(--admin-muted))]">
          Blocked users cannot use the dashboard until unblocked.
        </p>
      </div>
    </div>
  );
}
