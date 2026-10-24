import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { json, preflight } from "@/lib/oilwatch/http";
import { createIncident, kpis, listIncidents } from "@/lib/oilwatch/store";

const Body = z.object({
  coords: z.tuple([z.number().min(36).max(48), z.number().min(46).max(55)]),
  areaKm2: z.number().positive().max(100),
  source: z.enum(["drone", "satellite"]),
});

// GET /api/incidents — all incidents sorted by priority (+ KPI summary)
// POST /api/incidents — create a new incident from a detection
export const Route = createFileRoute("/api/incidents")({
  server: {
    handlers: {
      GET: async () => json({ incidents: listIncidents(), kpis: kpis() }),
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ error: "Invalid data" }, 400);
        return json(createIncident(parsed.data), 201);
      },
      OPTIONS: async () => preflight(),
    },
  },
});
