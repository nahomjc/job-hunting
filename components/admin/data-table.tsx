import { cn } from "@/lib/utils";

interface DataTableProps {
  columns: { key: string; label: string; className?: string; mono?: boolean }[];
  rows: Record<string, React.ReactNode>[];
  emptyMessage?: string;
  className?: string;
}

export function DataTable({
  columns,
  rows,
  emptyMessage = "No data yet",
  className,
}: DataTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-surface))]",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-bg))]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--admin-muted))]",
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-[hsl(var(--admin-muted))]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-[hsl(var(--admin-border))] last:border-0 transition-colors hover:bg-[hsl(var(--admin-bg)/0.5)]"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-[hsl(var(--admin-foreground))]",
                        col.mono && "font-mono text-[12px] tabular-nums",
                        col.className
                      )}
                    >
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
