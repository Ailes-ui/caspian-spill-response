import { createFileRoute } from "@tanstack/react-router";
import { json, preflight } from "@/lib/oilwatch/http";
import { advance } from "@/lib/oilwatch/store";

// POST /api/incidents/:id/advance — move to the next status (also updates the asset)
export const Route = createFileRoute("/api/incidents/$id/advance")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const r = advance(params.id);
        return "error" in r ? json({ error: r.error }, r.status) : json(r);
      },
      OPTIONS: async () => preflight(),
    },
  },
});
