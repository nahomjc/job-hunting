import { requireDb, auditLogs } from "@/lib/db";

export async function logAudit(data: {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  const db = requireDb();
  await db.insert(auditLogs).values(data);
}
