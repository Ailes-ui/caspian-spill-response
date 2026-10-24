import { ASSET_STATUS_LABEL, STATUS_LABEL, priorityLevel, type AssetStatus, type IncidentStatus } from "@/lib/oilwatch/logic";

const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function IncidentChip({ status }: { status: IncidentStatus }) {
  const cls = status === "resolved" ? "bg-ok-soft text-ok" : status === "detected" ? "bg-critical-soft text-critical" : "bg-info-soft text-info";
  return <span className={`${base} ${cls}`}>{STATUS_LABEL[status]}</span>;
}

export function AssetChip({ status }: { status: AssetStatus }) {
  const cls = status === "available" ? "bg-ok-soft text-ok" : status === "returning" ? "bg-muted text-muted-foreground" : "bg-warn-soft text-warn";
  return <span className={`${base} ${cls}`}>{ASSET_STATUS_LABEL[status]}</span>;
}

export function PriorityBadge({ score }: { score: number }) {
  const lvl = priorityLevel(score);
  const cls = lvl === "critical" ? "bg-critical text-destructive-foreground" : lvl === "medium" ? "bg-warn text-banner-foreground" : "bg-ok text-primary-foreground";
  return <span className={`${base} ${cls}`}>{score}</span>;
}
