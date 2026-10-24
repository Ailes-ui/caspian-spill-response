// Incident detail: data, priority breakdown, timeline, assign/advance actions, report.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { LazyMap } from "@/components/LazyMap";
import { IncidentChip, PriorityBadge } from "@/components/StatusChip";
import { STATUS_LABEL } from "@/lib/oilwatch/logic";

export const Route = createFileRoute("/incidents/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — OilWatch AI` },
      { name: "description", content: `Incident card ${params.id}: priority, asset assignment, timeline (demo).` },
      { property: "og:title", content: `${params.id} — OilWatch AI` },
      { property: "og:description", content: "Incident card (demo data)." },
    ],
  }),
  component: IncidentPage,
});

const fmt = (t: number) => new Date(t).toLocaleString("en-GB");

function IncidentPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [showReport, setShowReport] = useState(false);
  const q = useQuery({ queryKey: ["incident", id], queryFn: () => api.incident(id), refetchInterval: 3000 });
  const assets = useQuery({ queryKey: ["assets"], queryFn: api.assets, refetchInterval: 3000 });
  const report = useQuery({ queryKey: ["report", id], queryFn: () => api.report(id), enabled: showReport });
  const refresh = () => qc.invalidateQueries();

  const assign = useMutation({
    mutationFn: () => api.assign(id),
    onSuccess: (r) => { toast.success(`Assigned: ${r.asset.name}, ETA ${Math.round(r.etaHours * 60)} min`); if (r.needsAdditionalAssets) toast.warning("Additional assets required"); refresh(); },
    onError: (e) => toast.error(String((e as Error).message)),
  });
  const adv = useMutation({
    mutationFn: () => api.advance(id),
    onSuccess: (r) => { toast.success(`Status: ${STATUS_LABEL[r.incident.status]}`); refresh(); },
    onError: (e) => toast.error(String((e as Error).message)),
  });

  if (q.error) return <p className="text-critical">{String((q.error as Error).message)}</p>;
  const i = q.data;
  if (!i) return <p className="text-muted-foreground">Loading…</p>;
  const asset = assets.data?.find((a) => a.id === i.assetId);

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center gap-2">
        <Link to="/" className="text-sm text-primary hover:underline">← Dashboard</Link>
        <h1 className="text-xl font-bold">{i.id}</h1>
        <IncidentChip status={i.status} />
        <PriorityBadge score={i.priority.total} />
      </div>

      <div className="no-print grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <section className="rounded-lg border bg-card p-4">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Coordinates</dt><dd>{i.coords[0]}, {i.coords[1]}</dd>
              <dt className="text-muted-foreground">Detected</dt><dd>{fmt(i.detectedAt)}</dd>
              <dt className="text-muted-foreground">Area</dt><dd>{i.areaKm2} km²</dd>
              <dt className="text-muted-foreground">Volume estimate</dt><dd>{i.volumeT} t <span className="text-xs text-muted-foreground">(thickness 0.0001 m — assumption)</span></dd>
              <dt className="text-muted-foreground">Source</dt><dd>{i.source === "drone" ? "Drone" : "Satellite"}</dd>
            </dl>
          </section>
          <section className="rounded-lg border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">Priority: {i.priority.total} / 100</h2>
            {[["Area (max 50)", i.priority.area, 50], ["Sensitivity (max 30)", i.priority.sensitivity, 30], ["Time since detection (max 20)", i.priority.time, 20]].map(([l, v, m]) => (
              <div key={l as string} className="mb-2">
                <div className="flex justify-between text-xs"><span>{l}</span><span>{v}</span></div>
                <div className="h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${((v as number) / (m as number)) * 100}%` }} /></div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Nearest sensitive zone: {i.priority.nearestSensitive} ({i.priority.nearestDistanceKm} km). Elapsed {i.priority.hoursSinceDetection} h.</p>
          </section>
          <section className="flex flex-wrap gap-2">
            <Button onClick={() => assign.mutate()} disabled={i.status !== "detected" || assign.isPending}>Assign best asset</Button>
            <Button variant="secondary" onClick={() => adv.mutate()} disabled={i.status === "detected" || i.status === "resolved" || adv.isPending}>Next status</Button>
            <Button variant="outline" onClick={() => { setShowReport(true); report.refetch(); }}>Generate report</Button>
          </section>
          {i.reasoning && (
            <section className="rounded-lg border bg-card p-4 text-sm">
              <h2 className="mb-1 font-semibold">Assignment: {asset?.name ?? i.assetId} · ETA {Math.round((i.etaHours ?? 0) * 60)} min</h2>
              {i.needsAdditionalAssets && <p className="mb-1 font-semibold text-critical">⚠ Additional assets required</p>}
              <p className="text-muted-foreground">{i.reasoning}</p>
            </section>
          )}
        </div>
        <div className="space-y-4">
          <div className="h-[300px]"><LazyMap incidents={[i]} assets={asset ? [asset] : []} /></div>
          <section className="rounded-lg border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">Timeline</h2>
            <ol className="space-y-1 border-l pl-3 text-sm">
              {i.timeline.map((t, n) => <li key={n}><span className="font-medium">{STATUS_LABEL[t.status]}</span> <span className="text-xs text-muted-foreground">{fmt(t.at)} — {t.note}</span></li>)}
            </ol>
          </section>
          <section className="rounded-lg border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">Operation log</h2>
            <ul className="space-y-1 font-mono text-xs">{i.log.map((l, n) => <li key={n}>{l}</li>)}</ul>
          </section>
        </div>
      </div>

      {showReport && report.data && (
        <section className="rounded-lg border bg-card p-6">
          <p className="mb-2 rounded bg-banner px-2 py-1 text-xs font-semibold text-banner-foreground">{report.data.disclaimer}</p>
          <h2 className="text-lg font-bold">Incident report {report.data.incident.id}</h2>
          <p className="mb-3 text-xs text-muted-foreground">Generated {fmt(report.data.generatedAt)}</p>
          <dl className="grid grid-cols-2 gap-1 text-sm">
            <dt>Coordinates</dt><dd>{report.data.incident.coords.join(", ")}</dd>
            <dt>Area / volume</dt><dd>{report.data.incident.areaKm2} km² / {report.data.incident.volumeT} t</dd>
            <dt>Priority</dt><dd>{report.data.incident.priority.total}</dd>
            <dt>Status</dt><dd>{STATUS_LABEL[report.data.incident.status]}</dd>
            <dt>Asset</dt><dd>{report.data.asset?.name ?? "not assigned"}</dd>
            <dt>ETA</dt><dd>{report.data.etaMinutes != null ? `${report.data.etaMinutes} min` : "—"}</dd>
            <dt>Recovered (est., simulation)</dt><dd>{report.data.estimatedRecoveredT} t (planned {report.data.plannedRecoveryT} t)</dd>
          </dl>
          <h3 className="mt-3 text-sm font-semibold">Timeline</h3>
          <ul className="text-sm">{report.data.incident.timeline.map((t, n) => <li key={n}>{fmt(t.at)} — {STATUS_LABEL[t.status]}</li>)}</ul>
          <Button className="no-print mt-4" onClick={() => window.print()}>Print / PDF</Button>
        </section>
      )}
    </div>
  );
}
