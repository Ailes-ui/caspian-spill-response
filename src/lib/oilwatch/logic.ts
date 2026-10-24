// OilWatch AI — core business logic (pure functions, no I/O).
// Everything here is SIMULATED demo logic for a hackathon prototype.

export type IncidentStatus = "detected" | "assigned" | "en_route" | "recovering" | "resolved";
export type AssetStatus = "available" | "en_route" | "recovering" | "returning";
export type LatLng = [number, number];

export interface Asset {
  id: string;
  name: string;
  kind: "vessel" | "robot" | "drone";
  base: LatLng;
  baseName: string;
  speedKmh: number;
  capacityT: number;
  status: AssetStatus;
  incidentId: string | null;
  returnAt: number | null; // when a "returning" asset becomes available again
}

export interface TimelineEntry { status: IncidentStatus; at: number; note: string }

export interface Incident {
  id: string;
  coords: LatLng;
  areaKm2: number;
  source: "drone" | "satellite";
  detectedAt: number;   // when the spill was spotted
  registeredAt: number; // when it entered the system (used for "assignment time")
  status: IncidentStatus;
  assetId: string | null;
  assignedAt: number | null;
  etaHours: number | null;
  needsAdditionalAssets: boolean;
  reasoning: string | null;
  timeline: TimelineEntry[];
  log: string[];
}

// ---- Assumptions (configurable) ----
export const ASSUMPTIONS = {
  thicknessM: 0.0001, // average slick thickness, metres
  oilDensityKgM3: 850, // crude oil density
  maxAreaKm2: 5, // area that maps to 100% in the score
  maxHours: 24, // age that maps to 100% in the score
  sensitivityRadiusKm: 150, // beyond this distance sensitivity = 0
};

// Hardcoded sensitive points: protected zones and coastline (illustrative).
export const SENSITIVE_POINTS: { name: string; coords: LatLng }[] = [
  { name: "Ural Delta (protected zone)", coords: [46.95, 51.7] },
  { name: "North Caspian protected zone", coords: [46.4, 50.2] },
  { name: "Mangystau coast (Bautino)", coords: [44.55, 50.27] },
  { name: "Aktau coast", coords: [43.65, 51.17] },
];

/** Great-circle distance between two points in km (haversine formula). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Volume (t) = area_km2 * 1,000,000 m²/km² * thickness_m * density(850) / 1000 */
export function estimateVolumeT(areaKm2: number, thicknessM = ASSUMPTIONS.thicknessM): number {
  return (areaKm2 * 1_000_000 * thicknessM * ASSUMPTIONS.oilDensityKgM3) / 1000;
}

/** Priority 0-100 = 50*area + 30*sensitivity + 20*age, each part normalized 0..1. */
export function priorityScore(inc: Pick<Incident, "areaKm2" | "coords" | "detectedAt">, now: number) {
  const areaN = Math.min(inc.areaKm2 / ASSUMPTIONS.maxAreaKm2, 1);
  let nearest = SENSITIVE_POINTS[0];
  let minD = Infinity;
  for (const p of SENSITIVE_POINTS) {
    const d = haversineKm(inc.coords, p.coords);
    if (d < minD) { minD = d; nearest = p; }
  }
  const sensN = Math.max(0, 1 - minD / ASSUMPTIONS.sensitivityRadiusKm);
  const hours = Math.max(0, (now - inc.detectedAt) / 3_600_000);
  const timeN = Math.min(hours / ASSUMPTIONS.maxHours, 1);
  const area = 50 * areaN, sensitivity = 30 * sensN, time = 20 * timeN;
  return {
    total: Math.round(area + sensitivity + time),
    area: +area.toFixed(1),
    sensitivity: +sensitivity.toFixed(1),
    time: +time.toFixed(1),
    nearestSensitive: nearest.name,
    nearestDistanceKm: Math.round(minD),
    hoursSinceDetection: +hours.toFixed(1),
  };
}

export function priorityLevel(score: number): "critical" | "medium" | "low" {
  return score >= 60 ? "critical" : score >= 35 ? "medium" : "low";
}

/** Choose the best asset: lowest ETA among available ones that can carry the volume. */
export function chooseAsset(incident: Incident, assets: Asset[]) {
  const volume = estimateVolumeT(incident.areaKm2);
  const candidates = assets
    .filter((a) => a.status === "available" && a.capacityT > 0)
    .map((a) => {
      const distanceKm = haversineKm(a.base, incident.coords);
      return { asset: a, distanceKm, etaHours: distanceKm / a.speedKmh };
    })
    .sort((x, y) => x.etaHours - y.etaHours);
  if (candidates.length === 0) return null;
  const fitting = candidates.find((c) => c.asset.capacityT >= volume);
  const pick = fitting ?? candidates[0];
  const needsAdditionalAssets = !fitting;
  const reasoning =
    `Considered available assets: ${candidates.length}. ` +
    `Selected "${pick.asset.name}": distance ${pick.distanceKm.toFixed(1)} km, ` +
    `speed ${pick.asset.speedKmh} km/h, ETA ${(pick.etaHours * 60).toFixed(0)} min, ` +
    `capacity ${pick.asset.capacityT} t vs volume ${volume.toFixed(1)} t. ` +
    (needsAdditionalAssets
      ? "No single asset covers the volume — additional assets required."
      : "This is the fastest asset whose capacity covers the volume.");
  return { ...pick, needsAdditionalAssets, reasoning, volume };
}

export const NEXT_STATUS: Record<IncidentStatus, IncidentStatus | null> = {
  detected: null, // must be assigned first
  assigned: "en_route",
  en_route: "recovering",
  recovering: "resolved",
  resolved: null,
};

export const STATUS_LABEL: Record<IncidentStatus, string> = {
  detected: "Detected",
  assigned: "Assigned",
  en_route: "En route",
  recovering: "Recovering",
  resolved: "Resolved",
};

export const ASSET_STATUS_LABEL: Record<AssetStatus, string> = {
  available: "Available",
  en_route: "En route",
  recovering: "Recovering",
  returning: "Returning",
};

/** Unit economics for the pitch calculator. */
export function economics(input: { price: number; unitCost: number; cac: number; years: number }) {
  const margin = input.price - input.unitCost; // per client per year
  const marginPct = input.price > 0 ? (margin / input.price) * 100 : 0;
  const ltv = margin * input.years;
  const ltvCac = input.cac > 0 ? ltv / input.cac : 0;
  const paybackMonths = margin > 0 ? input.cac / (margin / 12) : Infinity;
  return { margin, marginPct, ltv, ltvCac, paybackMonths, healthy: ltvCac >= 3 };
}
