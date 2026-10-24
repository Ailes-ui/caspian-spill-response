import { createFileRoute } from "@tanstack/react-router";
import { json, preflight } from "@/lib/oilwatch/http";
import { assignBest } from "@/lib/oilwatch/store";

// POST /api/incidents/:id/assign — pick the best available asset (lowest ETA that fits volume)
export const Route = createFileRoute("/api/incidents/$id/assign")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const r = assignBest(params.id);
        return "error" in r ? json({ error: r.error }, r.status) : json(r);
      },
      OPTIONS: async () => preflight(),
    },
  },
});
