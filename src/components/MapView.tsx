// Leaflet map (browser only — loaded lazily). Shows incidents, assets and
// animates assigned assets moving in a straight line toward their incident.
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { priorityLevel } from "@/lib/oilwatch/logic";
import type { Asset, IncidentDTO } from "@/lib/api";

const ANIM_MS = 20_000; // demo: travel animation lasts 20 s regardless of real ETA

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function MapView({
  incidents = [], assets = [], onIncidentClick, onMapClick, pick, height = "100%",
}: {
  incidents?: IncidentDTO[]; assets?: Asset[]; onIncidentClick?: (id: string) => void;
  onMapClick?: (ll: [number, number]) => void; pick?: [number, number] | null; height?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const clickRef = useRef(onMapClick);
  clickRef.current = onMapClick;

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current).setView([45.5, 51.0], 6);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors", maxZoom: 18,
    }).addTo(m);
    m.on("click", (e) => clickRef.current?.([+e.latlng.lat.toFixed(3), +e.latlng.lng.toFixed(3)]));
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    const colors = { critical: cssVar("--critical"), medium: cssVar("--warn"), low: cssVar("--ok") };
    const info = cssVar("--info");
    const ok = cssVar("--ok");
    const moving: { marker: L.CircleMarker; from: L.LatLng; to: L.LatLng; start: number }[] = [];

    for (const inc of incidents) {
      const c = inc.status === "resolved" ? cssVar("--muted-foreground") : colors[priorityLevel(inc.priority.total)];
      // circle radius approximates slick area (demo scale)
      L.circle(inc.coords, { radius: Math.sqrt(inc.areaKm2 / Math.PI) * 1000 * 4, color: c, fillOpacity: 0.25, weight: 1 }).addTo(g);
      L.circleMarker(inc.coords, { radius: 8, color: c, fillColor: c, fillOpacity: 0.9, weight: 2 })
        .bindTooltip(`${inc.id} · priority ${inc.priority.total}`)
        .on("click", (e) => { L.DomEvent.stopPropagation(e); onIncidentClick?.(inc.id); })
        .addTo(g);
    }
    for (const a of assets) {
      const inc = incidents.find((i) => i.assetId === a.id && i.status !== "resolved");
      const color = a.status === "available" ? ok : info;
      const marker = L.circleMarker(a.base, { radius: 6, color, fillColor: cssVar("--card"), fillOpacity: 1, weight: 3 })
        .bindTooltip(`${a.name} (${a.baseName})`).addTo(g);
      if (inc && inc.assignedAt) {
        L.polyline([a.base, inc.coords], { color: info, dashArray: "6 6", weight: 2 }).addTo(g);
        if (inc.status === "recovering") marker.setLatLng(inc.coords);
        else moving.push({ marker, from: L.latLng(a.base), to: L.latLng(inc.coords), start: inc.assignedAt });
      }
    }
    let raf = 0;
    const tick = () => {
      const now = Date.now();
      for (const mv of moving) {
        const t = Math.min((now - mv.start) / ANIM_MS, 1);
        mv.marker.setLatLng([mv.from.lat + (mv.to.lat - mv.from.lat) * t, mv.from.lng + (mv.to.lng - mv.from.lng) * t]);
      }
      if (moving.length) raf = requestAnimationFrame(tick);
    };
    tick();
    if (pick) L.marker(pick, { icon: L.divIcon({ className: "", html: `<div style="width:14px;height:14px;border-radius:50%;background:${info};border:2px solid white"></div>` }) }).addTo(g);
    return () => cancelAnimationFrame(raf);
  }, [incidents, assets, pick, onIncidentClick]);

  return <div ref={el} style={{ height }} className="w-full rounded-lg border" />;
}
