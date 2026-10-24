// In-memory state of the demo (server side). Seeded on first use.
// NOTE: memory resets when the server restarts — fine for a demo.
import {
  type Asset, type Incident, chooseAsset, estimateVolumeT, NEXT_STATUS, priorityScore, STATUS_LABEL,
} from "./logic";

interface State { incidents: Incident[]; assets: Asset[] }
let state: State | null = null;

function seed(): State {
  const now = Date.now();
  const h = 3_600_000;
  const mk = (id: string, coords: [number, number], areaKm2: number, source: "drone" | "satellite", hoursAgo: number): Incident => ({
    id, coords, areaKm2, source, detectedAt: now - hoursAgo * h, registeredAt: now, status: "detected",
    assetId: null, assignedAt: null, etaHours: null, needsAdditionalAssets: false, reasoning: null,
    timeline: [{ status: "detected", at: now - hoursAgo * h, note: `Detected (${source === "drone" ? "drone" : "satellite"})` }],
    log: ["[DEMO] Incident registered in the system"],
  });
  const asset = (id: string, name: string, kind: Asset["kind"], base: [number, number], baseName: string, speedKmh: number, capacityT: number): Asset =>
    ({ id, name, kind, base, baseName, speedKmh, capacityT, status: "available", incidentId: null, returnAt: null });
  return {
    incidents: [
      mk("INC-001", [46.1, 51.2], 4.9, "satellite", 6),
      mk("INC-002", [45.6, 50.7], 1.2, "drone", 3),
      mk("INC-003", [44.4, 50.3], 0.6, "drone", 2),
      mk("INC-004", [43.8, 51.0], 2.3, "satellite", 10),
      mk("INC-005", [44.9, 51.3], 0.3, "drone", 1),
    ],
    assets: [
      asset("A", "Skimmer vessel A", "vessel", [47.1, 51.9], "Atyrau", 18, 40),
      asset("B", "Skimmer vessel B", "vessel", [44.55, 50.27], "Bautino", 20, 30),
      asset("R1", "Autonomous skimmer robot R1", "robot", [44.55, 50.27], "Bautino", 8, 5),
      asset("D1", "Recon drone D1", "drone", [43.65, 51.17], "Aktau", 60, 0),
      asset("D2", "Recon drone D2", "drone", [47.1, 51.9], "Atyrau", 60, 0),
    ],
  };
}

function getState(): State {
  if (!state) state = seed();
  // "returning" assets become available again after a short demo delay
  const now = Date.now();
  for (const a of state.assets) {
    if (a.status === "returning" && a.returnAt && now >= a.returnAt) { a.status = "available"; a.returnAt = null; }
  }
  return state;
}

/** Adds computed fields (volume, priority) for API responses. */
export function enrich(inc: Incident) {
  return { ...inc, volumeT: +estimateVolumeT(inc.areaKm2).toFixed(2), priority: priorityScore(inc, Date.now()) };
}
export type IncidentDTO = ReturnType<typeof enrich>;

export function listIncidents() {
  return getState().incidents.map(enrich).sort((a, b) => b.priority.total - a.priority.total);
}
export function getIncident(id: string) {
  const inc = getState().incidents.find((i) => i.id === id);
  return inc ? enrich(inc) : null;
}
export function listAssets() { return getState().assets; }

export function createIncident(data: { coords: [number, number]; areaKm2: number; source: "drone" | "satellite" }) {
  const s = getState();
  const id = `INC-${String(s.incidents.length + 1).padStart(3, "0")}`;
  const now = Date.now();
  const inc: Incident = {
    id, coords: data.coords, areaKm2: data.areaKm2, source: data.source, detectedAt: now, registeredAt: now,
    status: "detected", assetId: null, assignedAt: null, etaHours: null, needsAdditionalAssets: false, reasoning: null,
    timeline: [{ status: "detected", at: now, note: "Created from simulated analysis (demo)" }],
    log: ["[DEMO] Incident created from a new detection"],
  };
  s.incidents.push(inc);
  return enrich(inc);
}

export function assignBest(id: string) {
  const s = getState();
  const inc = s.incidents.find((i) => i.id === id);
  if (!inc) return { error: "Incident not found", status: 404 } as const;
  if (inc.status !== "detected") return { error: "Asset already assigned", status: 409 } as const;
  const choice = chooseAsset(inc, s.assets);
  if (!choice) return { error: "No available assets with capacity > 0", status: 409 } as const;
  const now = Date.now();
  inc.status = "assigned";
  inc.assetId = choice.asset.id;
  inc.assignedAt = now;
  inc.etaHours = choice.etaHours;
  inc.needsAdditionalAssets = choice.needsAdditionalAssets;
  inc.reasoning = choice.reasoning;
  inc.timeline.push({ status: "assigned", at: now, note: `Assigned: ${choice.asset.name}` });
  inc.log.push(`Assigned ${choice.asset.name}, ETA ${(choice.etaHours * 60).toFixed(0)} min`);
  if (choice.needsAdditionalAssets) inc.log.push("⚠ Additional assets required");
  choice.asset.status = "en_route";
  choice.asset.incidentId = inc.id;
  return { incident: enrich(inc), asset: choice.asset, etaHours: choice.etaHours, reasoning: choice.reasoning, needsAdditionalAssets: choice.needsAdditionalAssets };
}

export function advance(id: string) {
  const s = getState();
  const inc = s.incidents.find((i) => i.id === id);
  if (!inc) return { error: "Incident not found", status: 404 } as const;
  const next = NEXT_STATUS[inc.status];
  if (!next) return { error: inc.status === "detected" ? "Assign an asset first" : "Incident already resolved", status: 409 } as const;
  const asset = s.assets.find((a) => a.id === inc.assetId);
  const now = Date.now();
  inc.status = next;
  inc.timeline.push({ status: next, at: now, note: STATUS_LABEL[next] });
  if (asset) {
    if (next === "en_route") asset.status = "en_route";
    if (next === "recovering") asset.status = "recovering";
    if (next === "resolved") {
      asset.status = "returning";
      asset.returnAt = now + 30_000; // back to base after 30 s (demo)
      asset.incidentId = null;
      const recovered = Math.min(estimateVolumeT(inc.areaKm2), asset.capacityT);
      inc.log.push(`Operation complete. Estimated recovered ${recovered.toFixed(1)} t (simulation)`);
    }
  }
  inc.log.push(`Status → ${STATUS_LABEL[next]}`);
  return { incident: enrich(inc), asset };
}

export function report(id: string) {
  const s = getState();
  const inc = s.incidents.find((i) => i.id === id);
  if (!inc) return null;
  const asset = s.assets.find((a) => a.id === inc.assetId) ?? null;
  const volume = estimateVolumeT(inc.areaKm2);
  const recovered = asset ? Math.min(volume, asset.capacityT) : 0;
  return {
    disclaimer: "DEMO DATA — simulated scenario, not real incidents",
    generatedAt: Date.now(),
    incident: enrich(inc),
    asset,
    etaMinutes: inc.etaHours != null ? Math.round(inc.etaHours * 60) : null,
    estimatedRecoveredT: +(inc.status === "resolved" ? recovered : 0).toFixed(2),
    plannedRecoveryT: +recovered.toFixed(2),
  };
}

export function kpis() {
  const s = getState();
  const active = s.incidents.filter((i) => i.status !== "resolved");
  const assigned = s.incidents.filter((i) => i.assignedAt);
  const avgAssignSec = assigned.length
    ? assigned.reduce((sum, i) => sum + (i.assignedAt! - i.registeredAt) / 1000, 0) / assigned.length
    : null;
  const recovering = s.incidents.filter((i) => ["assigned", "en_route", "recovering"].includes(i.status));
  const volume = recovering.reduce((sum, i) => {
    const a = s.assets.find((x) => x.id === i.assetId);
    return sum + Math.min(estimateVolumeT(i.areaKm2), a?.capacityT ?? 0);
  }, 0);
  return {
    activeIncidents: active.length,
    availableAssets: s.assets.filter((a) => a.status === "available").length,
    avgAssignmentSec: avgAssignSec != null ? Math.round(avgAssignSec) : null,
    volumeInRecoveryT: +volume.toFixed(1),
  };
}
