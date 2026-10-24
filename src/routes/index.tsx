// Dashboard: KPI cards, incident list, map, asset list. All data from /api.
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { api } from "@/lib/api";
import { LazyMap } from "@/components/LazyMap";
import { AssetChip, IncidentChip, PriorityBadge } from "@/components/StatusChip";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Панель управления — OilWatch AI" },
      { name: "description", content: "Карта инцидентов и средств реагирования на Северном Каспии (демо-данные)." },
      { property: "og:title", content: "Панель управления — OilWatch AI" },
      { property: "og:description", content: "Карта инцидентов и средств реагирования на Северном Каспии (демо-данные)." },
    ],
  }),
  component: Dashboard,
});

function Kpi({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  // Poll the backend every 3 s so the map and lists stay live
  const inc = useQuery({ queryKey: ["incidents"], queryFn: api.incidents, refetchInterval: 3000 });
  const assets = useQuery({ queryKey: ["assets"], queryFn: api.assets, refetchInterval: 3000 });
  const open = useCallback((id: string) => navigate({ to: "/incidents/$id", params: { id } }), [navigate]);

  if (inc.error || assets.error) return <p className="text-critical">Не удалось связаться с сервером: {String(inc.error ?? assets.error)}</p>;
  const k = inc.data?.kpis;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Активные инциденты" value={k ? String(k.activeIncidents) : "…"} tone="text-critical" />
        <Kpi label="Доступные средства" value={k ? String(k.availableAssets) : "…"} tone="text-ok" />
        <Kpi label="Ср. время назначения, сек" value={k ? (k.avgAssignmentSec ?? "—").toString() : "…"} tone="text-foreground" />
        <Kpi label="Объём в сборе (оценка), т" value={k ? k.volumeInRecoveryT.toString() : "…"} tone="text-info" />
      </div>
      <div className="grid gap-3 lg:grid-cols-[280px_1fr_260px]">
        <section className="order-2 rounded-lg border bg-card lg:order-1">
          <h2 className="border-b px-3 py-2 text-sm font-semibold">Инциденты (по приоритету)</h2>
          <ul className="max-h-[560px] divide-y overflow-auto">
            {inc.data?.incidents.map((i) => (
              <li key={i.id}>
                <Link to="/incidents/$id" params={{ id: i.id }} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted">
                  <div>
                    <div className="text-sm font-semibold">{i.id}</div>
                    <div className="text-xs text-muted-foreground">{i.areaKm2} км² · {i.volumeT} т · {i.source === "drone" ? "дрон" : "спутник"}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <PriorityBadge score={i.priority.total} />
                    <IncidentChip status={i.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <div className="order-1 h-[380px] lg:order-2 lg:h-[600px]">
          <LazyMap incidents={inc.data?.incidents} assets={assets.data} onIncidentClick={open} />
        </div>
        <section className="order-3 rounded-lg border bg-card">
          <h2 className="border-b px-3 py-2 text-sm font-semibold">Средства реагирования</h2>
          <ul className="divide-y">
            {assets.data?.map((a) => (
              <li key={a.id} className="px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{a.name}</span>
                  <AssetChip status={a.status} />
                </div>
                <div className="text-xs text-muted-foreground">
                  {a.baseName} · {a.speedKmh} км/ч · {a.capacityT > 0 ? `${a.capacityT} т` : "только разведка"}
                  {a.incidentId && ` · → ${a.incidentId}`}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
