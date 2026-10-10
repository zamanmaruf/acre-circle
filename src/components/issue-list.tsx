import { formatGrowerList, type IssueGroup } from "@/lib/issues";
import { Badge, cn } from "./ui";

export function IssueList({ groups, className }: { groups: IssueGroup[]; className?: string }) {
  if (groups.length === 0) return <p className={cn("text-[13px] text-forest", className)}>Nothing left to confirm.</p>;
  return (
    <ul className={cn("space-y-2.5", className)}>
      {groups.map((g) => (
        <li key={g.key} className="flex gap-2.5 text-[13px] leading-snug">
          <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", g.kind === "deferred" ? "bg-danger" : "bg-warn")} />
          <span className="min-w-0">
            <span className="text-ink/85">{g.text}</span>
            <span className="mt-1 flex flex-wrap gap-1.5">
              {g.kind === "deferred" && <Badge tone="warn">Deferred</Badge>}
              {g.growers.length > 0 ? (
                <Badge tone="neutral">{formatGrowerList(g.growers)}</Badge>
              ) : (
                <Badge tone="neutral">Whole property</Badge>
              )}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
