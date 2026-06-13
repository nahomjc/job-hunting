import Link from "next/link";
import { ShieldBan } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BlockedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <ShieldBan className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Account suspended</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Your account has been blocked by an administrator. You cannot access the dashboard
          until your access is restored.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Back to homepage</Link>
        </Button>
      </div>
    </div>
  );
}
